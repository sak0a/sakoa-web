<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
      {{ fileType === 'donors' ? 'Donors' : 'Servers' }} File Manager
    </h2>
    
    <!-- Current File Content -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Current {{ fileType }}.json Content
      </h3>
      <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
        <pre class="text-sm text-gray-800 dark:text-gray-200">{{ formattedCurrentData }}</pre>
      </div>
      <button 
        @click="loadCurrentFile"
        class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Refresh Current Data
      </button>
    </div>
    
    <!-- File Editor -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Edit {{ fileType }}.json
      </h3>
      <textarea
        v-model="editableData"
        class="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
        placeholder="Enter JSON data here..."
      ></textarea>
      <div class="mt-2 flex gap-2">
        <button 
          @click="validateAndSave"
          :disabled="loading"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {{ loading ? 'Saving...' : 'Save File' }}
        </button>
        <button 
          @click="resetToCurrentData"
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Reset to Current
        </button>
        <button 
          @click="generateTemplate"
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Generate Template
        </button>
      </div>
    </div>
    
    <!-- Status Messages -->
    <div v-if="message" class="mb-4">
      <div 
        :class="[
          'p-4 rounded-lg',
          messageType === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
        ]"
      >
        {{ message }}
      </div>
    </div>
    
    <!-- File Info -->
    <div class="text-sm text-gray-600 dark:text-gray-400">
      <p><strong>File Location:</strong> server/data/{{ fileType }}.json</p>
      <p><strong>Public Copy:</strong> public/{{ fileType }}.json (for static deployment)</p>
      <p><strong>Note:</strong> Changes will be saved to both locations automatically.</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  fileType: {
    type: String,
    required: true,
    validator: (value) => ['donors', 'servers'].includes(value)
  }
})

const { checkAuth } = useAdmin()
const currentData = ref({})
const editableData = ref('')
const loading = ref(false)
const message = ref('')
const messageType = ref('success')

// Get admin password from localStorage
const getAdminPassword = () => {
  if (process.client) {
    return localStorage.getItem('adminPassword') || ''
  }
  return ''
}

const formattedCurrentData = computed(() => {
  return JSON.stringify(currentData.value, null, 2)
})

// Load current file data
const loadCurrentFile = async () => {
  try {
    const password = getAdminPassword()
    if (!password) {
      showMessage('Admin password not found. Please log in again.', 'error')
      return
    }

    const response = await $fetch('/api/admin/files', {
      method: 'POST',
      body: {
        password: password,
        action: 'read',
        fileType: props.fileType
      }
    })

    if (response.success) {
      currentData.value = response.data
      editableData.value = JSON.stringify(response.data, null, 2)
    }
  } catch (error) {
    showMessage('Failed to load current file: ' + (error.data?.message || error.message), 'error')
  }
}

// Validate and save file
const validateAndSave = async () => {
  try {
    loading.value = true

    const password = getAdminPassword()
    if (!password) {
      showMessage('Admin password not found. Please log in again.', 'error')
      return
    }

    // Validate JSON
    let parsedData
    try {
      parsedData = JSON.parse(editableData.value)
    } catch (error) {
      throw new Error('Invalid JSON format: ' + error.message)
    }

    // Save file
    const response = await $fetch('/api/admin/files', {
      method: 'POST',
      body: {
        password: password,
        action: 'update',
        fileType: props.fileType,
        data: parsedData
      }
    })

    if (response.success) {
      currentData.value = parsedData
      showMessage(response.message, 'success')
    }

  } catch (error) {
    showMessage('Failed to save file: ' + (error.data?.message || error.message), 'error')
  } finally {
    loading.value = false
  }
}

// Reset to current data
const resetToCurrentData = () => {
  editableData.value = formattedCurrentData.value
  showMessage('Reset to current data', 'success')
}

// Generate template
const generateTemplate = () => {
  let template
  
  if (props.fileType === 'donors') {
    template = {
      donors: [
        {
          name: "Example Donor",
          tier: "VIP",
          donations: [
            {
              amount: 10.00,
              date: "2025-01-01"
            }
          ],
          amount: 10.00,
          steamid: "[U:1:XXXXXXXXX]"
        }
      ]
    }
  } else {
    template = {
      servers: [
        {
          id: "server1",
          name: "Example Server",
          host: "127.0.0.1",
          port: 27015,
          location: "🌍 Location",
          connectUrl: "steam://connect/127.0.0.1:27015",
          comingSoon: false
        }
      ]
    }
  }
  
  editableData.value = JSON.stringify(template, null, 2)
  showMessage('Template generated', 'success')
}

// Show message
const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 5000)
}

// Load data on mount
onMounted(() => {
  loadCurrentFile()
})
</script>
