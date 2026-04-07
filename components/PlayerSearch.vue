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
            placeholder="Search by player name or SteamID"
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
          <p>Search by player name or SteamID (SteamID3, Legacy format)</p>
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
        {{ loading ? 'Searching...' : 'Search' }}
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mt-4 p-4 rounded-lg border" style="background-color: #7f1d1d; border-color: #dc2626;">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span class="text-red-200">{{ error }}</span>
      </div>
    </div>

    <!-- Multiple Results List -->
    <div v-if="searchResults.length > 0" class="mt-4">
      <p class="text-sm mb-2" style="color: #a3a3a3;">{{ searchResults.length }} players found — select one:</p>
      <div class="results-list">
        <button
          v-for="p in searchResults"
          :key="p.steamid"
          class="result-row"
          @click="selectPlayer(p)"
        >
          <span class="result-rank">#{{ p.rank }}</span>
          <span class="result-name">{{ p.name }}</span>
          <span class="result-points">{{ p.points?.toLocaleString() || '0' }} pts</span>
          <span class="result-hours">{{ p.playtimeHours }}h</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

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
const searchResults = ref([]);

const searchPlayer = async () => {
  if (!searchInput.value.trim()) {
    error.value = 'Please enter a player name or SteamID';
    return;
  }

  loading.value = true;
  error.value = null;
  searchResults.value = [];

  try {
    const response = await fetch(`/api/player-search?steamid=${encodeURIComponent(searchInput.value.trim())}&season=${props.selectedSeason.seasonNumber}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      error.value = errorData.message || errorData.statusMessage || `HTTP ${response.status}: ${response.statusText}`;
      return;
    }

    const data = await response.json();

    if (data.success) {
      // Multiple matches — show picker
      if (data.data.multiple && data.data.players?.length > 0) {
        searchResults.value = data.data.players;
        return;
      }

      // Single match — open modal directly
      if (data.data.player) {
        emit('playerFound', {
          player: data.data.player,
          steamid: data.data.player.steamid,
          season: data.data.season
        });
        searchInput.value = '';
      }
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

const selectPlayer = (player) => {
  emit('playerFound', {
    player,
    steamid: player.steamid,
    season: props.selectedSeason
  });
  searchResults.value = [];
  searchInput.value = '';
};

const clearMessages = () => {
  error.value = null;
  searchResults.value = [];
};
</script>

<style scoped>
.results-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid rgba(115, 76, 150, 0.2);
}

.result-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  background: rgba(36, 36, 36, 0.8);
  border: none;
  color: #ffffff;
  cursor: pointer;
  transition: background-color 0.15s ease;
  text-align: left;
  width: 100%;
  font-size: 0.875rem;
}

.result-row:hover {
  background: rgba(115, 76, 150, 0.2);
}

.result-rank {
  color: #734C96;
  font-weight: 600;
  min-width: 2.5rem;
}

.result-name {
  flex: 1;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-points {
  color: #9B6BC7;
  font-weight: 500;
  font-size: 0.8125rem;
}

.result-hours {
  color: #737373;
  font-size: 0.8125rem;
  min-width: 3rem;
  text-align: right;
}
</style>
