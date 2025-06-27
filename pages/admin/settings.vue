<template>
  <div class="min-h-screen bg-gray-900">
    <AdminLayout>
      <div class="p-6">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">Settings</h1>
          <p class="text-gray-400">Configure your TF2 dodgeball server settings</p>
        </div>

        <!-- Maintenance Mode Settings -->
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-xl font-semibold text-white mb-1">Maintenance Mode</h2>
              <p class="text-gray-400 text-sm">Control when your site is accessible to users</p>
            </div>
            <div class="flex items-center space-x-3">
              <span class="text-sm text-gray-400">
                {{ settings?.maintenance?.enabled ? 'Enabled' : 'Disabled' }}
              </span>
              <button
                @click="toggleMaintenance"
                :disabled="isLoading"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
                :class="settings?.maintenance?.enabled ? 'bg-purple-600' : 'bg-gray-600'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="settings?.maintenance?.enabled ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </div>
          </div>

          <!-- Maintenance Configuration Form -->
          <form @submit.prevent="saveMaintenanceSettings" class="space-y-4">
            <div>
              <label for="maintenance-title" class="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                id="maintenance-title"
                v-model="maintenanceForm.title"
                type="text"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Maintenance Mode"
              />
            </div>

            <div>
              <label for="maintenance-message" class="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                id="maintenance-message"
                v-model="maintenanceForm.message"
                rows="3"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="We're currently performing maintenance on our servers. Please check back soon!"
              ></textarea>
            </div>

            <div>
              <label for="maintenance-time" class="block text-sm font-medium text-gray-300 mb-2">
                Estimated Completion Time (Optional)
              </label>
              <input
                id="maintenance-time"
                v-model="maintenanceForm.estimatedTime"
                type="text"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., 2 hours, Tomorrow at 3 PM, etc."
              />
            </div>

            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="resetForm"
                class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                :disabled="isLoading"
                class="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
              >
                <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Save Settings
              </button>
            </div>
          </form>

          <!-- Current Status -->
          <div v-if="settings?.maintenance?.enabled" class="mt-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
            <div class="flex items-center mb-2">
              <svg class="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <span class="text-yellow-400 font-medium">Maintenance Mode Active</span>
            </div>
            <p class="text-yellow-300 text-sm mb-2">All users except admins will see the maintenance page.</p>
            <a
              href="/maintenance"
              target="_blank"
              class="text-yellow-400 hover:text-yellow-300 text-sm underline"
            >
              Preview maintenance page →
            </a>
          </div>

          <!-- Last Updated -->
          <div v-if="settings?.maintenance?.lastUpdated" class="mt-4 text-xs text-gray-500">
            Last updated: {{ formatDate(settings.maintenance.lastUpdated) }}
          </div>
        </div>

        <!-- Season Settings -->
        <div class="bg-gray-800 rounded-lg p-6 mb-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-xl font-semibold text-white mb-2">Season Configuration</h2>
              <p class="text-gray-400">Configure when seasons start (year, month, day)</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Start Year</label>
              <input
                v-model.number="seasonForm.startYear"
                type="number"
                min="2020"
                max="2030"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="2025"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Start Month</label>
              <select
                v-model.number="seasonForm.startMonth"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Start Day</label>
              <input
                v-model.number="seasonForm.startDay"
                type="number"
                min="1"
                max="31"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="15"
              />
            </div>
          </div>

          <div class="flex gap-4">
            <button
              @click="saveSeasonSettings"
              :disabled="isLoading"
              class="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <span v-if="isLoading">Saving...</span>
              <span v-else>Save Season Settings</span>
            </button>
            <button
              @click="resetSeasonForm"
              :disabled="isLoading"
              class="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>

          <!-- Last Updated -->
          <div v-if="settings?.seasons?.lastUpdated" class="mt-4 text-xs text-gray-500">
            Last updated: {{ formatDate(settings.seasons.lastUpdated) }}
          </div>
        </div>

        <!-- Discord Settings -->
        <div class="bg-gray-800 rounded-lg p-6 mb-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-xl font-semibold text-white mb-2">Discord Configuration</h2>
              <p class="text-gray-400">Configure Discord invite link for the server</p>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-2">Discord Invite URL</label>
            <input
              v-model="discordForm.inviteUrl"
              type="url"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://discord.gg/your-invite-code"
            />
            <p class="text-xs text-gray-500 mt-1">This link will be used throughout the website for Discord references</p>
          </div>

          <div class="flex gap-4">
            <button
              @click="saveDiscordSettings"
              :disabled="isLoading"
              class="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <span v-if="isLoading">Saving...</span>
              <span v-else>Save Discord Settings</span>
            </button>
            <button
              @click="resetDiscordForm"
              :disabled="isLoading"
              class="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>

          <!-- Last Updated -->
          <div v-if="settings?.discord?.lastUpdated" class="mt-4 text-xs text-gray-500">
            Last updated: {{ formatDate(settings.discord.lastUpdated) }}
          </div>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="message" class="mb-6">
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

