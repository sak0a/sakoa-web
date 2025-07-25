// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/image'
  ],

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
    // Provider configuration
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
  experimental: {
    // Minimal experimental features to avoid build issues
    payloadExtraction: false
  },

  css: ['~/assets/css/main.css'],

  // Optimized Vite configuration for smaller bundles
  vite: {
    optimizeDeps: {
      include: ['gsap']
    },
    build: {
      rollupOptions: {
        // Removed heavy AI dependencies to reduce bundle size
        output: {
          manualChunks: {
            'vendor': ['vue', 'vue-router'],
            'gsap': ['gsap']
          }
        }
      }
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
    publicAssets: [
      {
        baseURL: '/data',
        dir: 'server/data'
      }
    ],
    // Enhanced route rules for performance and caching
    routeRules: {
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
    // Performance optimizations
    minify: true,
    compressPublicAssets: true,
    // Reduce bundle size
    experimental: {
      wasm: false
    },
    // Exclude heavy dependencies from server bundle
    externals: {
      inline: [
        // Keep essential modules inline
        'gsap'
      ]
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
        { property: 'og:url', content: 'https://sakoa.xyz/' },
        { property: 'og:title', content: 'saka\'s Dodgeball Server - Premium TF2 Gaming' },
        { property: 'og:description', content: 'Join our premium Team Fortress 2 dodgeball server with 24/7 uptime, custom maps, and active community.' },
        { property: 'og:image', content: '/assets/img/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:site_name', content: 'saka\'s Dodgeball Server' },

        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:url', content: 'https://sakoa.xyz/' },
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
        // Optimal favicon setup for performance
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/favicon.png', sizes: '180x180' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'canonical', href: 'https://sakoa.xyz/' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'saka\'s Dodgeball Server',
            description: 'Premium Team Fortress 2 dodgeball gaming server with 24/7 uptime and active community.',
            url: 'https://sakoa.xyz/',
            logo: 'https://sakoa.xyz/assets/img/default-512x512.png',
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
