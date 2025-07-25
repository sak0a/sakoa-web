/**
 * Font Optimization Plugin
 * Handles non-blocking font loading and provides fallbacks
 */

export default defineNuxtPlugin(() => {
  // Only run on client-side
  if (import.meta.server) return

  // Check if fonts are already loaded
  const fontsLoaded = sessionStorage.getItem('fonts-loaded')
  
  if (!fontsLoaded) {
    // Create a font loading promise
    const loadFonts = async () => {
      try {
        // Use Font Loading API if available
        if ('fonts' in document) {
          const inter = new FontFace(
            'Inter',
            'url(https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2)',
            { weight: '300 700', display: 'swap' }
          )
          
          const jetbrains = new FontFace(
            'JetBrains Mono',
            'url(https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2)',
            { weight: '400 600', display: 'swap' }
          )

          // Load fonts
          await Promise.all([
            inter.load(),
            jetbrains.load()
          ])

          // Add fonts to document
          document.fonts.add(inter)
          document.fonts.add(jetbrains)

          // Mark fonts as loaded
          sessionStorage.setItem('fonts-loaded', 'true')
          
          // Add class to body to indicate fonts are ready
          document.body.classList.add('fonts-loaded')
        }
      } catch (error) {
        console.warn('Font loading failed, using fallbacks:', error)
        // Fallback: load via link tag
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap'
        document.head.appendChild(link)
      }
    }

    // Load fonts after page is interactive
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadFonts)
    } else {
      // Use requestIdleCallback for better performance
      if ('requestIdleCallback' in window) {
        requestIdleCallback(loadFonts)
      } else {
        setTimeout(loadFonts, 100)
      }
    }
  } else {
    // Fonts already loaded, just add the class
    document.body.classList.add('fonts-loaded')
  }

  // Preload critical font files for next page loads
  const preloadFonts = () => {
    const fontUrls = [
      'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
      'https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2'
    ]

    fontUrls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'font'
      link.type = 'font/woff2'
      link.crossOrigin = 'anonymous'
      link.href = url
      document.head.appendChild(link)
    })
  }

  // Preload fonts for better subsequent page loads
  if ('requestIdleCallback' in window) {
    requestIdleCallback(preloadFonts)
  } else {
    setTimeout(preloadFonts, 1000)
  }
})
