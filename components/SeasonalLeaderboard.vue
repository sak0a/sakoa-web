<template>
  <div class="rounded-lg p-8 shadow-lg border" style="background-color: #242424; border-color: #333333;">
    <!-- Header with Season Selection -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
      <div>
        <h3 class="text-2xl font-bold mb-2" style="color: #ffffff;">Player Leaderboard</h3>
        <p class="text-sm" style="color: #a3a3a3;">{{ selectedSeason?.displayName || 'Loading seasons...' }}</p>
      </div>
      
      <!-- Season Selector -->
      <div class="flex flex-col sm:flex-row gap-4">
        <CustomSelect
          v-model="selectedSeasonNumber"
          :options="availableSeasons"
          :loading="seasonsLoading"
          placeholder="Select a season..."
          label-key="displayName"
          value-key="seasonNumber"
          description-key="dateRange"
          @change="onSeasonChange"
          class="min-w-56"
        />
      </div>
    </div>

    <!-- Player Search -->
    <PlayerSearch
      v-if="selectedSeason"
      :selectedSeason="selectedSeason"
      @playerFound="onPlayerFound"
    />

    <!-- Sort Controls -->
    <div class="flex flex-wrap gap-4 mb-6">
      <CustomSelect
        v-model="selectedSort"
        :options="sortOptions"
        placeholder="Sort by..."
        label-key="label"
        value-key="value"
        @change="fetchLeaderboard"
        class="min-w-44"
      />

      <CustomSelect
        v-model="selectedOrder"
        :options="orderOptions"
        placeholder="Order..."
        label-key="label"
        value-key="value"
        @change="fetchLeaderboard"
        class="min-w-36"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style="border-color: #734C96;"></div>
      <p style="color: #a3a3a3;">Loading leaderboard...</p>
    </div>

    <!-- Leaderboard Content -->
    <div v-else-if="!loading && players.length > 0">
      <!-- Top 3 Players (Podium Style) -->
      <div v-if="topThree.length > 0" class="mb-8">
        <h4 class="text-lg font-bold mb-4 text-center" style="color: #ffffff;"> Top 3 Champions </h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="player in topThree"
            :key="player.steamid"
            class="relative p-6 rounded-xl shadow-lg border-2"
            :class="getPodiumClass(player.rank)"
          >
            <!-- Rank Badge -->
            <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                :class="getRankBadgeClass(player.rank)"
              >
                {{ player.rank }}
              </div>
            </div>

            <!-- Player Info -->
            <div class="text-center mt-2">
              <h5
                class="font-bold text-lg mb-2 text-shadow-sm cursor-pointer hover:underline transition-all duration-200"
                :style="{ color: getPlayerNameColor(player.rank) }"
                @click="openPlayerModal(player.steamid)"
                :title="`Click to view ${player.name}'s detailed stats`"
              >
                {{ player.name }}
              </h5>
              <div class="text-2xl font-bold mb-2 text-shadow-sm" :style="{ color: getStatValueColor(player.rank) }">
                {{ formatStatValue(player[selectedSort], selectedSort) }}
              </div>
              <p class="text-sm font-medium text-shadow-sm" :style="{ color: getStatLabelColor(player.rank) }">{{ getStatLabel(selectedSort) }}</p>

              <!-- Additional Stats -->
              <div class="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div class="bg-black bg-opacity-20 rounded px-2 py-1">
                  <span class="font-medium" :style="{ color: getStatLabelColor(player.rank) }">K/D:</span>
                  <span class="font-bold ml-1" :style="{ color: getStatValueColor(player.rank) }">{{ player.kd_ratio }}</span>
                </div>
                <div class="bg-black bg-opacity-20 rounded px-2 py-1">
                  <span class="font-medium" :style="{ color: getStatLabelColor(player.rank) }">Hours:</span>
                  <span class="font-bold ml-1" :style="{ color: getStatValueColor(player.rank) }">{{ player.playtimeHours }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Positions 4-10 (Custom Two-Row Layout) -->
      <div v-if="standardList.length > 0" class="mb-8">
        <h4 class="text-lg font-bold mb-4" style="color: #ffffff;">🥇 Top Performers</h4>

        <!-- First Row: Ranks 4-6 (3 columns) -->
        <div v-if="standardList.slice(0, 3).length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div
            v-for="player in standardList.slice(0, 3)"
            :key="player.steamid"
            class="flex items-center p-4 rounded-lg border transition-all duration-200 hover:border-purple-500 hover:shadow-lg"
            style="background-color: #1a1a1a; border-color: #333333;"
          >
            <!-- Rank -->
            <div class="w-10 h-10 rounded-full flex items-center justify-center mr-4 font-bold text-white" style="background-color: #734C96;">
              {{ player.rank }}
            </div>

            <!-- Player Info -->
            <div class="flex-1 min-w-0">
              <h5
                class="font-bold truncate mb-1 cursor-pointer hover:underline transition-all duration-200"
                style="color: #ffffff;"
                :title="`Click to view ${player.name}'s detailed stats`"
                @click="openPlayerModal(player.steamid)"
              >
                {{ player.name }}
              </h5>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between items-center">
                  <span style="color: #a3a3a3;">{{ getStatLabel(selectedSort) }}:</span>
                  <span class="font-bold" style="color: #734C96;">{{ formatStatValue(player[selectedSort], selectedSort) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span style="color: #a3a3a3;">K/D:</span>
                  <span style="color: #ffffff;">{{ player.kd_ratio }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span style="color: #a3a3a3;">Hours:</span>
                  <span style="color: #ffffff;">{{ player.playtimeHours }}h</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Second Row: Ranks 7-10 (4 columns) -->
        <div v-if="standardList.slice(3, 7).length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="player in standardList.slice(3, 7)"
            :key="player.steamid"
            class="flex items-center p-4 rounded-lg border transition-all duration-200 hover:border-purple-500 hover:shadow-lg"
            style="background-color: #1a1a1a; border-color: #333333;"
          >
            <!-- Rank -->
            <div class="w-10 h-10 rounded-full flex items-center justify-center mr-4 font-bold text-white" style="background-color: #734C96;">
              {{ player.rank }}
            </div>

            <!-- Player Info -->
            <div class="flex-1 min-w-0">
              <h5
                class="font-bold truncate mb-1 cursor-pointer hover:underline transition-all duration-200"
                style="color: #ffffff;"
                :title="`Click to view ${player.name}'s detailed stats`"
                @click="openPlayerModal(player.steamid)"
              >
                {{ player.name }}
              </h5>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between items-center">
                  <span style="color: #a3a3a3;">{{ getStatLabel(selectedSort) }}:</span>
                  <span class="font-bold" style="color: #734C96;">{{ formatStatValue(player[selectedSort], selectedSort) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span style="color: #a3a3a3;">K/D:</span>
                  <span style="color: #ffffff;">{{ player.kd_ratio }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span style="color: #a3a3a3;">Hours:</span>
                  <span style="color: #ffffff;">{{ player.playtimeHours }}h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Positions 11-50 (Scrollable) -->
      <div v-if="scrollableList.length > 0">
        <h4 class="text-lg font-bold mb-4" style="color: #ffffff;"> All Players</h4>
        <div class="max-h-96 overflow-y-auto rounded-lg border" style="border-color: #333333;">
          <table class="min-w-full">
            <thead class="sticky top-0" style="background-color: #1a1a1a;">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: #a3a3a3;">Rank</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: #a3a3a3;">Player</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: #a3a3a3;">{{ getStatLabel(selectedSort) }}</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: #a3a3a3;">K/D</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style="color: #a3a3a3;">Hours</th>
              </tr>
            </thead>
            <tbody style="background-color: #242424;">
              <tr
                v-for="player in scrollableList"
                :key="player.steamid"
                class="border-b hover:bg-opacity-50 hover:bg-gray-700 transition-colors"
                style="border-color: #333333;"
              >
                <td class="px-4 py-3 text-sm font-medium" style="color: #734C96;">{{ player.rank }}</td>
                <td class="px-4 py-3 text-sm font-medium cursor-pointer hover:underline transition-all duration-200"
                    style="color: #ffffff;"
                    @click="openPlayerModal(player.steamid)"
                    :title="`Click to view ${player.name}'s detailed stats`"
                >
                  {{ player.name }}
                </td>
                <td class="px-4 py-3 text-sm" style="color: #d4d4d4;">{{ formatStatValue(player[selectedSort], selectedSort) }}</td>
                <td class="px-4 py-3 text-sm" style="color: #d4d4d4;">{{ player.kd_ratio }}</td>
                <td class="px-4 py-3 text-sm" style="color: #d4d4d4;">{{ player.playtimeHours }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="mt-6 text-center">
        <p class="text-sm" style="color: #a3a3a3;">
          Showing {{ players.length }} players • Last updated: {{ new Date().toLocaleDateString() }}
        </p>
        <p v-if="error" class="text-xs mt-1" style="color: #ef4444;">
          ⚠️ Using cached data due to database connection issues
        </p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <p style="color: #a3a3a3;">No player data available for this season</p>
    </div>

    <!-- Player Modal -->
    <PlayerModal
      :isOpen="showPlayerModal"
      :steamid="selectedPlayerSteamId"
      :season="selectedSeason"
      @close="closePlayerModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import PlayerSearch from './PlayerSearch.vue';
import PlayerModal from './PlayerModal.vue';
import CustomSelect from './CustomSelect.vue';

// Reactive data
const availableSeasons = ref([]);
const selectedSeasonNumber = ref(null);
const selectedSeason = ref(null);
const players = ref([]);
const loading = ref(true);
const seasonsLoading = ref(true);
const error = ref(null);
const selectedSort = ref('points');
const selectedOrder = ref('desc');

// Player modal state
const showPlayerModal = ref(false);
const selectedPlayerSteamId = ref(null);

// Sort and order options for CustomSelect
const sortOptions = ref([
  { label: 'Sort by Points', value: 'points' },
  { label: 'Sort by Top Speed', value: 'topspeed' },
  { label: 'Sort by Playtime', value: 'playtime' },
  { label: 'Sort by Kills', value: 'kills' },
  { label: 'Sort by Deaths', value: 'deaths' }
]);

const orderOptions = ref([
  { label: 'Highest First', value: 'desc' },
  { label: 'Lowest First', value: 'asc' }
]);

// Computed properties for different sections
const topThree = computed(() => players.value.slice(0, 3));
const standardList = computed(() => players.value.slice(3, 10));
const scrollableList = computed(() => players.value.slice(10));

// Fetch available seasons
const fetchSeasons = async () => {
  seasonsLoading.value = true;
  try {
    const response = await fetch('/api/seasons');
    const data = await response.json();

    if (data.success) {
      availableSeasons.value = data.data.seasons;
      // Set current season as default
      if (data.data.seasons.length > 0) {
        const currentSeason = data.data.seasons.find(s => s.isCurrent) || data.data.seasons[0];
        selectedSeasonNumber.value = currentSeason.seasonNumber;
        selectedSeason.value = currentSeason;
      }
    }
  } catch (err) {
    console.error('Error fetching seasons:', err);
  } finally {
    seasonsLoading.value = false;
  }
};

// Fetch leaderboard data for selected season
const fetchLeaderboard = async () => {
  if (!selectedSeasonNumber.value) return;

  loading.value = true;
  error.value = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`/api/seasonal-leaderboard?season=${selectedSeasonNumber.value}&sortBy=${selectedSort.value}&order=${selectedOrder.value}&limit=50`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      players.value = data.data.players;
      selectedSeason.value = data.data.season;
    } else {
      error.value = data.error;
      players.value = data.data?.players || [];
    }
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    error.value = err.message;
    players.value = [];
  } finally {
    loading.value = false;
  }
};

// Handle season change
const onSeasonChange = () => {
  const season = availableSeasons.value.find(s => s.seasonNumber === selectedSeasonNumber.value);
  if (season) {
    selectedSeason.value = season;
    fetchLeaderboard();
  }
};

// Handle player found from search
const onPlayerFound = (data) => {
  selectedPlayerSteamId.value = data.steamid;
  showPlayerModal.value = true;
};

// Open player modal
const openPlayerModal = (steamid) => {
  selectedPlayerSteamId.value = steamid;
  showPlayerModal.value = true;
};

// Close player modal
const closePlayerModal = () => {
  showPlayerModal.value = false;
  selectedPlayerSteamId.value = null;
};

// Initialize on mount
onMounted(async () => {
  await fetchSeasons();
  if (selectedSeasonNumber.value) {
    await fetchLeaderboard();
  }
});

// Watch for sort/order changes
watch([selectedSort, selectedOrder], fetchLeaderboard);

// Utility functions (copied from original Leaderboard component)
const formatStatValue = (value, statType) => {
  if (!value && value !== 0) return '0';

  switch (statType) {
    case 'topspeed':
      return `${value.toLocaleString()} mph`;
    case 'playtime':
      return `${Math.round(value / 3600)} hrs`;
    case 'points':
      return value.toLocaleString();
    case 'kills':
    case 'deaths':
      return value.toLocaleString();
    default:
      return value.toString();
  }
};

const getStatLabel = (statType) => {
  const labels = {
    topspeed: 'Top Speed',
    points: 'Points',
    playtime: 'Playtime',
    kills: 'Kills',
    deaths: 'Deaths'
  };
  return labels[statType] || statType;
};

const getPodiumClass = (rank) => {
  const classes = {
    1: 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-500',
    2: 'bg-gradient-to-br from-gray-300 to-gray-500 border-gray-400',
    3: 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-500'
  };
  return classes[rank] || 'bg-gradient-to-br from-purple-500 to-purple-700 border-purple-600';
};

const getRankBadgeClass = (rank) => {
  const classes = {
    1: 'bg-yellow-500',
    2: 'bg-gray-400',
    3: 'bg-orange-500'
  };
  return classes[rank] || 'bg-purple-600';
};

const getPlayerNameColor = (rank) => {
  const colors = {
    1: '#1f2937', // Dark for gold background
    2: '#1f2937', // Dark for silver background
    3: '#1f2937'  // Dark for bronze background
  };
  return colors[rank] || '#ffffff';
};

const getStatValueColor = (rank) => {
  const colors = {
    1: '#1f2937', // Dark for gold background
    2: '#1f2937', // Dark for silver background
    3: '#1f2937'  // Dark for bronze background
  };
  return colors[rank] || '#ffffff';
};

const getStatLabelColor = (rank) => {
  const colors = {
    1: '#374151', // Slightly lighter dark for gold background
    2: '#374151', // Slightly lighter dark for silver background
    3: '#374151'  // Slightly lighter dark for bronze background
  };
  return colors[rank] || '#a3a3a3';
};
</script>
