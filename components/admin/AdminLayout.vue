<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Navigation -->
    <nav class="bg-gray-800 border-b border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <img
              src="/assets/img/default-512x512.png"
              alt="Admin Logo"
              class="w-8 h-8 rounded mr-3"
            />
            <h1 class="text-xl font-semibold text-white">Admin Panel</h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <NuxtLink
              to="/admin/dashboard"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="{ 'bg-gray-700 text-white': $route.path === '/admin/dashboard' }"
            >
              Dashboard
            </NuxtLink>
            <NuxtLink
              to="/admin/donors"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="{ 'bg-gray-700 text-white': $route.path === '/admin/donors' }"
            >
              Donors
            </NuxtLink>
            <NuxtLink
              to="/admin/servers"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="{ 'bg-gray-700 text-white': $route.path === '/admin/servers' }"
            >
              Servers
            </NuxtLink>
            <NuxtLink
              to="/admin/settings"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="{ 'bg-gray-700 text-white': $route.path === '/admin/settings' }"
            >
              Settings
            </NuxtLink>
            <NuxtLink
              to="/admin/database"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="{ 'bg-gray-700 text-white': $route.path === '/admin/database' }"
            >
              Database
            </NuxtLink>
            <NuxtLink
              to="/admin/cache"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="{ 'bg-gray-700 text-white': $route.path === '/admin/cache' }"
            >
              Cache
            </NuxtLink>

            <div class="border-l border-gray-600 pl-4 ml-4">
              <NuxtLink
                to="/"
                target="_blank"
                class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                View Site
              </NuxtLink>
              <button
                @click="handleLogout"
                class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors ml-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup>
const { logout } = useAdmin();

const handleLogout = async () => {
  await logout();
};
</script>
