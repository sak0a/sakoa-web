<template>
  <div class="min-h-screen bg-gray-900">
    <AdminLayout>
      <div class="p-6">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">Hero Statistics</h1>
          <p class="text-gray-400">Manage the statistics displayed in the hero section</p>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="message" class="mb-6">
          <div 
            class="p-4 rounded-lg"
            :class="messageType === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'"
          >
            {{ message }}
          </div>
        </div>

        <!-- Hero Statistics Form -->
        <div class="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          <h2 class="text-xl font-semibold text-white mb-6">Hero Section Statistics</h2>
          
          <form @submit.prevent="saveHeroStats" class="space-y-6">
            <!-- Server Uptime -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Server Uptime Display</label>
              <input
                v-model="heroForm.uptime"
                type="text"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="24/7"
              />
              <p class="text-xs text-gray-400 mt-1">Display text for server uptime (e.g., "24/7", "99.9%")</p>
            </div>

            <!-- Active Players -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Active Players Count</label>
              <input
                v-model.number="heroForm.activePlayers"
                type="number"
                min="0"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="1247"
              />
              <p class="text-xs text-gray-400 mt-1">Total number of active players (will display as "1.2K+" if over 1000)</p>
            </div>

            <!-- Monthly Donation Amount -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Monthly Donation Amount (€)</label>
              <input
                v-model.number="heroForm.monthlyDonations"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="17.5"
              />
              <p class="text-xs text-gray-400 mt-1">Current month's donation total in euros</p>
            </div>

            <!-- Monthly Donation Goal -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Monthly Donation Goal (€)</label>
              <input
                v-model.number="heroForm.monthlyGoal"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="30"
              />
              <p class="text-xs text-gray-400 mt-1">Monthly donation target for progress tracking</p>
            </div>

            <!-- Auto-update Settings -->
            <div class="border-t border-gray-600 pt-6">
              <h3 class="text-lg font-medium text-white mb-4">Auto-update Settings</h3>
              
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-medium text-white">Auto-update Donations</h4>
                    <p class="text-xs text-gray-400">Automatically sync donation amount from database</p>
                  </div>
                  <button
                    type="button"
                    @click="heroForm.autoUpdateDonations = !heroForm.autoUpdateDonations"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                    :class="heroForm.autoUpdateDonations ? 'bg-purple-600' : 'bg-gray-600'"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      :class="heroForm.autoUpdateDonations ? 'translate-x-6' : 'translate-x-1'"
                    ></span>
                  </button>
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-medium text-white">Auto-update Player Count</h4>
                    <p class="text-xs text-gray-400">Automatically sync player count from server stats</p>
                  </div>
                  <button
                    type="button"
                    @click="heroForm.autoUpdatePlayers = !heroForm.autoUpdatePlayers"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                    :class="heroForm.autoUpdatePlayers ? 'bg-purple-600' : 'bg-gray-600'"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      :class="heroForm.autoUpdatePlayers ? 'translate-x-6' : 'translate-x-1'"
                    ></span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-between pt-6">
              <button
                type="button"
                @click="resetForm"
                class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                :disabled="isLoading"
                class="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {{ isLoading ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Real-time Server Stats -->
        <div class="mt-8 bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-white">Real-time Server Statistics</h2>
            <button
              @click="refreshServerStats"
              :disabled="isLoadingStats"
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
            >
              {{ isLoadingStats ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-gray-800 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-white mb-1">{{ serverStats.onlinePlayers }}</div>
              <div class="text-gray-400 text-sm">Current Online Players</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-white mb-1">{{ serverStats.onlineServers }}/{{ serverStats.totalServers }}</div>
              <div class="text-gray-400 text-sm">Servers Online</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-white mb-1">{{ formatPlayerCount(heroForm.activePlayers) }}</div>
              <div class="text-gray-400 text-sm">Active Players (Display)</div>
            </div>
          </div>
        </div>

        <!-- Preview Section -->
        <div class="mt-8 bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          <h2 class="text-xl font-semibold text-white mb-6">Preview</h2>

          <!-- Hero Stats Preview -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div class="text-center">
              <div class="text-3xl font-bold text-white mb-2">{{ heroForm.uptime }}</div>
              <div class="text-gray-400 text-sm uppercase tracking-wider">Server Uptime</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-white mb-2">{{ formatPlayerCount(heroForm.activePlayers) }}+</div>
              <div class="text-gray-400 text-sm uppercase tracking-wider">Active Players</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-white mb-2">€{{ heroForm.monthlyDonations }}</div>
              <div class="text-gray-400 text-sm uppercase tracking-wider">Donated This Month</div>
            </div>
          </div>

          <!-- Donation Progress Preview -->
          <div class="border-t border-gray-600 pt-6">
            <h3 class="text-lg font-medium text-white mb-4">Donation Progress Preview</h3>
            <div class="bg-gray-800 rounded-lg p-4">
              <div class="flex justify-between items-center mb-2">
                <span class="text-white font-medium">Monthly Goal Progress</span>
                <span class="text-gray-400">€{{ heroForm.monthlyDonations }} / €{{ heroForm.monthlyGoal }}</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div
                  class="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  :style="{ width: `${Math.min((heroForm.monthlyDonations / heroForm.monthlyGoal) * 100, 100)}%` }"
                ></div>
              </div>
              <div class="text-center">
                <span class="text-purple-400 font-medium">
                  {{ Math.round((heroForm.monthlyDonations / heroForm.monthlyGoal) * 100) }}% Complete
                </span>
              </div>
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

const { getSettings, updateSettings, checkAuth } = useAdmin();
const { getRealTimeServerStats } = useHeroStats();

const isLoading = ref(false);
const isLoadingStats = ref(false);
const message = ref('');
const messageType = ref('success');

const serverStats = ref({
  onlinePlayers: 0,
  onlineServers: 0,
  totalServers: 0,
  servers: []
});

const heroForm = ref({
  uptime: '24/7',
  activePlayers: 1247,
  monthlyDonations: 17.5,
  monthlyGoal: 30,
  autoUpdateDonations: false,
  autoUpdatePlayers: false
});

// Format player count for display
const formatPlayerCount = (count) => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

// Show message helper
const showMessage = (text, type = 'success') => {
  message.value = text;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 5000);
};

// Load current settings
const loadSettings = async () => {
  try {
    const settingsData = await getSettings();
    
    if (settingsData.heroStats) {
      heroForm.value = {
        uptime: settingsData.heroStats.uptime || '24/7',
        activePlayers: settingsData.heroStats.activePlayers || 1247,
        monthlyDonations: settingsData.heroStats.monthlyDonations || 17.5,
        monthlyGoal: settingsData.heroStats.monthlyGoal || 30,
        autoUpdateDonations: settingsData.heroStats.autoUpdateDonations || false,
        autoUpdatePlayers: settingsData.heroStats.autoUpdatePlayers || false
      };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    showMessage('Failed to load current settings', 'error');
  }
};

// Save hero statistics
const saveHeroStats = async () => {
  try {
    isLoading.value = true;

    const response = await updateSettings({
      heroStats: {
        uptime: heroForm.value.uptime,
        activePlayers: heroForm.value.activePlayers,
        monthlyDonations: heroForm.value.monthlyDonations,
        monthlyGoal: heroForm.value.monthlyGoal,
        autoUpdateDonations: heroForm.value.autoUpdateDonations,
        autoUpdatePlayers: heroForm.value.autoUpdatePlayers,
        lastUpdated: new Date().toISOString()
      }
    });

    if (response.success) {
      showMessage('Hero statistics saved successfully', 'success');
    }
  } catch (error) {
    console.error('Failed to save hero statistics:', error);
    showMessage('Failed to save hero statistics', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Refresh server statistics
const refreshServerStats = async () => {
  try {
    isLoadingStats.value = true;
    const stats = await getRealTimeServerStats();
    serverStats.value = stats;
  } catch (error) {
    console.error('Failed to refresh server stats:', error);
    showMessage('Failed to refresh server statistics', 'error');
  } finally {
    isLoadingStats.value = false;
  }
};

// Reset form
const resetForm = () => {
  heroForm.value = {
    uptime: '24/7',
    activePlayers: 1247,
    monthlyDonations: 17.5,
    monthlyGoal: 30,
    autoUpdateDonations: false,
    autoUpdatePlayers: false
  };
};

// Initialize
onMounted(async () => {
  await checkAuth();
  await loadSettings();
  await refreshServerStats();
});
</script>
