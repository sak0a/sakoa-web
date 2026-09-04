<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        ref="dialogLayer"
        class="modal-layer"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="player ? 'player-dialog-title' : 'player-dialog-state'"
        @click.self="closeModal"
      >
        <section class="player-panel">
          <button ref="closeButton" type="button" class="close-button" aria-label="Close player details" @click="closeModal">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>

          <div v-if="loading" class="modal-state" role="status">
            <span class="loading-line" aria-hidden="true" />
            <p id="player-dialog-state">Loading player statistics…</p>
          </div>

          <div v-else-if="error" class="modal-state modal-state--error" role="alert">
            <span class="state-code">ERR</span>
            <h3 id="player-dialog-state">Player unavailable</h3>
            <p>{{ error }}</p>
          </div>

          <div v-else-if="player" class="player-data">
            <header class="player-header">
              <SteamAvatar
                :steam-id="player.steamid"
                size="72px"
                avatar-size="full"
                :clickable="true"
                :show-status="false"
              />
              <div>
                <p>{{ season?.displayName || 'Season statistics' }}</p>
                <h3 id="player-dialog-title">{{ player.name }}</h3>
                <span>{{ player.steamid }}</span>
              </div>
              <strong>#{{ player.rank }}</strong>
            </header>

            <dl class="primary-stats">
              <div class="is-primary"><dt>Points</dt><dd>{{ number(player.points) }}</dd></div>
              <div><dt>Kills</dt><dd>{{ number(player.kills) }}</dd></div>
              <div><dt>Deaths</dt><dd>{{ number(player.deaths) }}</dd></div>
              <div><dt>K/D</dt><dd>{{ player.kd_ratio || '0.00' }}</dd></div>
            </dl>

            <dl class="secondary-stats">
              <div><dt>Playtime</dt><dd>{{ player.playtimeHours }}h</dd></div>
              <div><dt>Top speed</dt><dd>{{ number(player.topspeed) }}</dd></div>
              <div><dt>Deflections</dt><dd>{{ number(player.deflections) }}</dd></div>
            </dl>

            <footer class="activity-log">
              <div><span>First seen</span><strong>{{ player.firstLoginDate || 'Unknown' }}</strong></div>
              <div><span>Last online</span><strong>{{ player.lastLoginDate || 'Unknown' }}</strong></div>
              <div><span>Last logout</span><strong>{{ player.lastLogoutDate || 'Unknown' }}</strong></div>
            </footer>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { nextTick, onUnmounted, ref, watch } from 'vue'
import SteamAvatar from './SteamAvatar.vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  steamid: { type: String, default: null },
  season: { type: Object, default: null },
})
const emit = defineEmits(['close'])
const loading = ref(false)
const error = ref(null)
const player = ref(null)
const dialogLayer = ref(null)
const closeButton = ref(null)
let previouslyFocused

const number = value => (Number(value) || 0).toLocaleString('en-GB')
const closeModal = () => emit('close')

const fetchPlayerData = async () => {
  if (!props.steamid || !props.season) return
  loading.value = true
  error.value = null
  player.value = null
  try {
    const response = await fetch(`/api/player-search?steamid=${encodeURIComponent(props.steamid)}&season=${props.season.seasonNumber}`)
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      error.value = data?.error?.message || data.message || data.statusMessage || `Player request failed (${response.status})`
      return
    }
    if (data.success && data.data.player) player.value = data.data.player
    else error.value = data?.error?.message || data.error || 'Player data is unavailable.'
  } catch {
    error.value = 'Player data is temporarily unavailable.'
  } finally {
    loading.value = false
  }
}

const onKeydown = (event) => {
  if (event.key === 'Escape') {
    closeModal()
    return
  }
  if (event.key !== 'Tab' || !dialogLayer.value) return
  const focusable = [...dialogLayer.value.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}

watch([() => props.isOpen, () => props.steamid, () => props.season], async () => {
  if (!import.meta.client) return
  if (props.isOpen) {
    previouslyFocused = document.activeElement
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeydown)
    await nextTick()
    closeButton.value?.focus()
    await fetchPlayerData()
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKeydown)
    previouslyFocused?.focus?.()
  }
}, { immediate: true })

