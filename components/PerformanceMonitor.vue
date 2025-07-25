<template>
  <div v-if="showMetrics && metrics" class="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50">
    <h3 class="font-bold mb-2">Performance Metrics</h3>
    <div class="space-y-1">
      <div>LCP: <span :class="getLCPClass(metrics.lcp)">{{ metrics.lcp }}ms</span></div>
      <div>FID: <span :class="getFIDClass(metrics.fid)">{{ metrics.fid }}ms</span></div>
      <div>CLS: <span :class="getCLSClass(metrics.cls)">{{ metrics.cls }}</span></div>
      <div>FCP: <span :class="getFCPClass(metrics.fcp)">{{ metrics.fcp }}ms</span></div>
    </div>
    <button @click="showMetrics = false" class="mt-2 text-xs opacity-60 hover:opacity-100">Hide</button>
  </div>
</template>

<script setup>
import { usePerformance } from '~/composables/usePerformance'

const { metrics, initPerformanceMonitoring } = usePerformance()
const showMetrics = ref(false)

// Show metrics in development or when URL contains ?perf=1
onMounted(() => {
  initPerformanceMonitoring()

  const isDev = process.env.NODE_ENV === 'development'
  const showPerf = new URLSearchParams(window.location.search).get('perf') === '1'
  showMetrics.value = isDev || showPerf
  
  // Keyboard shortcut to toggle metrics (Ctrl+Shift+P)
  const handleKeydown = (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      showMetrics.value = !showMetrics.value
    }
  }
  
  window.addEventListener('keydown', handleKeydown)
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
})

// Performance scoring functions
const getLCPClass = (lcp) => {
  if (lcp <= 2500) return 'text-green-400'
  if (lcp <= 4000) return 'text-yellow-400'
  return 'text-red-400'
}

const getFIDClass = (fid) => {
  if (fid <= 100) return 'text-green-400'
  if (fid <= 300) return 'text-yellow-400'
  return 'text-red-400'
}

const getCLSClass = (cls) => {
  if (cls <= 0.1) return 'text-green-400'
  if (cls <= 0.25) return 'text-yellow-400'
  return 'text-red-400'
}

const getFCPClass = (fcp) => {
  if (fcp <= 1800) return 'text-green-400'
  if (fcp <= 3000) return 'text-yellow-400'
  return 'text-red-400'
}
</script>
