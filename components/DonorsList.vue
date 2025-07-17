<template>
  <div class="rounded-lg p-8 shadow-md border" style="background-color: #242424; border-color: #333333;">
    <p class="text-center text-lg mb-8" style="color: #d4d4d4;">
      We'd like to thank the following individuals for their generous support of our server.
    </p>



    <div v-if="loading" class="flex justify-center">
      <div class="animate-pulse space-y-4 w-full max-w-md">
        <div class="h-12 rounded" style="background-color: #1a1a1a;"></div>
        <div class="h-12 rounded" style="background-color: #1a1a1a;"></div>
        <div class="h-12 rounded" style="background-color: #1a1a1a;"></div>
        <div class="h-12 rounded" style="background-color: #1a1a1a;"></div>
      </div>
    </div>

    <div v-else-if="displayDonors.length === 0" class="text-center py-8">
      <p style="color: #a3a3a3;">No donors yet. Be the first to support our server!</p>
      <a href="#donate" class="btn bg-[#0070BA] text-white hover:bg-[#005ea6] transition-colors mt-4 inline-block">Donate Now</a>
      <div v-if="error" class="mt-4">
        <p style="color: #ff6b6b;" class="text-sm">Error loading donor data</p>
        <button
          @click="refresh()"
          class="mt-2 px-4 py-2 rounded text-sm transition-colors"
          style="background-color: #734C96; color: white;"
        >
          Try Again
        </button>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="(donor, index) in displayDonors" :key="index" class="p-4 rounded shadow-sm border animate-on-scroll animate-fade-in" style="background-color: #1e1e1e; border-color: #333333;">
        <div class="flex items-center">
          <div
            class="rounded-full w-10 h-10 flex items-center justify-center font-bold mr-3 text-white text-xs bg-primary"
          >
            {{ donor.tier }}
          </div>
          <div class="flex-1">
            <div class="flex items-center">
              <h4 class="font-bold mr-2" style="color: #ffffff;">{{ donor.display_name || donor.name }}</h4>
            </div>
            <p class="text-sm" style="color: #a3a3a3;">€{{ donor.amount }} total contribution</p>
          </div>
        </div>
      </div>
    </div>

    <div class="text-center mt-8">
      <p style="color: #a3a3a3;">Want to see your name here? <a href="#donate" class="text-primary hover:underline">Make a donation today!</a></p>
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
