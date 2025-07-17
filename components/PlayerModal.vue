<template>
  <Teleport to="body">
    <!-- Modal Backdrop with Enhanced Glass Effect -->
    <Transition name="modal-backdrop">
      <div v-if="isOpen" class="modal-backdrop" @click="closeModal"></div>
    </Transition>

    <!-- Modal Container -->
    <Transition name="modal">
      <div v-if="isOpen" class="modal-container">
        <div class="modal-content">
          <!-- Enhanced Header with Glass Effect -->
          <div class="modal-header">
            <div class="header-content">
              <div class="header-icon">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 class="modal-title">Player Statistics</h3>
                <p class="modal-subtitle">{{ season?.displayName || 'Loading...' }}</p>
              </div>
            </div>
            <button @click="closeModal" class="close-button">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Enhanced Content Area -->
          <div class="modal-body">
            <!-- Loading State with Animation -->
            <Transition name="fade" mode="out-in">
              <div v-if="loading" class="loading-state">
                <div class="loading-spinner">
                  <div class="spinner-ring"></div>
                  <div class="spinner-ring"></div>
                  <div class="spinner-ring"></div>
                </div>
                <p class="loading-text">Loading player data...</p>
              </div>

              <!-- Error State with Enhanced Design -->
              <div v-else-if="error" class="error-state">
                <div class="error-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h4 class="error-title">Player Not Found</h4>
                <p class="error-message">{{ error }}</p>
              </div>

              <!-- Enhanced Player Data -->
              <div v-else-if="player" class="player-data">
                <!-- Player Header with Glass Effect -->
                <div class="player-header">
                  <div class="rank-badge">
                    <span class="rank-number">#{{ player.rank }}</span>
                  </div>

                  <!-- Player Avatar -->
                  <div class="player-avatar-container">
                    <SteamAvatar
                      :steam-id="player.steamid"
                      size="80px"
                      avatar-size="full"
                      :clickable="true"
                      :show-status="false"
                      container-class="modal-avatar"
                    />
                  </div>

                  <h4 class="player-name">{{ player.name }}</h4>
                  <p class="player-steamid">SteamID: {{ player.steamid }}</p>
                </div>

                <!-- Enhanced Stats Grid -->
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div class="stat-value">{{ player.points?.toLocaleString() || '0' }}</div>
                    <div class="stat-label">Points</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div class="stat-value">{{ player.kills?.toLocaleString() || '0' }}</div>
                    <div class="stat-label">Kills</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div class="stat-value">{{ player.deaths?.toLocaleString() || '0' }}</div>
                    <div class="stat-label">Deaths</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div class="stat-value">{{ player.kd_ratio || '0.00' }}</div>
                    <div class="stat-label">K/D Ratio</div>
                  </div>
                </div>

                <!-- Additional Stats with Glass Cards -->
                <div class="additional-stats">
                  <div class="additional-stat-card">
                    <div class="additional-stat-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div class="additional-stat-content">
                      <span class="additional-stat-label">Playtime</span>
                      <span class="additional-stat-value">{{ player.playtimeHours }}h</span>
                    </div>
                  </div>
                  <div class="additional-stat-card">
                    <div class="additional-stat-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div class="additional-stat-content">
                      <span class="additional-stat-label">Top Speed</span>
                      <span class="additional-stat-value">{{ player.topspeed?.toLocaleString() || '0' }} mph</span>
                    </div>
                  </div>
                  <div class="additional-stat-card">
                    <div class="additional-stat-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div class="additional-stat-content">
                      <span class="additional-stat-label">Deflections</span>
                      <span class="additional-stat-value">{{ player.deflections?.toLocaleString() || '0' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Login Information with Glass Effect -->
                <div class="login-info">
                  <h5 class="login-info-title">Login Information</h5>
                  <div class="login-info-grid">
                    <div class="login-info-item">
                      <div class="login-info-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div>
                        <span class="login-info-label">First Login:</span>
                        <div class="login-info-value">{{ player.firstLoginDate }}</div>
                      </div>
                    </div>
                    <div class="login-info-item">
                      <div class="login-info-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div>
                        <span class="login-info-label">Last Login:</span>
                        <div class="login-info-value">{{ player.lastLoginDate }}</div>
                      </div>
                    </div>
                    <div class="login-info-item">
                      <div class="login-info-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div>
                        <span class="login-info-label">Last Logout:</span>
                        <div class="login-info-value">{{ player.lastLogoutDate }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>


        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import SteamAvatar from './SteamAvatar.vue';

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
    // The API now expects Steam3 format, so we can pass the steamid directly
    const response = await fetch(`/api/player-search?steamid=${encodeURIComponent(props.steamid)}&season=${props.season.seasonNumber}`);

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
/* Modal Backdrop with Enhanced Glass Effect */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Modal Container */
.modal-container {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}

/* Enhanced Modal Content with Glass Effect */
.modal-content {
  position: relative;
  width: 100%;
  max-width: 56rem;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(115, 76, 150, 0.3);
  border-radius: 1rem;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.8),
    0 0 0 1px rgba(115, 76, 150, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

/* Enhanced Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, rgba(115, 76, 150, 0.2), rgba(35, 16, 77, 0.2));
  border-bottom: 1px solid rgba(115, 76, 150, 0.2);
  backdrop-filter: blur(10px);
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

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: #a3a3a3;
  margin: 0.25rem 0 0 0;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: #a3a3a3;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  transform: scale(1.05);
}

/* Enhanced Modal Body */
.modal-body {
  padding: 1.5rem;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
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

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  text-align: center;
}

.error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #dc2626, #ef4444);
  border-radius: 50%;
  color: white;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
}

.error-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.error-message {
  color: #a3a3a3;
  font-size: 0.875rem;
}

/* Player Data */
.player-data {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Enhanced Player Header */
.player-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(115, 76, 150, 0.1), rgba(35, 16, 77, 0.1));
  border: 1px solid rgba(115, 76, 150, 0.2);
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 25px rgba(115, 76, 150, 0.2);
}

.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #734C96, #9B6BC7);
  border-radius: 50%;
  margin-bottom: 0.75rem;
  box-shadow: 0 6px 20px rgba(115, 76, 150, 0.4);
  position: relative;
}

.rank-badge::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, #734C96, #9B6BC7, #734C96);
  border-radius: 50%;
  z-index: -1;
  opacity: 0.5;
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.3; }
  100% { transform: scale(1); opacity: 0.5; }
}

