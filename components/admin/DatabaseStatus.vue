<template>
  <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-semibold text-white">Database Connection</h3>
      <div class="flex items-center space-x-2">
        <div
          class="w-3 h-3 rounded-full"
          :class="statusColor"
        ></div>
        <span class="text-sm font-medium" :class="statusTextColor">
          {{ statusText }}
        </span>
      </div>
    </div>

    <!-- Connection Details -->
    <div v-if="dbStatus" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-gray-700 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-300 mb-2">Connection Info</h4>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">Host:</span>
            <span class="text-white font-mono">{{ dbStatus.connection.host }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Port:</span>
            <span class="text-white font-mono">{{ dbStatus.connection.port }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Database:</span>
            <span class="text-white font-mono">{{ dbStatus.connection.database }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">User:</span>
            <span class="text-white font-mono">{{ dbStatus.connection.user }}</span>
          </div>
        </div>
      </div>

      <div class="bg-gray-700 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-300 mb-2">Status Details</h4>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">Status:</span>
            <span class="font-medium" :class="statusTextColor">{{ dbStatus.connection.status }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Last Check:</span>
            <span class="text-white font-mono text-xs">{{ formatTimestamp(dbStatus.connection.timestamp) }}</span>
          </div>
          <div v-if="dbStatus.error" class="mt-2">
            <span class="text-gray-400">Error:</span>
            <div class="text-red-400 text-xs mt-1 font-mono bg-red-900/20 p-2 rounded">
              {{ dbStatus.error.message }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-wrap gap-3">
      <button
        @click="testConnection"
        :disabled="isLoading"
        class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
      >
        <svg v-if="isLoading && currentAction === 'test'" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Test Connection
      </button>

      <button
        @click="retryConnection"
        :disabled="isLoading"
        class="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
      >
        <svg v-if="isLoading && currentAction === 'retry'" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Retry Connection
      </button>

      <button
        @click="refreshStatus"
        :disabled="isLoading"
        class="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
      >
        <svg v-if="isLoading && currentAction === 'refresh'" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>

      <button
        @click="reloadConfig"
        :disabled="isLoading"
        class="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
      >
        <svg v-if="isLoading && currentAction === 'reload'" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Reload Config
      </button>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="mt-4">
      <div
        class="p-3 rounded-lg text-sm"
        :class="messageType === 'success' ? 'bg-green-900/20 border border-green-700 text-green-400' : 'bg-red-900/20 border border-red-700 text-red-400'"
      >
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const { getDatabaseStatus, testDatabaseConnection, retryDatabaseConnection, reloadDatabaseConfig } = useAdmin();

const dbStatus = ref(null);
const isLoading = ref(false);
const currentAction = ref('');
const message = ref('');
const messageType = ref('success');

const statusColor = computed(() => {
  if (!dbStatus.value) return 'bg-gray-500';
  
  switch (dbStatus.value.connection.status) {
    case 'connected':
      return 'bg-green-500';
    case 'failed':
      return 'bg-red-500';
    case 'disconnected':
    default:
      return 'bg-yellow-500';
  }
});

const statusTextColor = computed(() => {
  if (!dbStatus.value) return 'text-gray-400';
  
  switch (dbStatus.value.connection.status) {
    case 'connected':
      return 'text-green-400';
    case 'failed':
      return 'text-red-400';
    case 'disconnected':
    default:
      return 'text-yellow-400';
  }
});

const statusText = computed(() => {
  if (!dbStatus.value) return 'Unknown';
  
  switch (dbStatus.value.connection.status) {
    case 'connected':
      return 'Connected';
    case 'failed':
      return 'Failed';
    case 'disconnected':
      return 'Disconnected';
    default:
      return 'Unknown';
  }
});

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

const showMessage = (msg, type = 'success') => {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 5000);
};

const refreshStatus = async () => {
  isLoading.value = true;
  currentAction.value = 'refresh';
  
  try {
    const status = await getDatabaseStatus();
    dbStatus.value = status;
    showMessage('Database status refreshed successfully');
  } catch (error) {
    console.error('Failed to refresh database status:', error);
    showMessage('Failed to refresh database status', 'error');
  } finally {
    isLoading.value = false;
    currentAction.value = '';
  }
};

const testConnection = async () => {
  isLoading.value = true;
  currentAction.value = 'test';
  
  try {
    const result = await testDatabaseConnection();
    if (result.success) {
      showMessage('Database connection test successful');
      await refreshStatus();
    } else {
      showMessage('Database connection test failed', 'error');
    }
  } catch (error) {
    console.error('Database test failed:', error);
    showMessage('Database connection test failed', 'error');
  } finally {
    isLoading.value = false;
    currentAction.value = '';
  }
};

const retryConnection = async () => {
  isLoading.value = true;
  currentAction.value = 'retry';

  try {
    const result = await retryDatabaseConnection();
    if (result.success) {
      showMessage('Database connection retry successful');
      await refreshStatus();
    } else {
      showMessage('Database connection retry failed', 'error');
    }
  } catch (error) {
    console.error('Database retry failed:', error);
    showMessage('Database connection retry failed', 'error');
  } finally {
    isLoading.value = false;
    currentAction.value = '';
  }
};

const reloadConfig = async () => {
  isLoading.value = true;
  currentAction.value = 'reload';

  try {
    const result = await reloadDatabaseConfig();
    if (result.success) {
      showMessage('Database configuration reloaded and reconnection successful');
      await refreshStatus();
    } else {
      showMessage('Database configuration reloaded but reconnection failed', 'error');
    }
  } catch (error) {
    console.error('Database config reload failed:', error);
    showMessage('Database configuration reload failed', 'error');
  } finally {
    isLoading.value = false;
    currentAction.value = '';
  }
};

// Load initial status
onMounted(async () => {
  await refreshStatus();
});
</script>
