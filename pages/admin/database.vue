<template>
  <div class="min-h-screen bg-gray-900">
    <AdminLayout>
      <div class="p-6">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">Database Management</h1>
          <p class="text-gray-400">Monitor and manage your database connection</p>
        </div>

        <!-- Database Status Section -->
        <div class="mb-8">
          <DatabaseStatus />
        </div>

        <!-- Database Operations -->
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h3 class="text-xl font-semibold text-white mb-4">Database Operations</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Test Connection -->
            <div class="bg-gray-700 rounded-lg p-4">
              <div class="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 class="text-lg font-medium text-white">Test Connection</h4>
              </div>
              <p class="text-gray-300 text-sm mb-4">
                Verify that the database connection is working properly without affecting the current connection.
              </p>
              <button
                @click="testConnection"
                :disabled="isLoading"
                class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Test Connection
              </button>
            </div>

            <!-- Retry Connection -->
            <div class="bg-gray-700 rounded-lg p-4">
              <div class="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <h4 class="text-lg font-medium text-white">Retry Connection</h4>
              </div>
              <p class="text-gray-300 text-sm mb-4">
                Force a reconnection to the database. This will close the current connection and establish a new one.
              </p>
              <button
                @click="retryConnection"
                :disabled="isLoading"
                class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Retry Connection
              </button>
            </div>

            <!-- Detailed Status -->
            <div class="bg-gray-700 rounded-lg p-4">
              <div class="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h4 class="text-lg font-medium text-white">Detailed Status</h4>
              </div>
              <p class="text-gray-300 text-sm mb-4">
                Get comprehensive information about the current database connection and perform a full diagnostic.
              </p>
              <button
                @click="getDetailedStatus"
                :disabled="isLoading"
                class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Get Detailed Status
              </button>
            </div>

            <!-- Reload Configuration -->
            <div class="bg-gray-700 rounded-lg p-4">
              <div class="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-orange-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h4 class="text-lg font-medium text-white">Reload Configuration</h4>
              </div>
              <p class="text-gray-300 text-sm mb-4">
                Reload database credentials from environment variables (.env file) and force reconnection. Useful when credentials have changed.
              </p>
              <button
                @click="reloadConfig"
                :disabled="isLoading"
                class="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Reload Config & Reconnect
              </button>
            </div>
          </div>
        </div>

        <!-- Detailed Status Results -->
        <div v-if="detailedStatus" class="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h3 class="text-xl font-semibold text-white mb-4">Detailed Status Results</h3>
          
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Current State (without connection attempt) -->
            <div class="bg-gray-700 rounded-lg p-4">
              <h4 class="text-lg font-medium text-white mb-3">Current State</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Connection Object:</span>
                  <span :class="detailedStatus.currentState.connected ? 'text-green-400' : 'text-yellow-400'">
                    {{ detailedStatus.currentState.connected ? 'Exists' : 'None' }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Status:</span>
                  <span class="text-white">{{ detailedStatus.currentState.connection.status }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Last Check:</span>
                  <span class="text-white font-mono text-xs">{{ formatTimestamp(detailedStatus.currentState.connection.timestamp) }}</span>
                </div>
                <div v-if="detailedStatus.currentState.error" class="mt-2">
                  <span class="text-gray-400">Error:</span>
                  <div class="text-red-400 text-xs mt-1 font-mono bg-red-900/20 p-2 rounded">
                    {{ detailedStatus.currentState.error.message }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Active Status (with connection attempt) -->
            <div class="bg-gray-700 rounded-lg p-4">
              <h4 class="text-lg font-medium text-white mb-3">Active Connection</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Connected:</span>
                  <span :class="detailedStatus.activeStatus.connected ? 'text-green-400' : 'text-red-400'">
                    {{ detailedStatus.activeStatus.connected ? 'Yes' : 'No' }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Status:</span>
                  <span class="text-white">{{ detailedStatus.activeStatus.connection.status }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Last Check:</span>
                  <span class="text-white font-mono text-xs">{{ formatTimestamp(detailedStatus.activeStatus.connection.timestamp) }}</span>
                </div>
                <div v-if="detailedStatus.activeStatus.error" class="mt-2">
                  <span class="text-gray-400">Error:</span>
                  <div class="text-red-400 text-xs mt-1 font-mono bg-red-900/20 p-2 rounded">
                    {{ detailedStatus.activeStatus.error.message }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Test Results -->
            <div class="bg-gray-700 rounded-lg p-4">
              <h4 class="text-lg font-medium text-white mb-3">Fresh Test Results</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Test Result:</span>
                  <span :class="detailedStatus.testResult.success ? 'text-green-400' : 'text-red-400'">
                    {{ detailedStatus.testResult.success ? 'Success' : 'Failed' }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Test Time:</span>
                  <span class="text-white font-mono text-xs">{{ formatTimestamp(detailedStatus.testResult.connection.timestamp) }}</span>
                </div>
                <div v-if="detailedStatus.testResult.error" class="mt-2">
                  <span class="text-gray-400">Error:</span>
                  <div class="text-red-400 text-xs mt-1 font-mono bg-red-900/20 p-2 rounded">
                    {{ detailedStatus.testResult.error.message }}
                  </div>
                </div>
              </div>
            </div>
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

const {
  checkAuth,
  testDatabaseConnection,
  retryDatabaseConnection,
  getDetailedDatabaseStatus,
  reloadDatabaseConfig
} = useAdmin();

const isLoading = ref(false);
const message = ref('');
const messageType = ref('success');
const detailedStatus = ref(null);

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

const testConnection = async () => {
  isLoading.value = true;
  
  try {
    const result = await testDatabaseConnection();
    if (result.success) {
      showMessage('Database connection test successful');
    } else {
      showMessage('Database connection test failed', 'error');
    }
  } catch (error) {
    console.error('Database test failed:', error);
    showMessage('Database connection test failed', 'error');
  } finally {
    isLoading.value = false;
  }
};

const retryConnection = async () => {
  isLoading.value = true;
  
  try {
    const result = await retryDatabaseConnection();
    if (result.success) {
      showMessage('Database connection retry successful');
    } else {
      showMessage('Database connection retry failed', 'error');
    }
  } catch (error) {
    console.error('Database retry failed:', error);
    showMessage('Database connection retry failed', 'error');
  } finally {
    isLoading.value = false;
  }
};

const getDetailedStatus = async () => {
  isLoading.value = true;

  try {
    const result = await getDetailedDatabaseStatus();
    detailedStatus.value = result;
    showMessage('Detailed database status retrieved successfully');
  } catch (error) {
    console.error('Failed to get detailed status:', error);
    showMessage('Failed to get detailed database status', 'error');
  } finally {
    isLoading.value = false;
  }
};

const reloadConfig = async () => {
  isLoading.value = true;

  try {
    const result = await reloadDatabaseConfig();
    if (result.success) {
      showMessage('Database configuration reloaded and reconnection successful');
      // Clear detailed status to force refresh
      detailedStatus.value = null;
    } else {
      showMessage('Database configuration reloaded but reconnection failed', 'error');
    }
  } catch (error) {
    console.error('Database config reload failed:', error);
    showMessage('Database configuration reload failed', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Check authentication on mount
onMounted(async () => {
  try {
    const isAuth = await checkAuth();
    if (!isAuth) {
      await navigateTo('/admin');
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    await navigateTo('/admin');
  }
});
</script>
