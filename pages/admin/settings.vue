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
