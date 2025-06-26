// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  experimental: {
    headNext: true
  },
  unhead: {
    renderSSRHeadOptions: {
      omitLineBreaks: false
    }
  },
  css: ['~/assets/css/main.css'],
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
  },
  runtimeConfig: {
    // Private keys (only available on server-side)
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: process.env.DB_PORT || 3306,
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || 'sakaStats',
    adminPassword: process.env.ADMIN_PASSWORD,
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
    ]
  }
})
