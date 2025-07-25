<template>
  <div class="progress-bar-container">
    <div class="flex justify-between items-center mb-3">
      <span class="text-sm font-medium text-gray-300">{{ label }}</span>
      <span class="text-sm font-bold text-white">{{ displayProgress }}%</span>
    </div>
    
    <div class="progress-bar-track">
      <div 
        ref="progressRef"
        class="progress-bar-fill"
        :style="{ width: `${animatedProgress}%` }"
      >
        <div class="progress-bar-shine"></div>
      </div>
      
      <!-- Milestone markers -->
      <div 
        v-for="milestone in milestones" 
        :key="milestone.value"
        class="milestone-marker"
        :style="{ left: `${milestone.value}%` }"
        :class="{ 'reached': animatedProgress >= milestone.value }"
      >
        <div class="milestone-dot"></div>
        <div class="milestone-label">{{ milestone.label }}</div>
      </div>
    </div>
    
    <div class="flex justify-between items-center mt-2 text-xs text-gray-400">
      <span>{{ formatCurrency(current) }}</span>
      <span>{{ formatCurrency(target) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const props = defineProps({
  current: {
    type: Number,
    required: true
  },
  target: {
    type: Number,
    required: true
  },
  label: {
    type: String,
    default: 'Progress'
  },
  currency: {
    type: String,
    default: '€'
  },
  milestones: {
    type: Array,
    default: () => [
      { value: 25, label: '25%' },
      { value: 50, label: '50%' },
      { value: 75, label: '75%' }
    ]
  },
  animated: {
    type: Boolean,
    default: true
  },
  duration: {
    type: Number,
    default: 2
  }
})

const progressRef = ref(null)
const animatedProgress = ref(0)

const actualProgress = computed(() => {
  return Math.min((props.current / props.target) * 100, 100)
})

const displayProgress = computed(() => {
  return Math.round(animatedProgress.value)
})

const formatCurrency = (value) => {
  if (value >= 1000) {
    return `${props.currency}${(value / 1000).toFixed(1)}K`
  }
  return `${props.currency}${value}`
}

const animateProgress = () => {
  if (!props.animated) {
    animatedProgress.value = actualProgress.value
    return
  }

  gsap.to(animatedProgress, {
    value: actualProgress.value,
    duration: props.duration,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: progressRef.value,
      start: 'top 80%',
      once: true
    }
  })
}

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger)
  animateProgress()
})

watch([() => props.current, () => props.target], () => {
  animateProgress()
})
</script>

<style scoped>
.progress-bar-container {
  @apply w-full;
  padding-top: 4px; /* Prevent milestone dots from being cut off */
  padding-bottom: 8px; /* Space for milestone labels */
}

.progress-bar-track {
  @apply relative w-full h-3 bg-gray-800 rounded-full overflow-hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.progress-bar-fill {
  @apply h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full relative transition-all duration-300;
  box-shadow: 0 2px 8px rgba(147, 51, 234, 0.3);
}

.progress-bar-shine {
  @apply absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 rounded-full;
  animation: shine 2s ease-in-out infinite;
}

.milestone-marker {
  @apply absolute top-0 transform -translate-x-1/2;
  height: 100%;
  padding-top: 2px; /* Add padding to prevent overflow */
}

.milestone-dot {
  @apply w-3 h-3 bg-gray-600 rounded-full border-2 border-gray-800 transition-all duration-300;
  transform: translateY(-1px); /* Reduce the negative offset */
}

.milestone-marker.reached .milestone-dot {
  @apply bg-primary-400 border-primary-300 shadow-lg;
  box-shadow: 0 0 10px rgba(147, 51, 234, 0.5);
}

.milestone-label {
  @apply absolute top-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap;
}

.milestone-marker.reached .milestone-label {
  @apply text-primary-300 font-medium;
}

@keyframes shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
