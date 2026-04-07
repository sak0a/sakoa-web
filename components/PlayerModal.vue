<template>
  <Teleport to="body">
    <!-- Modal Backdrop -->
    <Transition name="modal-backdrop">
      <div v-if="isOpen" class="modal-backdrop" @click="closeModal"></div>
    </Transition>

    <!-- Modal -->
    <Transition name="modal">
      <div v-if="isOpen" class="modal-container" @click.self="closeModal">
        <div class="modal-content">

          <!-- Loading State -->
          <Transition name="fade" mode="out-in">
            <div v-if="loading" class="state-container">
              <div class="loading-spinner">
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
              </div>
              <p class="state-text">Loading player data...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="state-container">
              <div class="error-icon">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h4 class="error-title">Player Not Found</h4>
              <p class="state-text">{{ error }}</p>
            </div>

            <!-- Player Data -->
            <div v-else-if="player" class="player-card">
              <!-- Close button -->
              <button @click="closeModal" class="close-btn">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <!-- Player Header -->
              <div class="player-header">
                <div class="header-left">
                  <div @click.stop>
                    <SteamAvatar
                      :steam-id="player.steamid"
                      size="64px"
                      avatar-size="full"
                      :clickable="true"
                      :show-status="false"
                      container-class="header-avatar"
                    />
                  </div>
                  <div class="header-info">
                    <div class="name-row">
                      <h3 class="player-name">{{ player.name }}</h3>
                      <span class="rank-badge">#{{ player.rank }}</span>
                    </div>
                    <p class="player-meta">{{ player.steamid }}</p>
                    <p class="player-season">{{ season?.displayName || '' }}</p>
                  </div>
                </div>
              </div>

              <!-- Primary Stats -->
              <div class="primary-stats">
                <div class="stat-item stat-highlight">
                  <span class="stat-val">{{ player.points?.toLocaleString() || '0' }}</span>
                  <span class="stat-lbl">Points</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                  <span class="stat-val">{{ player.kills?.toLocaleString() || '0' }}</span>
                  <span class="stat-lbl">Kills</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                  <span class="stat-val">{{ player.deaths?.toLocaleString() || '0' }}</span>
                  <span class="stat-lbl">Deaths</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                  <span class="stat-val">{{ player.kd_ratio || '0.00' }}</span>
                  <span class="stat-lbl">K/D</span>
                </div>
              </div>

              <!-- Secondary Stats -->
              <div class="secondary-stats">
                <div class="sec-stat">
                  <span class="sec-val">{{ player.playtimeHours }}h</span>
                  <span class="sec-lbl">Playtime</span>
                </div>
                <div class="sec-stat">
                  <span class="sec-val">{{ player.topspeed?.toLocaleString() || '0' }}</span>
                  <span class="sec-lbl">Top Speed</span>
                </div>
                <div class="sec-stat">
                  <span class="sec-val">{{ player.deflections?.toLocaleString() || '0' }}</span>
                  <span class="sec-lbl">Deflections</span>
                </div>
              </div>

              <!-- Activity Footer -->
              <div class="activity-row">
                <span>First seen: <strong>{{ player.firstLoginDate }}</strong></span>
                <span class="activity-sep"></span>
                <span>Last online: <strong>{{ player.lastLoginDate }}</strong></span>
                <span class="activity-sep"></span>
                <span>Last logout: <strong>{{ player.lastLogoutDate }}</strong></span>
              </div>
            </div>
          </Transition>

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
    const response = await fetch(`/api/player-search?steamid=${encodeURIComponent(props.steamid)}&season=${props.season.seasonNumber}`);

    if (!response.ok) {
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
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.modal-container {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 560px;
  min-height: 120px;
}

/* Loading & Error states */
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(115, 76, 150, 0.25);
  border-radius: 1rem;
}

.state-text {
  color: #a3a3a3;
  font-size: 0.875rem;
  margin: 0;
}

