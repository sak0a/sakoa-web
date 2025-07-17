<template>
  <div class="leaderboard-container">
    <!-- Enhanced Header with Glass Effect -->
    <div class="leaderboard-header">
      <div class="header-content">
        <div class="header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 class="leaderboard-title">Player Leaderboard</h3>

        </div>
      </div>
      <div class="controls-section">
        <div class="controls-left">
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

        <!-- Sort Controls in Header -->
        <div class="controls-right">
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
      </div>
    </div>
      <!-- Enhanced Controls Section -->
    <!-- Enhanced Player Search Section -->
    <div class="search-section">
      <PlayerSearch
          v-if="selectedSeason"
          :selectedSeason="selectedSeason"
          @playerFound="onPlayerFound"
      />


      <!-- Enhanced Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <p class="loading-text">Loading leaderboard...</p>
      </div>

      <!-- Leaderboard Content -->
      <div v-else-if="!loading && players.length > 0">
        <!-- Enhanced Top 3 Players (Podium Style) -->
        <div v-if="topThree.length > 0">
          <div class="section-header">
            <h4 class="section-title">🏆 Top 3 Champions</h4>
          </div>
          <div class="podium-grid">
            <div
                v-for="player in topThree"
                :key="player.steamid"
                class="podium-card"
                :class="getPodiumClass(player.rank)"
            >
              <!-- Enhanced Rank Badge -->
              <div class="podium-rank-badge">
                <div class="rank-badge-inner" :class="getRankBadgeClass(player.rank)">
                  <span class="rank-number">{{ player.rank }}</span>
                </div>
              </div>

              <!-- Enhanced Player Info -->
              <div class="podium-player-info">
                <!-- Steam Avatar -->
                <div class="podium-avatar-container">
                  <SteamAvatar
                    :steam-id="player.steamid"
                    size="120px"
                    avatar-size="full"
                    :clickable="true"
                    :show-status="false"
                    container-class="podium-avatar"
                  />
                </div>

                <h5
                    class="podium-player-name"
                    :style="{ color: getPlayerNameColor(player.rank) }"
                    @click="openPlayerModal(player.steamid)"
                    :title="`Click to view ${player.name}'s detailed stats`"
                >
                  {{ player.name }}
                </h5>
                <div class="podium-stat-value" :style="{ color: getStatValueColor(player.rank) }">
                  {{ formatStatValue(player[selectedSort], selectedSort) }}
                </div>
                <p class="podium-stat-label" :style="{ color: getStatLabelColor(player.rank) }">{{ getStatLabel(selectedSort) }}</p>

                <!-- Enhanced Additional Stats -->
                <div class="podium-additional-stats">
                  <div class="podium-stat-item">
                    <span class="stat-label" :style="{ color: getStatLabelColor(player.rank) }">K/D:</span>
                    <span class="stat-value" :style="{ color: getStatValueColor(player.rank) }">{{ player.kd_ratio }}</span>
                  </div>
                  <div class="podium-stat-item">
                    <span class="stat-label" :style="{ color: getStatLabelColor(player.rank) }">Hours:</span>
                    <span class="stat-value" :style="{ color: getStatValueColor(player.rank) }">{{ player.playtimeHours }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Positions 4-10 (Custom Two-Row Layout) -->
        <div v-if="standardList.length > 0">
          <div class="section-header">
            <h4 class="section-title">🥇 Top Performers</h4>
          </div>

          <!-- First Row: Ranks 4-6 (3 columns) -->
          <div v-if="standardList.slice(0, 3).length > 0" class="standard-grid-first">
            <div
                v-for="player in standardList.slice(0, 3)"
                :key="player.steamid"
                class="standard-card"
            >
              <!-- Enhanced Rank Badge - Top Left Corner -->
              <div class="standard-rank-badge-corner">
                <span class="rank-number">{{ player.rank }}</span>
              </div>

              <!-- Steam Avatar - Larger Size -->
              <div class="standard-avatar-container">
                <SteamAvatar
                  :steam-id="player.steamid"
                  size="60px"
                  avatar-size="medium"
                  :clickable="true"
                  :show-status="false"
                  container-class="standard-avatar"
                />
              </div>

              <!-- Enhanced Player Info -->
              <div class="standard-player-info">
                <h5
                    class="standard-player-name"
                    :title="`Click to view ${player.name}'s detailed stats`"
                    @click="openPlayerModal(player.steamid)"
                >
                  {{ player.name }}
                </h5>
                <div class="standard-stats">
                  <div class="standard-stat-row">
                    <span class="stat-label">{{ getStatLabel(selectedSort) }}:</span>
                    <span class="stat-value-primary">{{ formatStatValue(player[selectedSort], selectedSort) }}</span>
                  </div>
                  <div class="standard-stat-row">
                    <span class="stat-label">K/D:</span>
                    <span class="stat-value">{{ player.kd_ratio }}</span>
                  </div>
                  <div class="standard-stat-row">
                    <span class="stat-label">Hours:</span>
                    <span class="stat-value">{{ player.playtimeHours }}h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Second Row: Ranks 7-10 (4 columns) -->
          <div v-if="standardList.slice(3, 7).length > 0" class="standard-grid-second">
            <div
                v-for="player in standardList.slice(3, 7)"
                :key="player.steamid"
                class="standard-card"
            >
              <!-- Enhanced Rank Badge - Top Left Corner -->
              <div class="standard-rank-badge-corner">
                <span class="rank-number">{{ player.rank }}</span>
              </div>

              <!-- Steam Avatar - Larger Size -->
              <div class="standard-avatar-container">
                <SteamAvatar
                  :steam-id="player.steamid"
                  size="60px"
                  avatar-size="medium"
                  :clickable="true"
                  :show-status="false"
                  container-class="standard-avatar"
                />
              </div>

              <!-- Enhanced Player Info -->
              <div class="standard-player-info">
                <h5
                    class="standard-player-name"
                    :title="`Click to view ${player.name}'s detailed stats`"
                    @click="openPlayerModal(player.steamid)"
                >
                  {{ player.name }}
                </h5>
                <div class="standard-stats">
                  <div class="standard-stat-row">
                    <span class="stat-label">{{ getStatLabel(selectedSort) }}:</span>
                    <span class="stat-value-primary">{{ formatStatValue(player[selectedSort], selectedSort) }}</span>
                  </div>
                  <div class="standard-stat-row">
                    <span class="stat-label">K/D:</span>
                    <span class="stat-value">{{ player.kd_ratio }}</span>
                  </div>
                  <div class="standard-stat-row">
                    <span class="stat-label">Hours:</span>
                    <span class="stat-value">{{ player.playtimeHours }}h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Positions 11-50 (Scrollable) -->
        <div v-if="scrollableList.length > 0">
          <div class="section-header">
            <h4 class="section-title">📊 All Players</h4>
          </div>
          <div class="scrollable-table-container">
            <table class="scrollable-table">
              <thead class="table-header">
              <tr>
                <th class="table-header-cell">Rank</th>
                <th class="table-header-cell">Player</th>
                <th class="table-header-cell">{{ getStatLabel(selectedSort) }}</th>
                <th class="table-header-cell">K/D</th>
                <th class="table-header-cell">Hours</th>
              </tr>
              </thead>
              <tbody class="table-body">
              <tr
                  v-for="player in scrollableList"
                  :key="player.steamid"
                  class="table-row"
              >
                <td class="table-cell table-cell-rank">{{ player.rank }}</td>
                <td class="table-cell table-cell-player"
                    @click="openPlayerModal(player.steamid)"
                    :title="`Click to view ${player.name}'s detailed stats`"
                >
                  {{ player.name }}
                </td>
                <td class="table-cell">{{ formatStatValue(player[selectedSort], selectedSort) }}</td>
                <td class="table-cell">{{ player.kd_ratio }}</td>
                <td class="table-cell">{{ player.playtimeHours }}</td>
              </tr>
              </tbody>
            </table>
          </div>
          <div class="flex justify-center pt-8">
            <p class="footer-text">
              Showing {{ players.length }} players • Last updated: {{ new Date().toLocaleDateString() }}
            </p>
            <p v-if="error" class="footer-error">
              ⚠️ Using cached data due to database connection issues
            </p>
          </div>
        </div>
      </div>

      <!-- Enhanced Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p class="empty-text">No player data available for this season</p>
      </div>

      <!-- Player Modal -->
      <PlayerModal
          :isOpen="showPlayerModal"
          :steamid="selectedPlayerSteamId"
          :season="selectedSeason"
          @close="closePlayerModal"
      />
    </div>
  </div>


</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import PlayerSearch from './PlayerSearch.vue';
import PlayerModal from './PlayerModal.vue';
import CustomSelect from './CustomSelect.vue';
import SteamAvatar from './SteamAvatar.vue';

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

<style scoped>
/* Enhanced Leaderboard Container with Glass Effect */
.leaderboard-container {
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.8),
    0 0 0 1px rgba(115, 76, 150, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Enhanced Header */
.leaderboard-header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
  background: linear-gradient(135deg, rgba(115, 76, 150, 0.2), rgba(35, 16, 77, 0.2));

}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, #734C96, #9B6BC7);
  border-radius: 0.75rem;
  color: white;
  box-shadow: 0 4px 12px rgba(115, 76, 150, 0.4);
}

