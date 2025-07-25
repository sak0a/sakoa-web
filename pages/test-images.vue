<template>
  <div v-if="isDev" class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Image Optimization Test</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Logo Tests -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-4">Logo Images (WebP with logo preset)</h2>
          
          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-gray-700 mb-2">40x40 (Navigation size)</h3>
              <NuxtImg
                src="/default-512x512.png"
                alt="Logo 40x40"
                class="rounded-lg border"
                width="40"
                height="40"
                format="webp"
                preset="logo"
              />
            </div>
            
            <div>
              <h3 class="text-sm font-medium text-gray-700 mb-2">64x64 (Admin size)</h3>
              <NuxtImg
                src="/default-512x512.png"
                alt="Logo 64x64"
                class="rounded-lg border"
                width="64"
                height="64"
                format="webp"
                preset="logo"
              />
            </div>
            
            <div>
              <h3 class="text-sm font-medium text-gray-700 mb-2">96x96 (Maintenance size)</h3>
              <NuxtImg
                src="/default-512x512.png"
                alt="Logo 96x96"
                class="rounded-lg border"
                width="96"
                height="96"
                format="webp"
                preset="logo"
              />
            </div>
          </div>
        </div>

        <!-- Avatar Tests -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-4">Avatar Images (WebP with avatar preset)</h2>
          
          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-gray-700 mb-2">Steam Avatar Example (116x116)</h3>
              <NuxtImg
                src="https://avatars.steamstatic.com/9906c05e72e39f8b0d2b1e7c5b8a3d4e5f6a7b8c_full.jpg"
                alt="Steam Avatar"
                class="rounded-full border"
                width="116"
                height="116"
                format="webp"
                preset="avatar"
                loading="lazy"
              />
            </div>
            
            <div>
              <h3 class="text-sm font-medium text-gray-700 mb-2">Different sizes</h3>
              <div class="flex space-x-4 items-center">
                <NuxtImg
                  src="https://avatars.steamstatic.com/e72e39f8b0d2b1e7c5b8a3d4e5f6a7b8c9d0e1f2_full.jpg"
                  alt="Small Avatar"
                  class="rounded-full border"
                  width="32"
                  height="32"
                  format="webp"
                  preset="avatar"
                  loading="lazy"
                />
                <NuxtImg
                  src="https://avatars.steamstatic.com/e72e39f8b0d2b1e7c5b8a3d4e5f6a7b8c9d0e1f2_full.jpg"
                  alt="Medium Avatar"
                  class="rounded-full border"
                  width="48"
                  height="48"
                  format="webp"
                  preset="avatar"
                  loading="lazy"
                />
                <NuxtImg
                  src="https://avatars.steamstatic.com/e72e39f8b0d2b1e7c5b8a3d4e5f6a7b8c9d0e1f2_full.jpg"
                  alt="Large Avatar"
                  class="rounded-full border"
                  width="64"
                  height="64"
                  format="webp"
                  preset="avatar"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Info -->
      <div class="mt-8 bg-blue-50 p-6 rounded-lg">
        <h2 class="text-xl font-semibold text-blue-900 mb-4">Performance Benefits</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 class="font-medium text-blue-800">WebP Format</h3>
            <p class="text-blue-700">25-35% smaller file sizes compared to PNG</p>
          </div>
          <div>
            <h3 class="font-medium text-blue-800">Responsive Images</h3>
            <p class="text-blue-700">Automatically sized for display dimensions</p>
          </div>
          <div>
            <h3 class="font-medium text-blue-800">Lazy Loading</h3>
            <p class="text-blue-700">Images load only when needed</p>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <div class="mt-8 bg-green-50 p-6 rounded-lg">
        <h2 class="text-xl font-semibold text-green-900 mb-4">Testing Instructions</h2>
        <ol class="list-decimal list-inside space-y-2 text-green-800">
          <li>Open browser DevTools (F12)</li>
          <li>Go to Network tab</li>
          <li>Refresh this page</li>
          <li>Look for image requests - they should be served as WebP format</li>
          <li>Check the file sizes - they should be significantly smaller than PNG</li>
        </ol>
      </div>
    </div>
  </div>

  <!-- Production mode message -->
  <div v-else class="min-h-screen bg-gray-900 flex items-center justify-center">
    <div class="max-w-md mx-auto px-4 text-center">
      <div class="bg-white/10 backdrop-blur-lg rounded-lg p-8 shadow-2xl border border-white/20">
        <h1 class="text-2xl font-bold text-white mb-4">Development Only</h1>
        <p class="text-white/80 mb-6">This page is only available in development mode.</p>
        <NuxtLink to="/" class="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to Home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development'

// Redirect to home in production (server-side)
if (!isDev && import.meta.server) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found'
  })
}

// Also redirect on client-side in production
if (!isDev && import.meta.client) {
  await navigateTo('/')
}

// Set page meta
definePageMeta({
  title: 'Image Optimization Test'
})

// Head configuration
useHead({
  title: isDev ? 'Image Optimization Test - Saka\'s Dodgeball Server' : 'Development Only - Saka\'s Dodgeball Server',
  meta: [
    { name: 'description', content: isDev ? 'Testing WebP image optimization with Nuxt Image' : 'This page is only available in development mode' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>
