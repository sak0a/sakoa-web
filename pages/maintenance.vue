<template>
  <div class="min-h-screen flex items-center justify-center" style="background: linear-gradient(135deg, #23104D, #734C96);">
    <div class="max-w-2xl mx-auto px-4 text-center">
      <div class="bg-white/10 backdrop-blur-lg rounded-lg p-8 shadow-2xl border border-white/20">
        <!-- Logo -->
        <div class="mb-8">
          <img
            src="/assets/img/default-512x512.png"
            alt="Saka's Dodgeball Server Logo"
            class="w-24 h-24 mx-auto mb-6 rounded-lg"
          />
        </div>

        <!-- Maintenance Icon -->
        <div class="mb-6">
          <svg class="w-16 h-16 mx-auto text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>

        <!-- Title -->
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-4">
          {{ maintenanceData?.title || 'Maintenance Mode' }}
        </h1>

        <!-- Message -->
        <p class="text-lg text-white/90 mb-6 leading-relaxed">
          {{ maintenanceData?.message || "We're currently performing maintenance on our servers. Please check back soon!" }}
        </p>

        <!-- Estimated Time -->
        <div v-if="maintenanceData?.estimatedTime" class="mb-6">
          <p class="text-white/80">
            <span class="font-semibold">Estimated completion:</span>
            {{ maintenanceData.estimatedTime }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            @click="checkStatus"
            :disabled="isChecking"
            class="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="isChecking" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-if="isChecking">Checking...</span>
            <span v-else>Check Status</span>
          </button>

          <a
            href="https://discord.gg/your-discord"
            target="_blank"
            rel="noopener noreferrer"
            class="text-white/80 hover:text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Join Discord
          </a>
        </div>

        <!-- Last Updated -->
        <div v-if="maintenanceData?.lastUpdated" class="mt-8 pt-6 border-t border-white/20">
          <p class="text-sm text-white/60">
            Last updated: {{ formatDate(maintenanceData.lastUpdated) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
});

const maintenanceData = ref(null);
const isChecking = ref(false);

// Load maintenance data
const loadMaintenanceData = async () => {
  try {
    const response = await $fetch('/api/maintenance-status');
    maintenanceData.value = response.maintenance;
  } catch (error) {
    console.error('Failed to load maintenance data:', error);
  }
};

// Check if maintenance is still active
const checkStatus = async () => {
  isChecking.value = true;
  try {
    await loadMaintenanceData();
    
    // If maintenance is disabled, redirect to home
    if (!maintenanceData.value?.enabled) {
      await navigateTo('/');
    }
  } catch (error) {
    console.error('Failed to check maintenance status:', error);
  } finally {
    isChecking.value = false;
  }
};

// Format date for display
const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleString();
  } catch (error) {
    return dateString;
  }
};

// Load data on mount
onMounted(() => {
  loadMaintenanceData();
});

// Set page title
useHead({
  title: 'Maintenance Mode - Saka\'s Dodgeball Server',
  meta: [
    { name: 'description', content: 'Saka\'s Dodgeball Server is currently under maintenance. Please check back soon!' }
  ]
});
</script>
