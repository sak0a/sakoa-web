<template>
  <div class="min-h-screen bg-gray-900">
    <AdminLayout>
      <div class="p-6">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p class="text-gray-400">Manage your TF2 dodgeball server settings</p>
        </div>

        <!-- Maintenance Mode Toggle -->
        <div class="mb-8">
          <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-white mb-1">Maintenance Mode</h3>
                <p class="text-gray-400 text-sm">Enable maintenance mode to temporarily disable the site for all users except admins</p>
              </div>
              <div class="flex items-center space-x-3">
                <span class="text-sm text-gray-400">
                  {{ maintenanceSettings?.enabled ? 'Enabled' : 'Disabled' }}
                </span>
                <button
                  @click="toggleMaintenance"
                  :disabled="isTogglingMaintenance"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
                  :class="maintenanceSettings?.enabled ? 'bg-purple-600' : 'bg-gray-600'"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    :class="maintenanceSettings?.enabled ? 'translate-x-6' : 'translate-x-1'"
                  ></span>
                </button>
              </div>
            </div>

            <!-- Maintenance Status -->
            <div v-if="maintenanceSettings?.enabled" class="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                <span class="text-yellow-400 text-sm font-medium">Maintenance mode is currently active</span>
              </div>
              <p class="text-yellow-300 text-sm mt-1">All users except admins will see the maintenance page</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <!-- Donors Card -->
          <div class="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <div class="bg-green-500/20 p-3 rounded-lg mr-4">
                  <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-white">Donors</h3>
                  <p class="text-gray-400 text-sm">{{ donorStats.total }} total</p>
                </div>
              </div>
            </div>
            <NuxtLink
              to="/admin/donors"
              class="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
            >
              Manage Donors
              <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </NuxtLink>
          </div>

          <!-- Servers Card -->
          <div class="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <div class="bg-blue-500/20 p-3 rounded-lg mr-4">
                  <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-white">Servers</h3>
                  <p class="text-gray-400 text-sm">{{ serverStats.total }} configured</p>
                </div>
              </div>
            </div>
            <NuxtLink
              to="/admin/servers"
              class="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
            >
              Manage Servers
              <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </NuxtLink>
          </div>

          <!-- Quick Stats Card -->
          <div class="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <div class="bg-purple-500/20 p-3 rounded-lg mr-4">
                  <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-white">Quick Stats</h3>
                  <p class="text-gray-400 text-sm">Overview</p>
                </div>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-400">Total Donations:</span>
                <span class="text-white">€{{ donorStats.totalAmount }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-400">Online Servers:</span>
                <span class="text-white">{{ serverStats.online }}/{{ serverStats.total }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Database Status -->
        <DatabaseStatus />

        <!-- Recent Activity -->
        <div class="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          <h2 class="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between py-2 border-b border-white/10">
              <div class="flex items-center">
                <div class="bg-green-500/20 p-2 rounded-full mr-3">
                  <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </div>
                <div>
                  <p class="text-white text-sm">Admin panel accessed</p>
                  <p class="text-gray-400 text-xs">Just now</p>
                </div>
              </div>
            </div>
            <div class="text-center py-4">
              <p class="text-gray-400 text-sm">More activity tracking coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
});

const { getDonors, getServers, checkAuth, getSettings, updateSettings } = useAdmin();

const donorStats = ref({
  total: 0,
  totalAmount: 0
});

const serverStats = ref({
  total: 0,
  online: 0
});

const maintenanceSettings = ref(null);
const isTogglingMaintenance = ref(false);
const debugInfo = ref(null);

// Toggle maintenance mode
const toggleMaintenance = async () => {
  try {
    isTogglingMaintenance.value = true;

    const newEnabled = !maintenanceSettings.value?.enabled;

    const response = await updateSettings({
      maintenance: {
        enabled: newEnabled
      }
    });

    if (response.success) {
      maintenanceSettings.value = response.settings.maintenance;
    }
  } catch (error) {
    console.error('Failed to toggle maintenance mode:', error);
  } finally {
    isTogglingMaintenance.value = false;
  }
};

// Load dashboard data
onMounted(async () => {
  try {
    // Check authentication first
    const isAuth = await checkAuth();
    if (!isAuth) {
      await navigateTo('/admin');
      return;
    }

    // Load settings
    const settingsData = await getSettings();
    maintenanceSettings.value = settingsData.maintenance;

    // Load donor stats
    const donorsData = await getDonors();
    donorStats.value = {
      total: donorsData.donors.length,
      totalAmount: donorsData.donors.reduce((sum, donor) => sum + donor.amount, 0)
    };

    // Load server stats
    const serversData = await getServers();
    serverStats.value = {
      total: serversData.servers.length,
      online: 0 // We could query server status here if needed
    };

    // Load debug info (only in development)
    if (process.dev) {
      try {
        const debugResponse = await $fetch('/api/admin/debug');
        debugInfo.value = debugResponse.debug;
      } catch (debugError) {
        console.warn('Failed to load debug info:', debugError);
      }
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    await navigateTo('/admin');
  }
});
</script>