.loading-spinner {
  position: relative;
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
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
  width: 70%;
  height: 70%;
  top: 15%;
  left: 15%;
  animation-delay: 0.15s;
  border-top-color: #9B6BC7;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: rgba(220, 38, 38, 0.15);
  border-radius: 50%;
  color: #ef4444;
  margin-bottom: 0.75rem;
}

.error-title {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.25rem 0;
}

/* Player Card */
.player-card {
  position: relative;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(115, 76, 150, 0.25);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(115, 76, 150, 0.1);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.5rem;
  color: #a3a3a3;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

/* Header */
.player-header {
  padding: 1.25rem 1.5rem;
  padding-right: 3.5rem;
  background: linear-gradient(135deg, rgba(115, 76, 150, 0.15), rgba(35, 16, 77, 0.15));
  border-bottom: 1px solid rgba(115, 76, 150, 0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-avatar {
  border: 2px solid rgba(115, 76, 150, 0.4);
  border-radius: 50%;
  flex-shrink: 0;
}

.header-info {
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.player-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem 0.5rem;
  background: linear-gradient(135deg, #734C96, #9B6BC7);
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  flex-shrink: 0;
}

.player-meta {
  font-size: 0.75rem;
  color: #737373;
  margin: 0.125rem 0 0 0;
  font-family: 'JetBrains Mono', monospace;
}

.player-season {
  font-size: 0.75rem;
  color: #9B6BC7;
  margin: 0.125rem 0 0 0;
}

/* Primary Stats */
.primary-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 1.5rem;
  gap: 0;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-val {
  display: block;
  font-size: 1.375rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
}

.stat-highlight .stat-val {
  color: #9B6BC7;
}

.stat-lbl {
  display: block;
  font-size: 0.6875rem;
  color: #737373;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.125rem;
}

.stat-divider {
  width: 1px;
  height: 2.5rem;
  background: rgba(115, 76, 150, 0.2);
  flex-shrink: 0;
}

/* Secondary Stats */
.secondary-stats {
  display: flex;
  gap: 0.75rem;
  padding: 0 1.5rem;
  padding-bottom: 1rem;
}

.sec-stat {
  flex: 1;
  text-align: center;
  padding: 0.75rem 0.5rem;
  background: rgba(36, 36, 36, 0.6);
  border: 1px solid rgba(115, 76, 150, 0.12);
  border-radius: 0.5rem;
}

.sec-val {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: #d4d4d4;
  line-height: 1.2;
}

.sec-lbl {
  display: block;
  font-size: 0.6875rem;
  color: #737373;
  margin-top: 0.125rem;
}

/* Activity Footer */
.activity-row {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(115, 76, 150, 0.1);
  font-size: 0.75rem;
  color: #737373;
}

.activity-row strong {
  color: #a3a3a3;
  font-weight: 500;
}

.activity-sep {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(115, 76, 150, 0.3);
  flex-shrink: 0;
}

/* Transitions */
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: all 0.3s ease;
}

.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

.modal-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active {
  transition: all 0.25s ease;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(16px);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Responsive */
@media (max-width: 560px) {
  .modal-content {
    max-width: 100%;
  }

  .player-header {
    padding: 1rem 1.25rem;
    padding-right: 3rem;
  }

  .player-name {
    font-size: 1.125rem;
  }

  .primary-stats {
    padding: 1rem 1.25rem;
  }

  .stat-val {
    font-size: 1.125rem;
  }

  .secondary-stats {
    padding: 0 1.25rem;
    padding-bottom: 0.75rem;
    gap: 0.5rem;
  }

  .activity-row {
    padding: 0.625rem 1.25rem;
    gap: 0.375rem;
    font-size: 0.6875rem;
  }
}

@media (max-width: 400px) {
  .primary-stats {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .stat-item {
    flex: 0 0 calc(50% - 0.5rem);
  }

  .stat-divider {
    display: none;
  }

  .secondary-stats {
    flex-direction: column;
  }

  .activity-row {
    flex-direction: column;
    gap: 0.25rem;
  }

  .activity-sep {
    display: none;
  }
}
</style>
