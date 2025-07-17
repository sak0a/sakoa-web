<template>
  <div v-if="chatbotEnabled" class="chatbot-container">
    <!-- Chatbot Toggle Button -->
    <button
      v-if="!isOpen"
      @click="toggleChat"
      class="chatbot-toggle"
      :class="{ 'has-notification': hasNewMessage }"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.697-.413l-2.678 1.34c-.37.186-.82-.149-.746-.592l.83-4.73C6.77 14.378 6 13.26 6 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
      </svg>
      <span v-if="hasNewMessage" class="notification-dot"></span>
    </button>

    <!-- Chatbot Window -->
    <div v-if="isOpen" class="chatbot-window">
      <!-- Header -->
      <div class="chatbot-header">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h3 class="font-semibold text-white">TF2 Server Assistant</h3>
        </div>
        <button @click="toggleChat" class="text-gray-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Messages Container -->
      <div ref="messagesContainer" class="chatbot-messages">
        <!-- Welcome Message -->
        <div v-if="messages.length === 0" class="message bot-message">
          <div class="message-content">
            <p>👋 Hi! I'm your TF2 Dodgeball Server assistant. I can help you with:</p>
            <ul class="mt-2 space-y-1 text-sm">
              <li>• Server commands and gameplay</li>
              <li>• Donation information and benefits</li>
              <li>• Statistics and leaderboards</li>
              <li>• Troubleshooting and support</li>
            </ul>
            <p class="mt-2 text-sm text-gray-300">What would you like to know?</p>
          </div>
        </div>

        <!-- Chat Messages -->
        <div
          v-for="message in messages"
          :key="message.id"
          class="message"
          :class="message.isUser ? 'user-message' : 'bot-message'"
        >
          <div class="message-content">
            <div v-if="message.isUser" class="user-text">{{ message.message }}</div>
            <div v-else class="bot-text" v-html="formatBotResponse(message.response)"></div>
          </div>
          <div class="message-time">
            {{ formatTime(message.timestamp) }}
          </div>
        </div>

        <!-- Typing Indicator -->
        <div v-if="isTyping" class="message bot-message">
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Suggestions -->
      <div v-if="currentSuggestions.length > 0" class="chatbot-suggestions">
        <button
          v-for="suggestion in currentSuggestions"
          :key="suggestion"
          @click="sendSuggestion(suggestion)"
          class="suggestion-button"
        >
          {{ suggestion }}
        </button>
      </div>

      <!-- Input Area -->
      <div class="chatbot-input">
        <div class="input-container">
          <input
            v-model="currentMessage"
            @keypress.enter="sendMessage"
            @input="handleInput"
            placeholder="Ask about commands, donations, gameplay..."
            class="message-input"
            :disabled="isTyping"
          />
          <button
            @click="sendMessage"
            :disabled="!currentMessage.trim() || isTyping"
            class="send-button"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'

// Reactive state
const isOpen = ref(false)
const messages = ref([])
const currentMessage = ref('')
const isTyping = ref(false)
const hasNewMessage = ref(false)
const currentSuggestions = ref([])
const messagesContainer = ref(null)
const chatbotEnabled = ref(true)

// Check if chatbot is enabled
const checkChatbotStatus = async () => {
  try {
    const response = await $fetch('/api/settings')
    chatbotEnabled.value = response.data?.chatbot?.enabled !== false
  } catch (error) {
    console.error('Failed to check chatbot status:', error)
    chatbotEnabled.value = true // Default to enabled if check fails
  }
}

// Toggle chat window
const toggleChat = () => {
  isOpen.value = !isOpen.value
  hasNewMessage.value = false
  
  if (isOpen.value) {
    nextTick(() => {
      scrollToBottom()
    })
  }
}

