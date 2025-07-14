<template>
  <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-semibold text-white">Cache Management</h3>
      <button
        @click="refreshStats"
        :disabled="isLoading"
        class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
      >
        Refresh
      </button>
    </div>

    <!-- Cache Statistics -->
    <div v-if="cacheStats" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-gray-700 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-300 mb-2">Total Entries</h4>
        <div class="text-2xl font-bold text-white">{{ cacheStats.totalEntries }}</div>
      </div>
      
      <div class="bg-gray-700 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-300 mb-2">Memory Usage</h4>
        <div class="text-2xl font-bold text-white">{{ formatBytes(cacheStats.memoryUsage) }}</div>
      </div>
      
      <div class="bg-gray-700 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-300 mb-2">Expired Entries</h4>
        <div class="text-2xl font-bold text-red-400">{{ expiredCount }}</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <button
        @click="forceRefresh('servers')"
        :disabled="isLoading"
        class="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-colors"
      >
        Refresh Servers
      </button>
      
      <button
        @click="forceRefresh('leaderboard')"
        :disabled="isLoading"
        class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-colors"
      >
        Refresh Leaderboard
      </button>
      
      <button
        @click="cleanup"
        :disabled="isLoading"
        class="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-colors"
      >
        Cleanup Expired
      </button>
      
      <button
        @click="clearAll"
        :disabled="isLoading"
        class="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-colors"
      >
        Clear All
      </button>
    </div>

    <!-- Cache Entries Table -->
    <div v-if="cacheStats && cacheStats.entries.length > 0" class="bg-gray-700 rounded-lg overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-600">
        <h4 class="text-lg font-medium text-white">Cache Entries</h4>
      </div>
      
      <div class="max-h-64 overflow-y-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-600 sticky top-0">
            <tr>
              <th class="px-4 py-2 text-left text-gray-300">Key</th>
              <th class="px-4 py-2 text-left text-gray-300">TTL</th>
              <th class="px-4 py-2 text-left text-gray-300">Size</th>
              <th class="px-4 py-2 text-left text-gray-300">Status</th>
              <th class="px-4 py-2 text-left text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in cacheStats.entries" :key="entry.key" class="border-b border-gray-600">
              <td class="px-4 py-2 text-white font-mono text-xs">
                {{ truncateKey(entry.key) }}
              </td>
              <td class="px-4 py-2 text-white">
                {{ entry.ttlRemaining }}s
              </td>
              <td class="px-4 py-2 text-white">
                {{ formatBytes(entry.dataSize) }}
              </td>
              <td class="px-4 py-2">
                <span 
                  class="px-2 py-1 rounded text-xs"
                  :class="entry.isExpired ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'"
                >
                  {{ entry.isExpired ? 'Expired' : 'Valid' }}
                </span>
              </td>
              <td class="px-4 py-2">
                <button
                  @click="clearSpecific(entry.key)"
                  :disabled="isLoading"
                  class="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-2 py-1 rounded text-xs transition-colors"
                >
                  Clear
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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

const { getCacheStats, clearCache, forceRefreshCache, cleanupCache } = useAdmin();

const cacheStats = ref(null);
const isLoading = ref(false);
const message = ref('');
const messageType = ref('success');

const expiredCount = computed(() => {
  if (!cacheStats.value) return 0;
  return cacheStats.value.entries.filter(entry => entry.isExpired).length;
});

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const truncateKey = (key) => {
  return key.length > 30 ? key.substring(0, 30) + '...' : key;
};

const showMessage = (msg, type = 'success') => {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 5000);
};

const refreshStats = async () => {
  isLoading.value = true;
  
  try {
    const stats = await getCacheStats();
    cacheStats.value = stats;
  } catch (error) {
    console.error('Failed to refresh cache stats:', error);
    showMessage('Failed to refresh cache statistics', 'error');
  } finally {
    isLoading.value = false;
  }
};

const forceRefresh = async (dataType) => {
  isLoading.value = true;
  
  try {
    const result = await forceRefreshCache(dataType);
    if (result.success) {
      showMessage(result.message);
      await refreshStats();
    } else {
      showMessage('Failed to force refresh cache', 'error');
    }
  } catch (error) {
    console.error('Failed to force refresh:', error);
    showMessage('Failed to force refresh cache', 'error');
  } finally {
    isLoading.value = false;
  }
};

const clearAll = async () => {
  if (!confirm('Are you sure you want to clear all cache entries?')) {
    return;
  }
  
  isLoading.value = true;
  
  try {
    const result = await clearCache();
    if (result.success) {
      showMessage(result.message);
      await refreshStats();
    } else {
      showMessage('Failed to clear cache', 'error');
    }
  } catch (error) {
    console.error('Failed to clear cache:', error);
    showMessage('Failed to clear cache', 'error');
  } finally {
    isLoading.value = false;
  }
};

const clearSpecific = async (key) => {
  isLoading.value = true;
  
  try {
    const result = await clearCache(key);
    if (result.success) {
      showMessage(result.message);
      await refreshStats();
    } else {
      showMessage('Failed to clear cache entry', 'error');
    }
  } catch (error) {
    console.error('Failed to clear cache entry:', error);
    showMessage('Failed to clear cache entry', 'error');
  } finally {
    isLoading.value = false;
  }
};

const cleanup = async () => {
  isLoading.value = true;
  
  try {
    const result = await cleanupCache();
    if (result.success) {
      showMessage(result.message);
      await refreshStats();
    } else {
      showMessage('Failed to cleanup cache', 'error');
    }
  } catch (error) {
    console.error('Failed to cleanup cache:', error);
    showMessage('Failed to cleanup cache', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Load initial stats
onMounted(async () => {
  await refreshStats();
});
</script>
