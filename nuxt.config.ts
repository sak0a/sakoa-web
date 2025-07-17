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
    clientFallback: false
  },
  unhead: {
    renderSSRHeadOptions: {
      omitLineBreaks: false
    }
  },
  css: ['~/assets/css/main.css'],
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
    // Better Plesk/Passenger compatibility
    experimental: {
      wasm: false
    },
    // Ensure proper static file serving
    serveStatic: true,
    // Disable build manifest routes that cause 500 errors
    routeRules: {
      '/_nuxt/builds/**': { prerender: false }
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
  // Ensure proper client-side hydration
  app: {
    head: {
      title: "saka's Dodgeball Server",
      meta: [
        { name: 'description', content: 'Support Saka\'s Team Fortress 2 Dodgeball Server through donations' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/favicon.png' }
      ]
    }
  }
})
