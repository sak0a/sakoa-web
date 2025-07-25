<template>
  <div class="leaderboard-glass-container rounded-lg p-8 shadow-md border" style="border-color: #333333;">
    <!-- Header with Filter Controls -->
    <div class="flex flex-col md:flex-row justify-between items-center mb-8">
      <h3 class="text-2xl font-bold mb-4 md:mb-0" style="color: #734C96;">Player Leaderboard</h3>

      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Sort Field Selector -->
        <div class="flex flex-col">
          <label class="text-sm font-medium mb-1" style="color: #d4d4d4;">Sort by:</label>
          <select
            v-model="selectedSort"
            class="px-3 py-2 rounded border text-sm"
            style="background-color: #1e1e1e; border-color: #333333; color: #ffffff;"
          >
            <option value="points">Points</option>
            <option value="topspeed">Top Speed</option>
            <option value="playtime">Playtime</option>
            <option value="kills">Kills</option>
            <option value="deaths">Deaths</option>
          </select>
        </div>

        <!-- Sort Order Selector -->
        <div class="flex flex-col">
          <label class="text-sm font-medium mb-1" style="color: #d4d4d4;">Order:</label>
          <select
            v-model="selectedOrder"
            class="px-3 py-2 rounded border text-sm"
            style="background-color: #1e1e1e; border-color: #333333; color: #ffffff;"
          >
            <option value="desc">Highest First</option>
            <option value="asc">Lowest First</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="space-y-4 w-full">
        <div class="h-20 rounded animate-pulse" style="background-color: #1a1a1a;"></div>
        <div class="h-16 rounded animate-pulse" style="background-color: #1a1a1a;"></div>
        <div class="h-16 rounded animate-pulse" style="background-color: #1a1a1a;"></div>
        <p class="text-center mt-4" style="color: #a3a3a3;">Loading player statistics...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error && players.length === 0" class="text-center py-8">
      <p style="color: #ef4444;">Failed to load leaderboard data</p>
      <p class="text-sm mt-2" style="color: #a3a3a3;">{{ error }}</p>
    </div>

    <!-- Leaderboard Content -->
    <div v-else-if="!loading && players.length > 0">
      <!-- Top 3 Players (Podium Style) -->
      <div v-if="topThree.length > 0" class="mb-8">
        <h4 class="text-lg font-bold mb-4 text-center" style="color: #ffffff;">🏆 Top 3 Champions 🏆</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div
            v-for="player in topThree"
            :key="player.steamid"
            class="relative p-6 rounded-xl shadow-lg backdrop-filter backdrop-blur-md"
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
              <h5 class="font-bold text-lg mb-2 text-shadow-sm" :style="{ color: getPlayerNameColor(player.rank) }">{{ player.name }}</h5>
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
            style="background-color: #1e1e1e; border-color: #333333;"
          >
            <!-- Rank -->
            <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mr-4 flex-shrink-0" style="background-color: #734C96;">
              {{ player.rank }}
            </div>

            <!-- Player Info -->
            <div class="flex-1 min-w-0">
              <h5 class="font-bold truncate mb-1" style="color: #ffffff;" :title="player.name">{{ player.name }}</h5>
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
        <div v-if="standardList.slice(3).length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="player in standardList.slice(3)"
            :key="player.steamid"
            class="flex items-center p-4 rounded-lg border transition-all duration-200 hover:border-purple-500 hover:shadow-lg"
            style="background-color: #1e1e1e; border-color: #333333;"
          >
            <!-- Rank -->
            <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mr-4 flex-shrink-0" style="background-color: #734C96;">
              {{ player.rank }}
            </div>

            <!-- Player Info -->
            <div class="flex-1 min-w-0">
              <h5 class="font-bold truncate mb-1" style="color: #ffffff;" :title="player.name">{{ player.name }}</h5>
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
        <h4 class="text-lg font-bold mb-4" style="color: #ffffff;">📊 All Players</h4>
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
            <tbody style="background-color: #1e1e1e;">
              <tr
                v-for="player in scrollableList"
                :key="player.steamid"
                class="border-t hover:bg-opacity-50 transition-colors"
                style="border-color: #333333;"
                :style="{ backgroundColor: player.rank % 2 === 0 ? '#242424' : '#1e1e1e' }"
              >
                <td class="px-4 py-3 text-sm font-medium" style="color: #ffffff;">{{ player.rank }}</td>
                <td class="px-4 py-3 text-sm font-medium" style="color: #ffffff;">{{ player.name }}</td>
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
      <p style="color: #a3a3a3;">No player data available</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const players = ref([]);
