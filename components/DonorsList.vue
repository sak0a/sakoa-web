<template>
  <div class="glass-card p-8">
    <p class="text-center text-lg mb-8 text-gray-300">
      We'd like to thank the following individuals for their generous support of our server.
    </p>



    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="glass-card p-6 animate-pulse" style="background: rgba(255, 255, 255, 0.02);">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-gray-700 rounded-full mr-3"></div>
          <div class="flex-1">
            <div class="h-4 bg-gray-700 rounded mb-2"></div>
            <div class="h-3 bg-gray-800 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="displayDonors.length === 0" class="glass-card p-8 text-center" style="background: rgba(255, 255, 255, 0.02);">
      <p class="text-gray-400 mb-4">No donors yet. Be the first to support our server!</p>
      <a href="#donate" class="btn btn-primary">Donate Now</a>
      <div v-if="error" class="mt-6 glass-card p-4" style="background: rgba(239, 68, 68, 0.1);">
        <p class="text-red-400 text-sm mb-3">Error loading donor data</p>
        <button
          @click="refresh()"
          class="btn btn-outline btn-sm"
        >
          Try Again
        </button>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="(donor, index) in displayDonors" :key="index" class="donor-card p-6 animate-on-scroll animate-fade-in">
        <div class="flex items-center">
          <div class="rounded-full w-12 h-12 flex items-center justify-center font-bold mr-4 text-white text-sm bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
            {{ donor.tier }}
          </div>
          <div class="flex-1">
            <h4 class="font-bold text-white mb-1">{{ donor.display_name || donor.name }}</h4>
            <p class="text-sm text-gray-300">€{{ donor.amount }} total contribution</p>
          </div>
        </div>
      </div>
    </div>

    <div class="text-center mt-8">
      <p class="text-gray-400">Want to see your name here? <a href="#donate" class="text-primary-400 hover:text-primary-300 hover:underline transition-colors">Make a donation today!</a></p>
    </div>
  </div>
</template>

<script setup>
// Use Nuxt's composables for better SSR support
const { $fetch } = useNuxtApp();

// Use reactive state with proper initialization
const { data: donorsData, pending: loading, error, refresh } = await useLazyFetch('/api/donors', {
  default: () => ({ donors: [] }),
  transform: (data) => {
    console.log('Donors data received:', data);
    return data;
  },
  onResponseError({ response }) {
    console.warn('Donors API error:', response.status);
  }
});

// Computed property to get the donors array
const donors = computed(() => {
  if (donorsData.value && Array.isArray(donorsData.value.donors)) {
    return donorsData.value.donors;
  }
  return [];
});

// Fallback data in case of API failure
const fallbackDonors = [
  { name: "saka", amount: 100, tier: "VIP", date: "2024-05-15" }
];

// Use fallback if no donors are loaded and there's an error
const displayDonors = computed(() => {
  if (error.value && donors.value.length === 0) {
    console.log('Using fallback donor data due to error');
    return fallbackDonors;
  }
  return donors.value;
});

// Function to get display initial from donor name
const getDisplayInitial = (donor) => {
  const name = donor.display_name || donor.name || 'Anonymous';
  return name.charAt(0).toUpperCase();
};
</script>
