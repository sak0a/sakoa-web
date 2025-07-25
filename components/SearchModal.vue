<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="modalContainer"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click="closeModal"
    >
      <!-- Backdrop -->
      <div
        ref="backdrop"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm"
      ></div>

      <!-- Modal -->
      <div class="flex min-h-full items-start justify-center p-4 pt-24">
        <div
          ref="modal"
          class="relative w-full max-w-2xl bg-gray-900 rounded-2xl shadow-2xl border border-gray-700"
          @click.stop
        >
          <div class="search-content">
            <!-- Search Input -->
            <div class="p-6 border-b border-gray-700">
            <div class="relative">
              <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors duration-300" :class="{ 'text-primary-400': searchQuery }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                placeholder="Search players, donors, or content..."
                class="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                @keydown.escape="closeModal"
                @focus="onInputFocus"
                @blur="onInputBlur"
              />
              <div v-if="isLoading" class="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div class="loading-spinner"></div>
              </div>
            </div>
          </div>
          
          <!-- Search Results -->
          <div class="max-h-96 overflow-y-auto">
            <div v-if="isLoading" class="p-6 text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              <p class="text-gray-400 mt-2">Searching...</p>
            </div>
            
            <div v-else-if="searchQuery && results.length === 0" class="p-6 text-center">
              <svg class="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.44-.816-6.12-2.18C5.07 12.324 4 11.53 4 10.5c0-.93.07-1.824.18-2.68C4.69 5.84 6.34 4 8.5 4h7c2.16 0 3.81 1.84 4.32 3.82.11.856.18 1.75.18 2.68 0 1.03-1.07 1.824-1.88 2.32A7.962 7.962 0 0112 15z"/>
              </svg>
              <p class="text-gray-400">No results found for "{{ searchQuery }}"</p>
            </div>
            
            <div v-else-if="results.length > 0" class="p-2">
              <div v-for="(category, categoryName) in groupedResults" :key="categoryName" class="mb-4">
                <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">
                  {{ categoryName }} ({{ category.length }})
                </h3>
                <div class="space-y-1">
                  <div 
                    v-for="result in category" 
                    :key="result.id"
                    class="flex items-center p-3 mx-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
                    @click="selectResult(result)"
                  >
                    <div class="flex-shrink-0 w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center mr-3">
                      <component :is="getIcon(result.type)" class="w-5 h-5 text-primary-400" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-white font-medium truncate">{{ result.title }}</p>
                      <p class="text-gray-400 text-sm truncate">{{ result.description }}</p>
                    </div>
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Quick Actions -->
            <div v-if="!searchQuery" class="p-4 border-t border-gray-700">
              <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
              <div class="grid grid-cols-2 gap-2">
                <button 
                  v-for="action in quickActions" 
                  :key="action.id"
                  class="flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
                  @click="performAction(action)"
                >
                  <component :is="action.icon" class="w-5 h-5 text-primary-400 mr-3" />
                  <span class="text-white text-sm">{{ action.label }}</span>
                </button>
              </div>
            </div>
          </div>
          
            <!-- Footer -->
            <div class="p-4 border-t border-gray-700 text-center">
              <p class="text-xs text-gray-500">
                Press <kbd class="px-2 py-1 bg-gray-700 rounded text-xs">ESC</kbd> to close
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'select'])

const searchInput = ref(null)
const modalContainer = ref(null)
const backdrop = ref(null)
const modal = ref(null)
const searchQuery = ref('')
const isLoading = ref(false)
const results = ref([])
const isAnimating = ref(false)

const quickActions = [
  { id: 'donate', label: 'Make Donation', icon: 'HeartIcon', action: () => scrollToSection('donate') },
  { id: 'discord', label: 'Join Discord', icon: 'ChatIcon', action: () => window.open('https://discord.gg/JuxYYVEkzc', '_blank') },
  { id: 'leaderboard', label: 'View Leaderboard', icon: 'TrophyIcon', action: () => scrollToSection('leaderboard') },
  { id: 'server', label: 'Server Status', icon: 'ServerIcon', action: () => scrollToSection('server-status') }
]