onUnmounted(() => {
  if (!import.meta.client) return
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.modal-layer { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; overflow-y: auto; padding: 1rem; background: rgba(5,4,7,.86); }
.player-panel { position: relative; width: min(100%, 42rem); background: #111016; border: 1px solid var(--arena-line-strong); box-shadow: 1.5rem 1.5rem 0 rgba(142,111,200,.08); }
.close-button { position: absolute; top: .9rem; right: .9rem; z-index: 2; display: grid; width: 2.4rem; height: 2.4rem; place-items: center; color: var(--arena-muted); background: #17151b; border: 1px solid var(--arena-line-strong); }.close-button:hover { color: white; border-color: var(--arena-violet-soft); }.close-button svg { width: 1rem; fill: none; stroke: currentColor; stroke-width: 1.8; }
.player-header { display: grid; grid-template-columns: auto minmax(0,1fr) auto; gap: 1rem; align-items: center; padding: 1.5rem 4rem 1.5rem 1.5rem; border-bottom: 1px solid var(--arena-line-strong); }.player-header p, .player-header h3 { margin: 0; }.player-header p { color: var(--arena-violet-soft); font: 600 .62rem var(--font-mono); letter-spacing: .08em; text-transform: uppercase; }.player-header h3 { overflow: hidden; margin-top: .35rem; color: var(--arena-text); font-family: var(--font-display); font-size: 1.6rem; text-overflow: ellipsis; white-space: nowrap; }.player-header span { display: block; overflow: hidden; margin-top: .25rem; color: var(--arena-dim); font: 500 .65rem var(--font-mono); text-overflow: ellipsis; white-space: nowrap; }.player-header > strong { color: var(--arena-violet-soft); font: 650 1.1rem var(--font-mono); }
.primary-stats, .secondary-stats { display: grid; margin: 0; }.primary-stats { grid-template-columns: repeat(4,1fr); border-bottom: 1px solid var(--arena-line-strong); }.primary-stats div, .secondary-stats div { min-width: 0; padding: 1.25rem; border-left: 1px solid var(--arena-line); }.primary-stats div:first-child, .secondary-stats div:first-child { border-left: 0; }.primary-stats dt, .secondary-stats dt, .activity-log span { color: var(--arena-dim); font: 600 .57rem var(--font-mono); letter-spacing: .08em; text-transform: uppercase; }.primary-stats dd { overflow: hidden; margin: .45rem 0 0; color: var(--arena-text); font: 650 1.25rem var(--font-mono); text-overflow: ellipsis; }.primary-stats .is-primary dd { color: var(--arena-violet-soft); }.secondary-stats { grid-template-columns: repeat(3,1fr); background: #151319; }.secondary-stats dd { margin: .4rem 0 0; color: var(--arena-text-soft); font: 600 .82rem var(--font-mono); }
.activity-log { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; padding: 1rem 1.5rem; border-top: 1px solid var(--arena-line); }.activity-log div { display: grid; gap: .3rem; }.activity-log strong { color: var(--arena-muted); font-size: .68rem; font-weight: 550; }
.modal-state { min-height: 17rem; display: grid; justify-items: start; align-content: center; gap: .5rem; padding: 2rem; }.modal-state p, .modal-state h3 { margin: 0; }.modal-state p { color: var(--arena-muted); font-size: .8rem; }.modal-state h3 { color: var(--arena-text); font-family: var(--font-display); font-size: 1.4rem; }.state-code { color: var(--arena-danger); font: 650 .65rem var(--font-mono); letter-spacing: .15em; }.loading-line { width: 4rem; height: 2px; background: var(--arena-violet); animation: load 1s ease-in-out infinite alternate; }
.modal-enter-active, .modal-leave-active { transition: opacity 180ms ease; }.modal-enter-active .player-panel, .modal-leave-active .player-panel { transition: transform 180ms ease; }.modal-enter-from, .modal-leave-to { opacity: 0; }.modal-enter-from .player-panel, .modal-leave-to .player-panel { transform: translateY(1rem); }
@keyframes load { to { width: 8rem; opacity: .4; } }
@media (max-width: 560px) { .player-header { grid-template-columns: auto minmax(0,1fr); padding: 1.2rem 3.7rem 1.2rem 1.2rem; }.player-header > strong { grid-column: 2; }.primary-stats { grid-template-columns: 1fr 1fr; }.primary-stats div:nth-child(3) { border-left: 0; }.primary-stats div:nth-child(n+3) { border-top: 1px solid var(--arena-line); }.secondary-stats, .activity-log { grid-template-columns: 1fr; }.secondary-stats div { border-left: 0; border-top: 1px solid var(--arena-line); }.activity-log { gap: .7rem; } }
@media (prefers-reduced-motion: reduce) { .loading-line { animation: none; }.modal-enter-active, .modal-leave-active, .modal-enter-active .player-panel, .modal-leave-active .player-panel { transition: none; } }
</style>
