export default defineEventHandler(async (event) => {
  const baseUrl = 'https://sakoa-web.vercel.app'
  
  const routes = [
    {
      url: '/',
      changefreq: 'daily',
      priority: 1.0,
      lastmod: new Date().toISOString()
    },
    {
      url: '/#about',
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date().toISOString()
    },
    {
      url: '/#server-status',
      changefreq: 'hourly',
      priority: 0.9,
      lastmod: new Date().toISOString()
    },
    {
      url: '/#leaderboard',
      changefreq: 'daily',
      priority: 0.8,
      lastmod: new Date().toISOString()
    },
    {
      url: '/#donate',
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date().toISOString()
    },
    {
      url: '/#donors',
      changefreq: 'daily',
      priority: 0.6,
      lastmod: new Date().toISOString()
    }
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${baseUrl}${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  setHeader(event, 'Content-Type', 'application/xml')
  setHeader(event, 'Cache-Control', 'max-age=3600') // Cache for 1 hour
  
  return sitemap
})