const groupedResults = computed(() => {
  const grouped = {}
  results.value.forEach(result => {
    if (!grouped[result.type]) {
      grouped[result.type] = []
    }
    grouped[result.type].push(result)
  })
  return grouped
})

const animateIn = () => {
  if (!modalContainer.value || !backdrop.value || !modal.value) return

  isAnimating.value = true

  // Set initial states with force3D for better performance
  gsap.set(backdrop.value, { opacity: 0, force3D: true })
  gsap.set(modal.value, { opacity: 0, scale: 0.95, y: 30, force3D: true })

  // Create optimized timeline
  const tl = gsap.timeline({
    onComplete: () => {
      isAnimating.value = false
    }
  })

  // Faster, smoother animations
  tl.to(backdrop.value, {
    opacity: 1,
    duration: 0.2,
    ease: 'power1.out'
  })
  .to(modal.value, {
    opacity: 1,
    scale: 1,
    y: 0,
    duration: 0.3,
    ease: 'power2.out',
    force3D: true
  }, '-=0.1')

  // Simplified content animation
  const contentElements = modal.value.querySelectorAll('.search-content > *')
  if (contentElements.length > 0) {
    tl.from(contentElements, {
      opacity: 0,
      y: 8,
      duration: 0.2,
      stagger: 0.03,
      ease: 'power1.out',
      force3D: true
    }, '-=0.15')
  }
}

const animateOut = () => {
  if (!modalContainer.value || !backdrop.value || !modal.value) return

  isAnimating.value = true

  // Optimized closing animation
  const tl = gsap.timeline({
    onComplete: () => {
      emit('close')
      searchQuery.value = ''
      results.value = []
      isAnimating.value = false
    }
  })

  // Smooth, fast closing
  tl.to(modal.value, {
    opacity: 0,
    scale: 0.98,
    y: -8,
    duration: 0.15,
    ease: 'power1.in',
    force3D: true
  })
  .to(backdrop.value, {
    opacity: 0,
    duration: 0.15,
    ease: 'power1.in',
    force3D: true
  }, '-=0.05')
}

const closeModal = () => {
  if (isAnimating.value) return
  animateOut()
}

// Input focus/blur handlers for micro-interactions
const onInputFocus = () => {
  if (searchInput.value) {
    gsap.to(searchInput.value, {
      scale: 1.02,
      duration: 0.2,
      ease: 'power2.out'
    })
  }
}

const onInputBlur = () => {
  if (searchInput.value) {
    gsap.to(searchInput.value, {
      scale: 1,
      duration: 0.2,
      ease: 'power2.out'
    })
  }
}

const selectResult = (result) => {
  emit('select', result)
  closeModal()
}

const performAction = (action) => {
  action.action()
  closeModal()
}

const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const getIcon = (type) => {
  const icons = {
    'Players': 'UserIcon',
    'Donors': 'HeartIcon',
    'Content': 'DocumentIcon'
  }
  return icons[type] || 'SearchIcon'
}

const searchContent = async (query) => {
  if (!query.trim()) {
    results.value = []
    return
  }

  isLoading.value = true
  
  try {
    // Simulate API call - replace with actual search implementation
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Mock search results
    results.value = [
      {
        id: 1,
        type: 'Players',
        title: 'saka',
        description: 'Top player with 1,247 points'
      },
      {
        id: 2,
        type: 'Donors',
        title: 'Anonymous Donor',
        description: 'Contributed €50 this month'
      },
      {
        id: 3,
        type: 'Content',
        title: 'Server Rules',
        description: 'Community guidelines and server rules'
      }
    ].filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    )
  } catch (error) {
    console.error('Search error:', error)
    results.value = []
  } finally {
    isLoading.value = false
  }
}

watch(searchQuery, (newQuery) => {
  searchContent(newQuery)
})

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    animateIn()
    // Focus input after animation starts
    setTimeout(() => {
      searchInput.value?.focus()
    }, 150)
  }
})
</script>

<style scoped>
/* Performance optimizations */
.fixed {
  will-change: transform, opacity;
}

.search-content > * {
  will-change: transform, opacity;
}

/* Smooth backdrop */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
</style>