const loading = ref(true);
const error = ref(null);
const selectedSort = ref('points');
const selectedOrder = ref('desc');

// Computed properties for different sections
const topThree = computed(() => players.value.slice(0, 3));
const standardList = computed(() => players.value.slice(3, 10));
const scrollableList = computed(() => players.value.slice(10));

// Fetch leaderboard data
const fetchLeaderboard = async () => {
  loading.value = true;
  error.value = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`/api/leaderboard?sortBy=${selectedSort.value}&order=${selectedOrder.value}&limit=50`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      players.value = data.data.players;
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

// Utility functions
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
    1: 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-400',
    2: 'bg-gradient-to-br from-gray-300 to-gray-500 border-gray-400',
    3: 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-400'
  };
  return classes[rank] || 'bg-gradient-to-br from-purple-500 to-purple-700 border-purple-500';
};

const getRankBadgeClass = (rank) => {
  const classes = {
    1: 'bg-yellow-500',
    2: 'bg-gray-400',
    3: 'bg-orange-500'
  };
  return classes[rank] || 'bg-purple-500';
};

const getRankColor = (rank) => {
  const colors = {
    1: '#fbbf24', // yellow
    2: '#9ca3af', // gray
    3: '#f97316'  // orange
  };
  return colors[rank] || '#a855f7'; // purple
};

// New color functions for better text contrast in top 3 champions
const getPlayerNameColor = (rank) => {
  const colors = {
    1: '#1a1a1a', // dark text on yellow background
    2: '#1a1a1a', // dark text on gray background
    3: '#ffffff'  // white text on orange background
  };
  return colors[rank] || '#ffffff';
};

const getStatValueColor = (rank) => {
  const colors = {
    1: '#92400e', // dark yellow/brown for main stat on yellow background
    2: '#374151', // dark gray for main stat on gray background
    3: '#1a1a1a'  // dark text for main stat on orange background
  };
  return colors[rank] || '#ffffff';
};

const getStatLabelColor = (rank) => {
  const colors = {
    1: '#451a03', // very dark brown for labels on yellow background
    2: '#1f2937', // very dark gray for labels on gray background
    3: '#7c2d12'  // dark orange for labels on orange background
  };
  return colors[rank] || '#a3a3a3';
};

// Initialize component
onMounted(() => {
  fetchLeaderboard();
});

// Watch for changes in sort parameters and refetch data
// But prevent initial double-fetch by using immediate: false
watch([selectedSort, selectedOrder], () => {
  fetchLeaderboard();
}, { immediate: false });
</script>

<style scoped>
/* Glass Effect for Leaderboard Container */
.leaderboard-glass-container {
  background: rgba(36, 36, 36, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(115, 76, 150, 0.15);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(115, 76, 150, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.text-shadow-sm {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* Hover effects for better interactivity */
.hover\:border-purple-500:hover {
  border-color: #734C96 !important;
}

/* Ensure proper text contrast on gradient backgrounds */
.bg-gradient-to-br {
  position: relative;
}

.bg-gradient-to-br::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  border-radius: inherit;
  pointer-events: none;
}

/* Responsive grid adjustments for two-row layout */
/* First row (ranks 4-6): 3 columns on large screens */
@media (max-width: 767px) {
  .grid-cols-1.md\:grid-cols-2.lg\:grid-cols-3 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .grid-cols-1.md\:grid-cols-2.lg\:grid-cols-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .grid-cols-1.md\:grid-cols-2.lg\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Second row (ranks 7-10): 4 columns on large screens */
@media (max-width: 639px) {
  .grid-cols-1.sm\:grid-cols-2.lg\:grid-cols-4 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

@media (min-width: 640px) and (max-width: 1023px) {
  .grid-cols-1.sm\:grid-cols-2.lg\:grid-cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .grid-cols-1.sm\:grid-cols-2.lg\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