// Send message
const sendMessage = async () => {
  const message = currentMessage.value.trim()
  if (!message || isTyping.value) return

  // Check if chatbot is enabled before sending
  if (!chatbotEnabled.value) {
    const disabledMessage = {
      id: Date.now().toString(),
      message: '',
      response: 'The AI chatbot is currently disabled by the administrator.',
      timestamp: Date.now(),
      isUser: false
    }
    messages.value.push(disabledMessage)
    return
  }

  // Add user message
  const userMessage = {
    id: Date.now().toString(),
    message,
    response: '',
    timestamp: Date.now(),
    isUser: true
  }

  messages.value.push(userMessage)
  currentMessage.value = ''
  currentSuggestions.value = []
  isTyping.value = true

  await nextTick()
  scrollToBottom()

  try {
    // Call chatbot API with conversation history
    const response = await $fetch('/api/chatbot', {
      method: 'POST',
      body: {
        message,
        conversationHistory: messages.value
      }
    })

    // Handle disabled chatbot response
    if (response.disabled) {
      chatbotEnabled.value = false
      const disabledMessage = {
        id: (Date.now() + 1).toString(),
        message: '',
        response: response.response,
        timestamp: Date.now(),
        isUser: false
      }
      messages.value.push(disabledMessage)
      return
    }

    // Add bot response
    const botMessage = {
      id: (Date.now() + 1).toString(),
      message: '',
      response: response.response,
      timestamp: Date.now(),
      isUser: false
    }

    messages.value.push(botMessage)
    currentSuggestions.value = response.suggestions || []

    if (!isOpen.value) {
      hasNewMessage.value = true
    }

  } catch (error) {
    console.error('Chatbot error:', error)

    // Add error message
    const errorMessage = {
      id: (Date.now() + 1).toString(),
      message: '',
      response: 'Sorry, I encountered an error. Please try again.',
      timestamp: Date.now(),
      isUser: false
    }

    messages.value.push(errorMessage)
  } finally {
    isTyping.value = false
    await nextTick()
    scrollToBottom()
  }
}

// Send suggestion as message
const sendSuggestion = (suggestion) => {
  currentMessage.value = suggestion
  sendMessage()
}

// Handle input changes
const handleInput = () => {
  // Could add typing indicators or auto-suggestions here
}

// Format bot response with markdown-like formatting
const formatBotResponse = (response) => {
  return response
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '• ')
}

// Format timestamp
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// Scroll to bottom of messages
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Initialize with welcome suggestions
onMounted(async () => {
  await checkChatbotStatus()

  // Check chatbot status periodically (every 30 seconds)
  setInterval(checkChatbotStatus, 30000)

  currentSuggestions.value = [
    'Show me commands',
    'How do I donate?',
    'Server info',
    'How to play dodgeball'
  ]
})
</script>

<style scoped>
.chatbot-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.chatbot-toggle {
  @apply w-14 h-14 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center relative;
}

.chatbot-toggle:hover {
  @apply from-purple-700 to-purple-800 transform scale-105;
}

.chatbot-toggle.has-notification {
  @apply animate-pulse;
}

.notification-dot {
  @apply absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white;
}

.chatbot-window {
  @apply w-96 h-[32rem] bg-gray-900 rounded-lg shadow-2xl border border-gray-700 flex flex-col overflow-hidden;
  backdrop-filter: blur(10px);
  background: rgba(17, 24, 39, 0.95);
}

.chatbot-header {
  @apply flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white;
}

.chatbot-messages {
  @apply flex-1 overflow-y-auto p-5 space-y-4;
  scrollbar-width: thin;
  scrollbar-color: #6B7280 #374151;
}

.chatbot-messages::-webkit-scrollbar {
  width: 6px;
}

.chatbot-messages::-webkit-scrollbar-track {
  @apply bg-gray-700 rounded;
}

.chatbot-messages::-webkit-scrollbar-thumb {
  @apply bg-gray-500 rounded hover:bg-gray-400;
}

.message {
  @apply flex flex-col;
}

.user-message {
  @apply items-end;
}

.bot-message {
  @apply items-start;
}

.message-content {
  @apply max-w-sm rounded-lg px-4 py-3 text-sm leading-relaxed;
}

.user-message .message-content {
  @apply bg-purple-600 text-white;
}

.bot-message .message-content {
  @apply bg-gray-700 text-gray-100;
}

.message-time {
  @apply text-xs text-gray-500 mt-1 px-1;
}

.typing-indicator {
  @apply flex space-x-1;
}

.typing-indicator span {
  @apply w-2 h-2 bg-gray-400 rounded-full animate-bounce;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.1s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.2s;
}

.chatbot-suggestions {
  @apply p-3 border-t border-gray-700 flex flex-wrap gap-2;
}

.suggestion-button {
  @apply px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full hover:bg-purple-600 hover:text-white transition-colors;
}

.chatbot-input {
  @apply p-4 border-t border-gray-700;
}

.input-container {
  @apply flex space-x-3;
}

.message-input {
  @apply flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-sm resize-none;
  min-height: 44px;
}

.message-input:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.send-button {
  @apply bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center;
  min-width: 44px;
  min-height: 44px;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .chatbot-container {
    @apply bottom-4 right-4;
  }

  .chatbot-window {
    @apply w-80 h-96;
  }

  .chatbot-toggle {
    @apply w-12 h-12;
  }
}

/* Tablet and small desktop adjustments */
@media (max-width: 768px) {
  .chatbot-window {
    @apply w-80;
  }
}
</style>