.rank-number {
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
}

/* Player Avatar Styles */
.player-avatar-container {
  display: flex;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.modal-avatar {
  border: 3px solid rgba(115, 76, 150, 0.4);
  border-radius: 50%;
  box-shadow: 0 8px 25px rgba(115, 76, 150, 0.3);
  transition: all 0.3s ease;
}

.modal-avatar:hover {
  border-color: rgba(115, 76, 150, 0.6);
  transform: scale(1.05);
  box-shadow: 0 12px 30px rgba(115, 76, 150, 0.4);
}

.player-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
}

.player-steamid {
  font-size: 0.875rem;
  color: #a3a3a3;
}

/* Enhanced Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.25rem;
  background: rgba(36, 36, 36, 0.8);
  border: 1px solid rgba(115, 76, 150, 0.2);
  border-radius: 0.75rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(115, 76, 150, 0.3);
  border-color: rgba(115, 76, 150, 0.4);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, rgba(115, 76, 150, 0.2), rgba(155, 107, 199, 0.2));
  border: 1px solid rgba(115, 76, 150, 0.3);
  border-radius: 0.75rem;
  color: #9B6BC7;
  margin-bottom: 0.75rem;
  backdrop-filter: blur(5px);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #734C96;
  margin-bottom: 0.375rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #a3a3a3;
  font-weight: 500;
}

/* Additional Stats */
.additional-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.additional-stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(36, 36, 36, 0.6);
  border: 1px solid rgba(115, 76, 150, 0.15);
  border-radius: 0.75rem;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}

.additional-stat-card:hover {
  background: rgba(36, 36, 36, 0.8);
  border-color: rgba(115, 76, 150, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(115, 76, 150, 0.2);
}

.additional-stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, rgba(115, 76, 150, 0.15), rgba(155, 107, 199, 0.15));
  border: 1px solid rgba(115, 76, 150, 0.25);
  border-radius: 0.5rem;
  color: #9B6BC7;
  flex-shrink: 0;
}

.additional-stat-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.additional-stat-label {
  font-size: 0.875rem;
  color: #a3a3a3;
  margin-bottom: 0.25rem;
}

.additional-stat-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
}

/* Login Information */
.login-info {
  padding: 1.25rem;
  background: rgba(36, 36, 36, 0.6);
  border: 1px solid rgba(115, 76, 150, 0.15);
  border-radius: 0.75rem;
  backdrop-filter: blur(8px);
}

.login-info-title {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.login-info-title::before {
  content: '';
  width: 3px;
  height: 1.25rem;
  background: linear-gradient(135deg, #734C96, #9B6BC7);
  border-radius: 2px;
}

.login-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.login-info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(115, 76, 150, 0.1);
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.login-info-item:hover {
  background: rgba(26, 26, 26, 0.8);
  border-color: rgba(115, 76, 150, 0.2);
}

.login-info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: linear-gradient(135deg, rgba(115, 76, 150, 0.1), rgba(155, 107, 199, 0.1));
  border: 1px solid rgba(115, 76, 150, 0.2);
  border-radius: 0.375rem;
  color: #9B6BC7;
  flex-shrink: 0;
}

.login-info-label {
  font-size: 0.75rem;
  color: #a3a3a3;
  display: block;
  margin-bottom: 0.125rem;
}

.login-info-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
}



/* Modal Animations */
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: all 0.3s ease;
}

.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

.modal-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

/* Fade Transition for Content */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-container {
    padding: 0.5rem;
  }

  .modal-content {
    max-width: 100%;
    margin: 0;
  }

  .modal-header {
    padding: 1rem 1.25rem;
  }

  .modal-body {
    padding: 1.25rem;
  }

  .player-header {
    padding: 0.875rem;
  }

  .player-avatar-container {
    margin-bottom: 0.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .additional-stats {
    grid-template-columns: 1fr;
  }

  .login-info-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-value {
    font-size: 1.375rem;
  }

  .player-name {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .rank-badge {
    width: 3rem;
    height: 3rem;
  }

  .rank-number {
    font-size: 1.25rem;
  }

  .modal-title {
    font-size: 1.25rem;
  }
}
</style>
