<template>
  <div class="min-h-screen bg-gray-900">
    <AdminLayout>
      <div class="p-6">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">Cache Management</h1>
          <p class="text-gray-400">Monitor and manage application cache for optimal performance</p>
        </div>

        <!-- Cache Management Component -->
        <CacheManagement />

        <!-- Cache Configuration -->
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700 mt-8">
          <h3 class="text-xl font-semibold text-white mb-4">Cache Configuration</h3>
          <p class="text-gray-400 mb-6">Configure cache intervals for different data types</p>
          
          <form @submit.prevent="updateCacheSettings" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- Server Status -->
              <div class="bg-gray-700 rounded-lg p-4">
                <div class="flex items-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                  <h4 class="text-lg font-medium text-white">Server Status</h4>
                </div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Cache Interval (seconds)
                </label>
                <input
                  v-model.number="cacheForm.serverStatusInterval"
                  type="number"
                  min="5"
                  max="300"
                  class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p class="text-xs text-gray-400 mt-2">How often to query game servers (5-300 seconds)</p>
              </div>

              <!-- Leaderboard -->
              <div class="bg-gray-700 rounded-lg p-4">
                <div class="flex items-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h4 class="text-lg font-medium text-white">Leaderboard</h4>
                </div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Cache Interval (seconds)
                </label>
                <input
                  v-model.number="cacheForm.leaderboardInterval"
                  type="number"
                  min="5"
                  max="300"
                  class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p class="text-xs text-gray-400 mt-2">How often to refresh leaderboard data (5-300 seconds)</p>
              </div>

              <!-- Player Search -->
              <div class="bg-gray-700 rounded-lg p-4">
                <div class="flex items-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h4 class="text-lg font-medium text-white">Player Search</h4>
                </div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Cache Interval (seconds)
                </label>
                <input
                  v-model.number="cacheForm.playerSearchInterval"
                  type="number"
                  min="5"
                  max="300"
                  class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p class="text-xs text-gray-400 mt-2">How often to refresh player search results (5-300 seconds)</p>
              </div>

              <!-- Seasonal Leaderboard -->
              <div class="bg-gray-700 rounded-lg p-4">
                <div class="flex items-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <h4 class="text-lg font-medium text-white">Seasonal Data</h4>
                </div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Cache Interval (seconds)
                </label>
                <input
                  v-model.number="cacheForm.seasonalLeaderboardInterval"
                  type="number"
                  min="5"
                  max="300"
                  class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <p class="text-xs text-gray-400 mt-2">How often to refresh seasonal leaderboard data (5-300 seconds)</p>
              </div>

              <!-- Database Status -->
              <div class="bg-gray-700 rounded-lg p-4">
                <div class="flex items-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  <h4 class="text-lg font-medium text-white">Database Status</h4>
                </div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Cache Interval (seconds)
                </label>
                <input
                  v-model.number="cacheForm.databaseStatusInterval"
                  type="number"
                  min="1"
                  max="60"
                  class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p class="text-xs text-gray-400 mt-2">How often to check database status (1-60 seconds)</p>
              </div>
            </div>
            
            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="isLoading"
                class="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Update Cache Settings
              </button>
            </div>
          </form>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="message" class="mt-6">
          <div
            class="p-4 rounded-lg"
            :class="messageType === 'success' ? 'bg-green-900/20 border border-green-700 text-green-400' : 'bg-red-900/20 border border-red-700 text-red-400'"
          >
            {{ message }}
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

const { checkAuth, getSettings, updateSettings } = useAdmin();

const isLoading = ref(false);
const message = ref('');
const messageType = ref('success');

const cacheForm = ref({
  serverStatusInterval: 30,
  leaderboardInterval: 10,
  playerSearchInterval: 10,
  seasonalLeaderboardInterval: 10,
  databaseStatusInterval: 5
});

const showMessage = (msg, type = 'success') => {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 5000);
};

const updateCacheSettings = async () => {
  isLoading.value = true;
  
  try {
    const response = await updateSettings({
      cache: cacheForm.value
    });
    
    if (response.success) {
      showMessage('Cache settings updated successfully');
    } else {
      showMessage('Failed to update cache settings', 'error');
    }
  } catch (error) {
    console.error('Failed to update cache settings:', error);
    showMessage('Failed to update cache settings', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Load current settings
const loadSettings = async () => {
  try {
    const settingsData = await getSettings();
    
    if (settingsData.cache) {
      cacheForm.value = {
        serverStatusInterval: settingsData.cache.serverStatusInterval || 30,
        leaderboardInterval: settingsData.cache.leaderboardInterval || 10,
        playerSearchInterval: settingsData.cache.playerSearchInterval || 10,
        seasonalLeaderboardInterval: settingsData.cache.seasonalLeaderboardInterval || 10,
        databaseStatusInterval: settingsData.cache.databaseStatusInterval || 5
      };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    showMessage('Failed to load current settings', 'error');
  }
};

// Check authentication and load settings on mount
onMounted(async () => {
  try {
    const isAuth = await checkAuth();
    if (!isAuth) {
      await navigateTo('/admin');
      return;
    }
    
    await loadSettings();
  } catch (error) {
    console.error('Auth check failed:', error);
    await navigateTo('/admin');
  }
});
</script>
