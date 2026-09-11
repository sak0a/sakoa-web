import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-09-04',
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  modules: ['@nuxt/image', '@nuxt/eslint'],

  // Image optimization configuration
  image: {
    // Default format for all images
    format: ['webp', 'png'],
    // Quality settings
    quality: 80,
    // Enable responsive images
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
    // Provider configuration - enable for production to work with Docker
    provider: 'ipx',
    ipx: {
      // Enable WebP conversion
      modifiers: {
        format: 'webp',
        quality: 80
      }
    },
    // Presets for common use cases
    presets: {
      avatar: {
        modifiers: {
          format: 'webp',
          quality: 80,
          fit: 'cover'
        }
      },
      logo: {
        modifiers: {
          format: 'webp',
          quality: 90,
          fit: 'contain'
        }
      }
    }
  },
  css: ['~/assets/css/main.css', '~/assets/css/admin.css', '~/assets/css/player-account.css'],

  vite: {
    plugins: [tailwindcss()]
  },

  runtimeConfig: {
    // Private keys (only available on server-side)
    dbHost: process.env.DB_HOST || '',
    dbPort: process.env.DB_PORT || '3306',
    dbUser: process.env.DB_USER || '',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || '',
    adminPassword: process.env.ADMIN_PASSWORD || '',
    adminSessionSecret: process.env.ADMIN_SESSION_SECRET || '',
    steamApiKey: process.env.STEAM_API_KEY || '',
    playerColorWritesEnabled: process.env.PLAYER_COLOR_WRITES_ENABLED === 'true',
    // Public keys (exposed to client-side)
    public: {
      serverIp: '',
      siteUrl: process.env.PUBLIC_SITE_URL || ''
    }
  },
  nitro: {
    preset: 'node-server',
    minify: true,
    compressPublicAssets: true
  },
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
      }
    },
    '/_nuxt/builds/**': { prerender: false },
    '/admin/**': { ssr: false },
    '/assets/**': {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff'
      }
    },
    '/favicon.*': {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    },
    '/site.webmanifest': {
      headers: {
        'Cache-Control': 'public, max-age=86400'
      }
    },
    '/api/leaderboard': {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' }
    },
    '/api/donors': {
      headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=1200' }
    },
    '/api/server-status': {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' }
    },
    '/api/settings': {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' }
    }
  },
  // Additional SSR configuration for better stability
  ssr: true,
  // Enhanced SEO and Performance
  app: {
    head: {
      title: "saka's Dodgeball Server - Premium TF2 Gaming Experience",
      titleTemplate: '%s | saka\'s Dodgeball Server',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Join saka\'s premium Team Fortress 2 dodgeball server. 24/7 uptime, custom maps, active community, and competitive gameplay. Support our server through donations.' },
        { name: 'keywords', content: 'TF2, Team Fortress 2, dodgeball, server, gaming, community, donations, competitive, custom maps' },
        { name: 'author', content: 'saka\'s Dodgeball Server' },
        { name: 'robots', content: 'index, follow' },

        // Open Graph / Facebook
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://sakoa.xyz/' },
        { property: 'og:title', content: 'saka\'s Dodgeball Server - Premium TF2 Gaming' },
        { property: 'og:description', content: 'Join our premium Team Fortress 2 dodgeball server with 24/7 uptime, custom maps, and active community.' },
        { property: 'og:image', content: '/default-512x512.png' },
        { property: 'og:image:width', content: '512' },
        { property: 'og:image:height', content: '512' },
        { property: 'og:site_name', content: 'saka\'s Dodgeball Server' },

        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:url', content: 'https://sakoa.xyz/' },
        { name: 'twitter:title', content: 'saka\'s Dodgeball Server - Premium TF2 Gaming' },
        { name: 'twitter:description', content: 'Join our premium Team Fortress 2 dodgeball server with 24/7 uptime, custom maps, and active community.' },
        { name: 'twitter:image', content: '/default-512x512.png' },

        // Additional SEO
        { name: 'theme-color', content: '#734C96' },
        { name: 'msapplication-TileColor', content: '#734C96' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ],
      style: [
        {
          innerHTML: `
            /* Critical CSS - Inline for immediate rendering */
            :root{--font-sans:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;--font-mono:'JetBrains Mono','SF Mono',Monaco,'Cascadia Code',monospace}
            html{font-family:var(--font-sans);scroll-behavior:smooth;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
            body{background:linear-gradient(135deg,#0f0f23 0%,#1a1a2e 50%,#16213e 100%);color:#f3f4f6;min-height:100vh;margin:0;padding:0}
            .admin-shell,.admin-login{--font-sans:'Space Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;--font-mono:'IBM Plex Mono','SF Mono',Monaco,'Cascadia Code',monospace;font-family:var(--font-sans)}
            .navigation{position:fixed;left:0;width:100%;z-index:50;transition:all 0.5s ease-out}
            .min-h-screen{min-height:100vh}
            .flex{display:flex}
            .items-center{align-items:center}
            .justify-center{justify-content:center}
            .text-center{text-align:center}
            .font-bold{font-weight:700}
            .text-white{color:#fff}
            .bg-gradient-to-r{background-image:linear-gradient(var(--tw-gradient-stops))}
            .bg-clip-text{background-clip:text;-webkit-background-clip:text}
            .text-transparent{color:transparent}
          `
        }
      ],
      link: [
        // Optimal favicon setup for performance
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/favicon.png', sizes: '180x180' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'canonical', href: 'https://sakoa.xyz/' },

        // Optimized font loading strategy - eliminates render-blocking
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
        {
          rel: 'preload',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap',
          as: 'style',
          onload: "this.onload=null;this.rel='stylesheet'"
        },
        // Fallback for browsers that don't support preload
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap',
          media: 'print',
          onload: "this.media='all'"
        }
      ],
      noscript: [
        // Fallback for users with JavaScript disabled
        { innerHTML: '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap">' }
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'saka\'s Dodgeball Server',
            description: 'Team Fortress 2 dodgeball server with live status, rankings and community support.',
            url: 'https://sakoa.xyz/',
            logo: 'https://sakoa.xyz/default-512x512.png',
            sameAs: [
              'https://discord.gg/JuxYYVEkzc'
            ],
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              url: 'https://discord.gg/JuxYYVEkzc'
            }
          })
        }
      ]
    }
  }
})
