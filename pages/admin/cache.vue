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

        <!-- Cache Settings Note -->
        <div class="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mt-8">
          <div class="flex items-center mb-2">
            <svg class="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-blue-400 font-medium">Cache Configuration</span>
          </div>
          <p class="text-blue-300 text-sm">
            To configure cache intervals and settings, visit the
            <NuxtLink to="/admin/settings" class="text-blue-200 hover:text-blue-100 underline">Settings page</NuxtLink>.
            This page is for monitoring and managing active cache entries.
          </p>
        </div>

        <!-- Populate Cache for Testing -->
        <div v-if="!cacheStats || cacheStats.totalEntries === 0" class="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mt-4">
          <div class="flex items-center mb-2">
            <svg class="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <span class="text-yellow-400 font-medium">No Cache Entries Found</span>
          </div>
          <p class="text-yellow-300 text-sm mb-3">
            Cache appears to be empty. You can populate it by visiting pages that use caching, or trigger some cache activity:
          </p>
          <div class="flex gap-2">
            <button
              @click="triggerServerStatus"
              :disabled="isLoading"
              class="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Load Server Status
            </button>
            <button
              @click="triggerLeaderboard"
              :disabled="isLoading"
              class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Load Leaderboard
            </button>
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

const { checkAuth } = useAdmin();

// Trigger cache population for testing
const triggerServerStatus = async () => {
  try {
    await $fetch('/api/server-status');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for cache to populate
    await refreshStats();
  } catch (error) {
    console.error('Failed to trigger server status:', error);
  }
};

const triggerLeaderboard = async () => {
  try {
    await $fetch('/api/leaderboard?limit=10');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for cache to populate
    await refreshStats();
  } catch (error) {
    console.error('Failed to trigger leaderboard:', error);
  }
};

// Check authentication on mount
onMounted(async () => {
  try {
    const isAuth = await checkAuth();
    if (!isAuth) {
      await navigateTo('/admin');
      return;
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    await navigateTo('/admin');
  }
});
</script>
