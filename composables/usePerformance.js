export const usePerformance = () => {
  const metrics = ref({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null
  })

  const isSupported = process.client && 'PerformanceObserver' in window

  const observeMetric = (name, callback) => {
    if (!isSupported) return

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry)
        }
      })
      observer.observe({ entryTypes: [name] })
    } catch (error) {
      console.warn(`Performance observer for ${name} not supported:`, error)
    }
  }

  const initPerformanceMonitoring = () => {
    if (!isSupported) return

    // Largest Contentful Paint (LCP)
    observeMetric('largest-contentful-paint', (entry) => {
      metrics.value.lcp = Math.round(entry.startTime)
    })

    // First Input Delay (FID)
    observeMetric('first-input', (entry) => {
      metrics.value.fid = Math.round(entry.processingStart - entry.startTime)
    })

    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    observeMetric('layout-shift', (entry) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value
        metrics.value.cls = Math.round(clsValue * 1000) / 1000
      }
    })

    // First Contentful Paint (FCP)
    observeMetric('paint', (entry) => {
      if (entry.name === 'first-contentful-paint') {
        metrics.value.fcp = Math.round(entry.startTime)
      }
    })

    // Time to First Byte (TTFB)
    observeMetric('navigation', (entry) => {
      metrics.value.ttfb = Math.round(entry.responseStart - entry.requestStart)
    })

    // Log metrics for debugging (remove in production)
    if (process.dev) {
      watch(metrics, (newMetrics) => {
        console.log('Performance Metrics:', newMetrics)
      }, { deep: true })
    }
  }

  const getPerformanceScore = () => {
    const { lcp, fid, cls } = metrics.value
    
    if (!lcp || !fid || cls === null) return null

    // Google's Core Web Vitals thresholds
    const lcpScore = lcp <= 2500 ? 100 : lcp <= 4000 ? 50 : 0
    const fidScore = fid <= 100 ? 100 : fid <= 300 ? 50 : 0
    const clsScore = cls <= 0.1 ? 100 : cls <= 0.25 ? 50 : 0

    return Math.round((lcpScore + fidScore + clsScore) / 3)
  }

  const reportMetrics = () => {
    if (!isSupported) return

    // Report to analytics service (implement as needed)
    const score = getPerformanceScore()
    if (score !== null) {
      console.log(`Performance Score: ${score}/100`)
      
      // Example: Send to analytics
      // gtag('event', 'performance_score', {
      //   value: score,
      //   custom_parameter: metrics.value
      // })
    }
  }

  onMounted(() => {
    if (process.client) {
      initPerformanceMonitoring()
      
      // Report metrics after page load
      setTimeout(reportMetrics, 5000)
    }
  })

  return {
    metrics: readonly(metrics),
    getPerformanceScore,
    reportMetrics,
    isSupported
  }
}
