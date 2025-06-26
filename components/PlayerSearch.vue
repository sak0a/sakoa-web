<template>
  <div class="mb-6">
    <div class="flex flex-col sm:flex-row gap-4">
      <!-- Search Input -->
      <div class="flex-1">
        <div class="relative">
          <input
            v-model="searchInput"
            @keyup.enter="searchPlayer"
            @input="clearMessages"
            type="text"
            placeholder="Enter SteamID (any format)"
            class="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
            style="background-color: #242424; border-color: #333333; color: #ffffff;"
            :disabled="loading"
          />
          <div class="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" style="color: #a3a3a3;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <!-- Help Text -->
        <div class="mt-2 text-xs" style="color: #a3a3a3;">
          <p>Supported formats: SteamID64 (76561198XXXXXXXXX), SteamID3 ([U:1:XXXXXXXX]), Legacy (STEAM_0:X:XXXXXXXX)</p>
        </div>
      </div>

      <!-- Search Button -->
      <button
        @click="searchPlayer"
        :disabled="loading || !searchInput.trim()"
        class="px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        style="background-color: #734C96; color: white;"
      >
        <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {{ loading ? 'Searching...' : 'Search Player' }}
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mt-4 p-4 rounded-lg border" style="background-color: #7f1d1d; border-color: #dc2626;">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span class="text-red-200">{{ error }}</span>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="mt-4 p-4 rounded-lg border" style="background-color: #065f46; border-color: #10b981;">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-green-200">{{ successMessage }}</span>
      </div>
    </div>

    <!-- Examples -->
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  selectedSeason: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['playerFound']);

const searchInput = ref('');
const loading = ref(false);
const error = ref(null);
const successMessage = ref(null);

const searchPlayer = async () => {
  if (!searchInput.value.trim()) {
    error.value = 'Please enter a SteamID';
    return;
  }

  loading.value = true;
  error.value = null;
  successMessage.value = null;

  try {
    const response = await fetch(`/api/player-search?steamid=${encodeURIComponent(searchInput.value.trim())}&season=${props.selectedSeason.seasonNumber}`);

    // Check if the response is ok (status 200-299)
    if (!response.ok) {
      // Handle HTTP error responses (400, 404, 500, etc.)
      const errorData = await response.json().catch(() => ({}));
      error.value = errorData.message || errorData.statusMessage || `HTTP ${response.status}: ${response.statusText}`;
      return;
    }

    const data = await response.json();

    if (data.success) {
      successMessage.value = `Found player: ${data.data.player.name}`;
      emit('playerFound', {
        player: data.data.player,
        steamid: data.data.searchedSteamID,
        season: data.data.season
      });
      // Clear the input after successful search
      searchInput.value = '';
    } else {
      error.value = data.error;
    }
  } catch (err) {
    console.error('Error searching for player:', err);
    error.value = 'Failed to search for player. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Clear messages when input changes
const clearMessages = () => {
  error.value = null;
  successMessage.value = null;
};
</script>