const { getSettings, updateSettings, checkAuth } = useAdmin();

const settings = ref(null);
const isLoading = ref(false);
const message = ref('');
const messageType = ref('success');

const maintenanceForm = ref({
  title: '',
  message: '',
  estimatedTime: ''
});

const seasonForm = ref({
  startYear: 2025,
  startMonth: 5,
  startDay: 15
});

const discordForm = ref({
  inviteUrl: ''
});

// Load settings
const loadSettings = async () => {
  try {
    const settingsData = await getSettings();
    settings.value = settingsData;
    
    // Populate form with current values
    if (settingsData.maintenance) {
      maintenanceForm.value = {
        title: settingsData.maintenance.title || '',
        message: settingsData.maintenance.message || '',
        estimatedTime: settingsData.maintenance.estimatedTime || ''
      };
    }

    if (settingsData.seasons) {
      seasonForm.value = {
        startYear: settingsData.seasons.startYear || 2025,
        startMonth: settingsData.seasons.startMonth || 5,
        startDay: settingsData.seasons.startDay || 15
      };
    }

    if (settingsData.discord) {
      discordForm.value = {
        inviteUrl: settingsData.discord.inviteUrl || ''
      };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    showMessage('Failed to load settings', 'error');
  }
};

// Toggle maintenance mode
const toggleMaintenance = async () => {
  try {
    isLoading.value = true;
    
    const newEnabled = !settings.value?.maintenance?.enabled;
    
    const response = await updateSettings({
      maintenance: {
        enabled: newEnabled
      }
    });
    
    if (response.success) {
      settings.value = response.settings;
      showMessage(`Maintenance mode ${newEnabled ? 'enabled' : 'disabled'}`, 'success');
    }
  } catch (error) {
    console.error('Failed to toggle maintenance mode:', error);
    showMessage('Failed to toggle maintenance mode', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Save maintenance settings
const saveMaintenanceSettings = async () => {
  try {
    isLoading.value = true;
    
    const response = await updateSettings({
      maintenance: {
        title: maintenanceForm.value.title,
        message: maintenanceForm.value.message,
        estimatedTime: maintenanceForm.value.estimatedTime
      }
    });
    
    if (response.success) {
      settings.value = response.settings;
      showMessage('Maintenance settings saved successfully', 'success');
    }
  } catch (error) {
    console.error('Failed to save maintenance settings:', error);
    showMessage('Failed to save maintenance settings', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Save season settings
const saveSeasonSettings = async () => {
  try {
    isLoading.value = true;

    const response = await updateSettings({
      seasons: {
        startYear: seasonForm.value.startYear,
        startMonth: seasonForm.value.startMonth,
        startDay: seasonForm.value.startDay
      }
    });

    if (response.success) {
      settings.value = response.settings;
      showMessage('Season settings saved successfully', 'success');
    }
  } catch (error) {
    console.error('Failed to save season settings:', error);
    showMessage('Failed to save season settings', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Save Discord settings
const saveDiscordSettings = async () => {
  try {
    isLoading.value = true;

    const response = await updateSettings({
      discord: {
        inviteUrl: discordForm.value.inviteUrl
      }
    });

    if (response.success) {
      settings.value = response.settings;
      showMessage('Discord settings saved successfully', 'success');
    }
  } catch (error) {
    console.error('Failed to save Discord settings:', error);
    showMessage('Failed to save Discord settings', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Reset form to current settings
const resetForm = () => {
  if (settings.value?.maintenance) {
    maintenanceForm.value = {
      title: settings.value.maintenance.title || '',
      message: settings.value.maintenance.message || '',
      estimatedTime: settings.value.maintenance.estimatedTime || ''
    };
  }
};

// Reset season form
const resetSeasonForm = () => {
  if (settings.value?.seasons) {
    seasonForm.value = {
      startYear: settings.value.seasons.startYear || 2025,
      startMonth: settings.value.seasons.startMonth || 5,
      startDay: settings.value.seasons.startDay || 15
    };
  }
};

// Reset Discord form
const resetDiscordForm = () => {
  if (settings.value?.discord) {
    discordForm.value = {
      inviteUrl: settings.value.discord.inviteUrl || ''
    };
  }
};

// Show message
const showMessage = (msg, type = 'success') => {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 5000);
};

// Format date
const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleString();
  } catch (error) {
    return dateString;
  }
};

// Load data on mount
onMounted(async () => {
  try {
    // Check authentication first
    const isAuth = await checkAuth();
    if (!isAuth) {
      await navigateTo('/admin');
      return;
    }

    await loadSettings();
  } catch (error) {
    console.error('Failed to initialize settings page:', error);
    await navigateTo('/admin');
  }
});
</script>
