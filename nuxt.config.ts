// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  experimental: {
    headNext: false,
    // Disable features that cause issues in Plesk/Passenger
    payloadExtraction: false,
    clientFallback: false,
    // Performance optimizations
    inlineSSRStyles: false,
    viewTransition: true,
    // Fix unenv polyfill issues
    polyfillVueUseHead: false
  },

  // Performance optimizations (moved to main nitro config below)

  // Image optimization
  image: {
    format: ['webp', 'avif', 'png', 'jpg'],
    quality: 80,
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    }
  },
  unhead: {
    renderSSRHeadOptions: {
      omitLineBreaks: false
    }
  },
  css: ['~/assets/css/main.css'],

  // Enhanced Vite optimizations
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'gsap': ['gsap'],
            'vendor': ['vue', 'vue-router'],
            'composables': ['~/composables/useAdmin.js', '~/composables/useHeroStats.js'],
            'components': ['~/components/SearchModal.vue', '~/components/StatsCounter.vue']
          }
        }
      },
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    },
    optimizeDeps: {
      include: ['gsap', 'gsap/ScrollTrigger']
    },
    css: {
      devSourcemap: false
    }
  },

  runtimeConfig: {
    // Private keys (only available on server-side)
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: process.env.DB_PORT || '3306',
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || 'sakaStats',
    adminPassword: process.env.ADMIN_PASSWORD,
    steamApiKey: process.env.STEAM_API_KEY,
    // Public keys (exposed to client-side)
    public: {
      serverIp: '45.81.234.145:27015'
    }
  },
  nitro: {
    compressPublicAssets: true,
    minify: true,
    storage: {
      redis: {
        driver: 'redis',
        // Add Redis configuration if available
      }
    },
    publicAssets: [
      {
        baseURL: '/data',
        dir: 'server/data'
      }
    ],
    // Better Plesk/Passenger compatibility
    experimental: {
      wasm: false
    },
    // Ensure proper static file serving
    serveStatic: true,
    // Fix unenv polyfill issues
    unenv: {
      polyfill: []
    },
    // Enhanced route rules for performance and caching
    routeRules: {
      '/_nuxt/builds/**': { prerender: false },
      '/': { prerender: true },
      '/admin/**': { ssr: false },
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
    }
  },
  // Additional SSR configuration for better stability
  ssr: true,
  // Disable client-side routing features that cause manifest issues
  router: {
    options: {
      hashMode: false
    }
  },
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
        { property: 'og:url', content: 'https://sakoa-web.vercel.app/' },
        { property: 'og:title', content: 'saka\'s Dodgeball Server - Premium TF2 Gaming' },
        { property: 'og:description', content: 'Join our premium Team Fortress 2 dodgeball server with 24/7 uptime, custom maps, and active community.' },
        { property: 'og:image', content: '/assets/img/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:site_name', content: 'saka\'s Dodgeball Server' },

        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:url', content: 'https://sakoa-web.vercel.app/' },
        { name: 'twitter:title', content: 'saka\'s Dodgeball Server - Premium TF2 Gaming' },
        { name: 'twitter:description', content: 'Join our premium Team Fortress 2 dodgeball server with 24/7 uptime, custom maps, and active community.' },
        { name: 'twitter:image', content: '/assets/img/og-image.png' },

        // Additional SEO
        { name: 'theme-color', content: '#734C96' },
        { name: 'msapplication-TileColor', content: '#734C96' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/favicon.png' },
        { rel: 'canonical', href: 'https://sakoa-web.vercel.app/' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }
      ],
      script: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'saka\'s Dodgeball Server',
            description: 'Premium Team Fortress 2 dodgeball gaming server with 24/7 uptime and active community.',
            url: 'https://sakoa-web.vercel.app/',
            logo: 'https://sakoa-web.vercel.app/assets/img/default-512x512.png',
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