.leaderboard-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}


/* Enhanced Controls Section */
.controls-section {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  position: relative;
  z-index: 100;
}

.controls-left {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  z-index: 100;
}

.controls-right {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  z-index: 90;
}

/* Enhanced Search Section */
.search-section {
  padding: 2rem;
  background: rgba(36, 36, 36, 0.6);
  border-bottom-left-radius: 0.75rem;
  border-bottom-right-radius: 0.75rem;
  backdrop-filter: blur(8px);
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 50;
}

/* Remove old sort controls styles since they're now in header */

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
}

.loading-spinner {
  position: relative;
  width: 4rem;
  height: 4rem;
  margin-bottom: 1.5rem;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid #734C96;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-ring:nth-child(2) {
  animation-delay: 0.1s;
  border-top-color: #9B6BC7;
}

.spinner-ring:nth-child(3) {
  animation-delay: 0.2s;
  border-top-color: #23104D;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #a3a3a3;
  font-size: 1rem;
}

/* Section Headers */
.section-header {
  margin-bottom: 1.5rem;
  margin-top: 2rem;
}

.section-header:first-child {
  margin-top: 0;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title::before {
  content: '';
  width: 3px;
  height: 1.25rem;
  background: linear-gradient(135deg, #734C96, #9B6BC7);
  border-radius: 2px;
}

/* Enhanced Podium Section */

.podium-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.podium-card {
  position: relative;
  padding: 3rem 1.5rem 1.5rem;
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  overflow: visible;
  border: 1px solid rgba(115, 76, 150, 0.2);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(115, 76, 150, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* Animated glow effect for each rank */
.podium-card::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 1rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
  animation: pulse-glow 3s ease-in-out infinite;
}

/* Gold glow animation */
.podium-card.bg-gradient-to-br.from-yellow-400::before {
  background: linear-gradient(45deg,
    rgba(251, 191, 36, 0.6),
    rgba(245, 158, 11, 0.6),
    rgba(251, 191, 36, 0.6),
    rgba(245, 158, 11, 0.6)
  );
  background-size: 400% 400%;
  animation: pulse-glow 3s ease-in-out infinite, shimmer-gold 4s ease-in-out infinite;
}

/* Silver glow animation */
.podium-card.bg-gradient-to-br.from-gray-300::before {
  background: linear-gradient(45deg,
    rgba(209, 213, 219, 0.6),
    rgba(156, 163, 175, 0.6),
    rgba(209, 213, 219, 0.6),
    rgba(156, 163, 175, 0.6)
  );
  background-size: 400% 400%;
  animation: pulse-glow 3s ease-in-out infinite 0.5s, shimmer-silver 4s ease-in-out infinite 0.5s;
}

/* Bronze glow animation */
.podium-card.bg-gradient-to-br.from-orange-400::before {
  background: linear-gradient(45deg,
    rgba(251, 146, 60, 0.6),
    rgba(234, 88, 12, 0.6),
    rgba(251, 146, 60, 0.6),
    rgba(234, 88, 12, 0.6)
  );
  background-size: 400% 400%;
  animation: pulse-glow 3s ease-in-out infinite 1s, shimmer-bronze 4s ease-in-out infinite 1s;
}

/* Gold (Rank 1) hover effect */
.podium-card.bg-gradient-to-br.from-yellow-400:hover {
  transform: translateY(-4px);
  box-shadow:
    0 16px 40px rgba(251, 191, 36, 0.4),
    0 0 0 1px rgba(251, 191, 36, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border-color: rgba(251, 191, 36, 0.4);
}

/* Silver (Rank 2) hover effect */
.podium-card.bg-gradient-to-br.from-gray-300:hover {
  transform: translateY(-4px);
  box-shadow:
    0 16px 40px rgba(209, 213, 219, 0.4),
    0 0 0 1px rgba(209, 213, 219, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border-color: rgba(209, 213, 219, 0.4);
}

/* Bronze (Rank 3) hover effect */
.podium-card.bg-gradient-to-br.from-orange-400:hover {
  transform: translateY(-4px);
  box-shadow:
    0 16px 40px rgba(251, 146, 60, 0.4),
    0 0 0 1px rgba(251, 146, 60, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border-color: rgba(251, 146, 60, 0.4);
}

/* Fallback hover effect for other ranks */
.podium-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 16px 40px rgba(115, 76, 150, 0.4),
    0 0 0 1px rgba(115, 76, 150, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border-color: rgba(115, 76, 150, 0.4);
}

.podium-card:hover::before {
  opacity: 1;
}

.podium-rank-badge {
  position: absolute;
  top: -0.75rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.rank-badge-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  position: relative;
}

.rank-badge-inner::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  z-index: -1;
  opacity: 0.5;
  animation: pulse-ring 2s infinite;
}

.rank-number {
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
}

.podium-player-info {
  text-align: center;
  margin-top: 0.5rem;
}

.podium-avatar-container {
  display: flex;
  justify-content: center;
  margin-bottom: 0.375rem;
}

.podium-player-name {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.125rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.podium-player-name:hover {
  text-decoration: underline;
  transform: scale(1.02);
}

.podium-stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.0625rem;
}

.podium-stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.podium-additional-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 1rem;
}

.podium-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(115, 76, 150, 0.1);
  border-radius: 0.375rem;
  backdrop-filter: blur(5px);
  font-size: 0.75rem;
}

.stat-label {
  color: #a3a3a3;
  font-weight: 500;
}

.stat-value {
  font-weight: 600;
}

/* Enhanced Standard Section (Positions 4-10) */

.standard-grid-first {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.standard-grid-second {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 3rem;
}

.standard-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.75rem 1.25rem 1.25rem;
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(115, 76, 150, 0.2);
  border-radius: 0.75rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
  min-height: 120px;
}

.standard-avatar-container {
  flex-shrink: 0;
}

.standard-avatar {
  border: 2px solid rgba(115, 76, 150, 0.3);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.standard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(115, 76, 150, 0.3);
  border-color: rgba(115, 76, 150, 0.4);
}

.standard-rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, #734C96, #9B6BC7);
  border-radius: 50%;
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  box-shadow: 0 4px 12px rgba(115, 76, 150, 0.4);
  flex-shrink: 0;
}

.standard-rank-badge-corner {
  position: absolute;
  top: -0.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  background: linear-gradient(135deg, #734C96, #9B6BC7);
  border-radius: 50%;
  color: white;
  font-weight: 700;
  font-size: 0.75rem;
  box-shadow: 0 4px 12px rgba(115, 76, 150, 0.4);
  z-index: 10;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.standard-player-info {
  flex: 1;
  min-width: 0;
}

.standard-player-name {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.standard-player-name:hover {
  text-decoration: underline;
  color: #9B6BC7;
}

.standard-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.standard-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.stat-value-primary {
  font-weight: 700;
  color: #734C96;
}

/* Enhanced Scrollable Section */

.scrollable-table-container {
  max-height: 24rem;
  overflow-y: auto;
  border: 1px solid rgba(115, 76, 150, 0.2);
  border-radius: 0.75rem;
  backdrop-filter: blur(10px);
  background: rgba(26, 26, 26, 0.6);
}

.scrollable-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(36, 36, 36, 0.95));
  backdrop-filter: blur(10px);
  z-index: 10;
}

.table-header-cell {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #a3a3a3;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(115, 76, 150, 0.2);
}

.table-body {
  background: rgba(36, 36, 36, 0.8);
}

.table-row {
  border-bottom: 1px solid rgba(115, 76, 150, 0.1);
  transition: all 0.3s ease;
}

.table-row:hover {
  background: rgba(115, 76, 150, 0.1);
  backdrop-filter: blur(5px);
}

.table-cell {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #d4d4d4;
}

.table-cell-rank {
  font-weight: 600;
  color: #734C96;
}

.table-cell-player {
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.table-cell-player:hover {
  text-decoration: underline;
  color: #9B6BC7;
}

/* Enhanced Footer */
.footer-info {
  text-align: center;
  padding: 1.5rem;
  background: rgba(36, 36, 36, 0.3);
  border: 1px solid rgba(115, 76, 150, 0.1);
  border-radius: 0.75rem;
  backdrop-filter: blur(8px);
  margin-top: 1.5rem;
}

.footer-text {
  font-size: 0.875rem;
  color: #a3a3a3;
  margin: 0;
}

.footer-error {
  font-size: 0.75rem;
  color: #ef4444;
  margin: 0.5rem 0 0 0;
}

/* Enhanced Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, rgba(115, 76, 150, 0.2), rgba(155, 107, 199, 0.2));
  border: 1px solid rgba(115, 76, 150, 0.3);
  border-radius: 50%;
  color: #9B6BC7;
  margin-bottom: 1.5rem;
}

.empty-text {
  color: #a3a3a3;
  font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .leaderboard-header {
    padding: 1.25rem;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .controls-section {
    flex-direction: column;
    gap: 1rem;
  }

  .controls-left,
  .controls-right {
    width: 100%;
    justify-content: center;
  }

  .search-section {
    padding: 1.5rem;
  }

  .podium-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .podium-card {
    padding: 1.5rem 1.25rem 1.25rem;
  }

  .standard-grid-first {
    grid-template-columns: 1fr;
  }

  .standard-grid-second {
    grid-template-columns: repeat(2, 1fr);
  }

  .standard-card {
    padding: 1.25rem 1rem 1rem;
  }

  .scrollable-table-container {
    max-height: 20rem;
  }

  .table-header-cell,
  .table-cell {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }

  .footer-info {
    padding: 1.25rem;
  }
}

/* Tablet responsive design */
@media (max-width: 1024px) and (min-width: 769px) {
  .standard-grid-first {
    grid-template-columns: repeat(3, 1fr);
  }

  .standard-grid-second {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .leaderboard-header {
    padding: 1rem;
  }

  .leaderboard-title {
    font-size: 1.25rem;
  }

  .controls-section {
    gap: 0.75rem;
  }

  .controls-left,
  .controls-right {
    gap: 0.75rem;
  }

  .search-section {
    padding: 1.25rem;
  }

  .podium-card {
    padding: 1.25rem 1rem 1rem;
  }

  .podium-stat-value {
    font-size: 1.5rem;
  }

  .standard-grid-first,
  .standard-grid-second {
    grid-template-columns: 1fr;
  }

  .standard-card {
    padding: 1rem 0.75rem 0.75rem;
    gap: 0.75rem;
    min-height: 100px;
  }

  .standard-rank-badge {
    width: 2rem;
    height: 2rem;
    font-size: 0.75rem;
  }

  .standard-rank-badge-corner {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 0.625rem;
    top: -0.375rem;
    left: 50%;
    transform: translateX(-50%);
  }

  .standard-player-name {
    font-size: 0.875rem;
  }

  .scrollable-table-container {
    max-height: 16rem;
  }

  .table-header-cell,
  .table-cell {
    padding: 0.375rem 0.5rem;
    font-size: 0.6875rem;
  }

  .section-title {
    font-size: 1rem;
  }
}

/* Scrollbar Styling */
.scrollable-table-container::-webkit-scrollbar {
  width: 6px;
}

.scrollable-table-container::-webkit-scrollbar-track {
  background: rgba(115, 76, 150, 0.1);
  border-radius: 3px;
}

.scrollable-table-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #734C96, #9B6BC7);
  border-radius: 3px;
}

.scrollable-table-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #9B6BC7, #734C96);
}

/* Animation for pulse ring effect */
@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.3; }
  100% { transform: scale(1); opacity: 0.5; }
}

/* Glow pulse animation for podium cards */
@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.02);
  }
}

/* Shimmer animations for each rank */
@keyframes shimmer-gold {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes shimmer-silver {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes shimmer-bronze {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>
