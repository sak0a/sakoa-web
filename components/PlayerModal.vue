<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-[9998]" @click="closeModal"></div>
    
    <!-- Modal -->
    <div class="fixed inset-0 flex items-center justify-center p-4 z-[9999]">
      <div class="relative w-full max-w-2xl rounded-xl shadow-2xl border" style="background-color: #1a1a1a; border-color: #333333;">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b" style="border-color: #333333;">
          <div>
            <h3 class="text-2xl font-bold" style="color: #ffffff;">Player Statistics</h3>
            <p class="text-sm mt-1" style="color: #a3a3a3;">{{ season?.displayName || 'Loading...' }}</p>
          </div>
          <button
            @click="closeModal"
            class="rounded-lg p-2 hover:bg-gray-700 transition-colors"
            style="color: #a3a3a3;"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- Loading State -->
          <div v-if="loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style="border-color: #734C96;"></div>
            <p style="color: #a3a3a3;">Loading player data...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-8">
            <div class="rounded-lg p-4 mb-4" style="background-color: #7f1d1d; border: 1px solid #dc2626;">
              <div class="flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h4 class="text-lg font-bold text-red-300 mb-2">Player Not Found</h4>
              <p class="text-red-200">{{ error }}</p>
            </div>
          </div>

          <!-- Player Data -->
          <div v-else-if="player" class="space-y-6">
            <!-- Player Header -->
            <div class="text-center p-6 rounded-lg" style="background-color: #242424;">
              <div class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style="background-color: #734C96;">
                <span class="text-2xl font-bold text-white">#{{ player.rank }}</span>
              </div>
              <h4 class="text-2xl font-bold mb-2" style="color: #ffffff;">{{ player.name }}</h4>
              <p class="text-sm" style="color: #a3a3a3;">SteamID: {{ player.steamid }}</p>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center p-4 rounded-lg" style="background-color: #242424;">
                <div class="text-2xl font-bold mb-1" style="color: #734C96;">{{ player.points?.toLocaleString() || '0' }}</div>
                <div class="text-sm" style="color: #a3a3a3;">Points</div>
              </div>
              <div class="text-center p-4 rounded-lg" style="background-color: #242424;">
                <div class="text-2xl font-bold mb-1" style="color: #734C96;">{{ player.kills?.toLocaleString() || '0' }}</div>
                <div class="text-sm" style="color: #a3a3a3;">Kills</div>
              </div>
              <div class="text-center p-4 rounded-lg" style="background-color: #242424;">
                <div class="text-2xl font-bold mb-1" style="color: #734C96;">{{ player.deaths?.toLocaleString() || '0' }}</div>
                <div class="text-sm" style="color: #a3a3a3;">Deaths</div>
              </div>
              <div class="text-center p-4 rounded-lg" style="background-color: #242424;">
                <div class="text-2xl font-bold mb-1" style="color: #734C96;">{{ player.kd_ratio || '0.00' }}</div>
                <div class="text-sm" style="color: #a3a3a3;">K/D Ratio</div>
              </div>
            </div>

            <!-- Additional Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-4 rounded-lg" style="background-color: #242424;">
                <div class="flex items-center justify-between">
                  <span style="color: #a3a3a3;">Playtime</span>
                  <span class="font-bold" style="color: #ffffff;">{{ player.playtimeHours }}h</span>
                </div>
              </div>
              <div class="p-4 rounded-lg" style="background-color: #242424;">
                <div class="flex items-center justify-between">
                  <span style="color: #a3a3a3;">Top Speed</span>
                  <span class="font-bold" style="color: #ffffff;">{{ player.topspeed?.toLocaleString() || '0' }} mph</span>
                </div>
              </div>
              <div class="p-4 rounded-lg" style="background-color: #242424;">
                <div class="flex items-center justify-between">
                  <span style="color: #a3a3a3;">Deflections</span>
                  <span class="font-bold" style="color: #ffffff;">{{ player.deflections?.toLocaleString() || '0' }}</span>
                </div>
              </div>
            </div>

            <!-- Login Information -->
            <div class="p-4 rounded-lg" style="background-color: #242424;">
              <h5 class="font-bold mb-3" style="color: #ffffff;">Login Information</h5>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span style="color: #a3a3a3;">First Login:</span>
                  <div class="font-medium" style="color: #ffffff;">{{ player.firstLoginDate }}</div>
                </div>
                <div>
                  <span style="color: #a3a3a3;">Last Login:</span>
                  <div class="font-medium" style="color: #ffffff;">{{ player.lastLoginDate }}</div>
                </div>
                <div>
                  <span style="color: #a3a3a3;">Last Logout:</span>
                  <div class="font-medium" style="color: #ffffff;">{{ player.lastLogoutDate }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end p-6 border-t" style="border-color: #333333;">
          <button
            @click="closeModal"
            class="px-6 py-2 rounded-lg font-medium transition-colors"
            style="background-color: #734C96; color: white;"
          >
            Close
          </button>
        </div>
      </div>
    </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  steamid: {
    type: String,
    default: null
  },
  season: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close']);

const loading = ref(false);
const error = ref(null);
const player = ref(null);

// Watch for changes in props to fetch player data
watch([() => props.isOpen, () => props.steamid, () => props.season], async () => {
  if (props.isOpen && props.steamid && props.season) {
    await fetchPlayerData();
  }
}, { immediate: true });

const fetchPlayerData = async () => {
  if (!props.steamid || !props.season) return;

  loading.value = true;
  error.value = null;
  player.value = null;

  try {
    // If the steamid is already in SteamID3 format (from clicking leaderboard names),
    // we need to convert it to SteamID64 for the API
    let searchSteamId = props.steamid;

    // Check if it's in SteamID3 format [U:1:XXXXXXXX]
    if (props.steamid.startsWith('[U:1:') && props.steamid.endsWith(']')) {
      // Extract the account ID and convert to SteamID64
      const match = props.steamid.match(/\[U:1:(\d+)\]/);
      if (match) {
        const accountID = parseInt(match[1]);
        searchSteamId = (BigInt(accountID) + BigInt('76561197960265728')).toString();
      }
    }

    const response = await fetch(`/api/player-search?steamid=${encodeURIComponent(searchSteamId)}&season=${props.season.seasonNumber}`);

    // Check if the response is ok (status 200-299)
    if (!response.ok) {
      // Handle HTTP error responses (400, 404, 500, etc.)
      const errorData = await response.json().catch(() => ({}));
      error.value = errorData.message || errorData.statusMessage || `HTTP ${response.status}: ${response.statusText}`;
      return;
    }

    const data = await response.json();

    if (data.success) {
      player.value = data.data.player;
    } else {
      error.value = data.error;
    }
  } catch (err) {
    console.error('Error fetching player data:', err);
    error.value = 'Failed to load player data';
  } finally {
    loading.value = false;
  }
};

const closeModal = () => {
  emit('close');
};
</script>

<style scoped>
/* Ensure modal is always on top and not clipped by parent containers */
.fixed {
  position: fixed !important;
  z-index: 9999 !important;
}

/* Prevent any parent container from clipping the modal */
.z-\[9999\] {
  z-index: 9999 !important;
  position: fixed !important;
}

.z-\[9998\] {
  z-index: 9998 !important;
  position: fixed !important;
}
</style>
