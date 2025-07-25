<template>
  <div class="stats-counter">
    <div class="text-center">
      <div 
        ref="counterRef" 
        class="text-3xl md:text-4xl font-bold text-white mb-2"
        :class="{ 'animate-glow': isGlowing }"
      >
        {{ displayValue }}{{ suffix }}
      </div>
      <div class="text-gray-400 text-sm uppercase tracking-wider">
        {{ label }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const props = defineProps({
  value: {
    type: [Number, String],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  suffix: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 2
  },
  format: {
    type: String,
    default: 'number' // 'number', 'currency', 'percentage'
  },
  currency: {
    type: String,
    default: '€'
  },
  glow: {
    type: Boolean,
    default: false
  }
})

const counterRef = ref(null)
const displayValue = ref(0)
const isGlowing = ref(false)

const formatValue = (value) => {
  switch (props.format) {
    case 'currency':
      if (value >= 1000) {
        return `${props.currency}${(value / 1000).toFixed(1)}K`
      }
      return `${props.currency}${value}`
    case 'percentage':
      return `${value}%`
    case 'number':
    default:
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`
      }
      return value.toString()
  }
}

const animateCounter = () => {
  // Handle special string values that shouldn't be animated
  if (typeof props.value === 'string' && (props.value.includes('/') || props.value.includes('%'))) {
    displayValue.value = props.value
    // Still trigger glow effect for string values if enabled
    if (props.glow) {
      gsap.to(isGlowing, {
        value: true,
        duration: 0.5,
        delay: 0.5, // Small delay for string values
        scrollTrigger: {
          trigger: counterRef.value,
          start: 'top 80%',
          once: true
        }
      })
    }
    return
  }

  const targetValue = typeof props.value === 'string' ?
    parseFloat(props.value.replace(/[^\d.]/g, '')) : props.value

  if (isNaN(targetValue)) {
    displayValue.value = props.value
    // Still trigger glow effect for invalid numeric values if enabled
    if (props.glow) {
      gsap.to(isGlowing, {
        value: true,
        duration: 0.5,
        delay: 0.5,
        scrollTrigger: {
          trigger: counterRef.value,
          start: 'top 80%',
          once: true
        }
      })
    }
    return
  }

  gsap.to(displayValue, {
    value: targetValue,
    duration: props.duration,
    ease: 'power2.out',
    onUpdate: () => {
      displayValue.value = formatValue(Math.round(displayValue.value))
    },
    scrollTrigger: {
      trigger: counterRef.value,
      start: 'top 80%',
      once: true
    }
  })

  if (props.glow) {
    gsap.to(isGlowing, {
      value: true,
      duration: 0.5,
      delay: props.duration * 0.8,
      scrollTrigger: {
        trigger: counterRef.value,
        start: 'top 80%',
        once: true
      }
    })
  }
}

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger)
  animateCounter()
})

watch(() => props.value, () => {
  animateCounter()
})
</script>

<style scoped>
.stats-counter {
  @apply transition-all duration-300;
}

.animate-glow {
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    text-shadow: 0 0 10px rgba(147, 51, 234, 0.5);
  }
  to {
    text-shadow: 0 0 20px rgba(147, 51, 234, 0.8), 0 0 30px rgba(147, 51, 234, 0.6);
  }
}
</style>
