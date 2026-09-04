<template>
  <div class="server-feed" aria-live="polite" aria-busy="loading || refreshing">
    <div v-if="loading" class="server-skeleton" role="status">
      <span class="sr-only">Loading server status</span>
      <div class="skeleton-line skeleton-line--short" />
      <div class="skeleton-line" />
      <div class="skeleton-metrics"><i /><i /><i /></div>
    </div>

    <div v-else-if="error && servers.length === 0" class="server-error" role="alert">
      <span class="status-dot status-dot--offline" />
      <div><strong>Status unavailable</strong><p>{{ error }}</p></div>
      <button type="button" class="refresh-button" @click="refreshAll">Try again</button>
    </div>

    <div v-else class="server-list">
      <article v-for="server in servers" :key="server.id" class="server-row" :class="`is-${server.status}`">
        <header class="server-row__header">
          <div class="server-identity">
            <span class="status-dot" :class="statusDotClass(server.status)" />
            <div>
              <p class="status-name">{{ statusText(server.status) }}</p>
              <h3>{{ server.name }}</h3>
            </div>
          </div>
          <span class="checked-time">{{ server.status === 'checking' ? 'Querying now' : formatLastChecked(server.lastChecked) }}</span>
        </header>

        <dl class="server-metrics">
          <div><dt>Map</dt><dd>{{ server.status === 'online' ? (server.map || 'Unknown') : '—' }}</dd></div>
          <div><dt>Players</dt><dd>{{ server.status === 'online' ? `${server.players?.length || 0}/${server.maxplayers || '—'}` : `0/${server.maxplayers || '—'}` }}</dd></div>
          <div><dt>Location</dt><dd>{{ server.location || 'Unknown' }}</dd></div>
        </dl>

        <div class="server-actions">
          <a
            v-if="server.status === 'online' && !server.comingSoon && server.connectUrl"
            :href="server.connectUrl"
            class="connect-button"
          >
            Connect with Steam <span aria-hidden="true">↗</span>
          </a>
          <span v-else class="connect-disabled">{{ server.comingSoon ? 'Coming soon' : 'Connection unavailable' }}</span>
          <button
            type="button"
            class="icon-button"
            :disabled="server.isQuerying"
            :aria-label="`Refresh ${server.name}`"
            @click="refreshServer(server.id)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6.1 9A7 7 0 0 1 18 6l2 2M17.9 15A7 7 0 0 1 6 18l-2-2" /></svg>
          </button>
        </div>

        <details v-if="server.status === 'online' && server.players?.length" class="player-list">
          <summary>{{ server.players.length }} player{{ server.players.length === 1 ? '' : 's' }} online</summary>
          <ul>
            <li v-for="(player, index) in server.players" :key="`${player.name}-${index}`">
              <span>{{ player.name || 'Anonymous' }}</span>
              <span>{{ player.score || 0 }} pts · {{ formatPlayerTime(player.time) }}</span>
            </li>
          </ul>
        </details>
      </article>

      <p v-if="error" class="stale-note">Live refresh failed. Showing the most recent available result.</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const { getAllServerStates, isLoading, error, forceRefreshServer, forceRefreshAll } = useServerStatus()
const servers = computed(() => getAllServerStates())
const loading = computed(() => isLoading.value)
const refreshing = ref(false)

const statusText = status => ({ online: 'Online', checking: 'Checking', 'coming-soon': 'Coming soon' }[status] || 'Offline')
const statusDotClass = status => status === 'online'
  ? 'status-dot--online'
  : status === 'checking' ? 'status-dot--checking' : 'status-dot--offline'

const formatPlayerTime = (seconds) => {
  const total = Number(seconds) || 0
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

const formatLastChecked = (timestamp) => {
  if (!timestamp) return 'Not checked yet'
  const elapsed = Math.max(0, Date.now() - new Date(timestamp).getTime())
  const seconds = Math.floor(elapsed / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  return minutes < 60 ? `${minutes}m ago` : new Date(timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })
}

const refreshServer = async (serverId) => {
  try { await forceRefreshServer(serverId) } catch { /* Existing status remains visible. */ }
}

const refreshAll = async () => {
  refreshing.value = true
  try { await forceRefreshAll() } catch { /* The composable exposes the degraded state. */ } finally { refreshing.value = false }
}
</script>

<style scoped>
.server-feed { min-height: 11rem; }
.server-list { display: grid; gap: .65rem; }
.server-row { background: var(--arena-ink); border-left: 2px solid var(--arena-line-strong); padding: 1.15rem; }
.server-row.is-online { border-left-color: var(--arena-success); }
.server-row.is-checking { border-left-color: var(--arena-warning); }
.server-row__header, .server-actions, .server-identity { display: flex; align-items: center; }
.server-row__header { justify-content: space-between; gap: 1rem; }
.server-identity { min-width: 0; gap: .75rem; }
.server-identity h3 { max-width: 29rem; margin: .18rem 0 0; overflow: hidden; color: var(--arena-text); font-family: var(--font-display); font-size: 1rem; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
.status-name, .checked-time { margin: 0; color: var(--arena-muted); font: 600 .62rem/1.2 var(--font-mono); letter-spacing: .08em; text-transform: uppercase; }
.is-online .status-name { color: var(--arena-success); }
.is-checking .status-name { color: var(--arena-warning); }
.status-dot { display: block; width: .55rem; height: .55rem; flex: 0 0 auto; background: var(--arena-danger); border-radius: 50%; box-shadow: 0 0 0 .26rem rgba(205, 92, 97, .1); }
.status-dot--online { background: var(--arena-success); box-shadow: 0 0 0 .26rem rgba(86, 180, 142, .1); }
.status-dot--checking { background: var(--arena-warning); box-shadow: 0 0 0 .26rem rgba(204, 163, 91, .1); animation: status-pulse 1.2s ease-in-out infinite; }
.server-metrics { display: grid; grid-template-columns: 1.3fr .7fr 1fr; gap: 1px; margin: 1rem 0; background: var(--arena-line); border: 1px solid var(--arena-line); }
.server-metrics div { min-width: 0; padding: .8rem; background: #141218; }
.server-metrics dt { color: var(--arena-dim); font: 600 .59rem/1 var(--font-mono); letter-spacing: .1em; text-transform: uppercase; }
.server-metrics dd { margin: .42rem 0 0; overflow: hidden; color: var(--arena-text-soft); font: 600 .78rem/1.25 var(--font-mono); text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
.server-actions { gap: .55rem; }
.connect-button, .connect-disabled { flex: 1; padding: .72rem .8rem; font-size: .76rem; font-weight: 700; }
.connect-button { display: flex; justify-content: space-between; color: white; background: var(--arena-violet); text-decoration: none; transition: background-color 160ms ease, transform 160ms ease; }
.connect-button:hover { background: #7658aa; transform: translateY(-1px); }
.connect-disabled { color: var(--arena-dim); border: 1px solid var(--arena-line); }
.icon-button { display: grid; width: 2.55rem; height: 2.55rem; place-items: center; color: var(--arena-muted); background: transparent; border: 1px solid var(--arena-line-strong); }
.icon-button:hover:not(:disabled) { color: white; border-color: var(--arena-violet-soft); }
.icon-button:disabled { cursor: wait; opacity: .45; }
.icon-button svg { width: 1rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.player-list { margin-top: .8rem; border-top: 1px solid var(--arena-line); }
.player-list summary { padding: .8rem 0 0; color: var(--arena-muted); font-size: .72rem; cursor: pointer; }
.player-list ul { max-height: 10rem; overflow: auto; margin: .7rem 0 0; padding: 0; list-style: none; }
.player-list li { display: flex; justify-content: space-between; gap: 1rem; padding: .55rem 0; border-top: 1px solid var(--arena-line); color: var(--arena-text-soft); font-size: .72rem; }
.player-list li span:last-child { color: var(--arena-dim); font-family: var(--font-mono); white-space: nowrap; }
.server-error { min-height: 10rem; display: grid; grid-template-columns: auto 1fr; gap: .9rem; align-content: center; padding: 1rem; }
.server-error strong { color: var(--arena-text); }
.server-error p, .stale-note { margin: .3rem 0 0; color: var(--arena-muted); font-size: .75rem; }
.refresh-button { grid-column: 2; justify-self: start; padding: .55rem .75rem; color: var(--arena-text); background: transparent; border: 1px solid var(--arena-line-strong); font-size: .72rem; }
.server-skeleton { display: grid; gap: .8rem; padding: 1.2rem; }
.skeleton-line, .skeleton-metrics i { display: block; background: #232028; animation: skeleton 1.2s ease-in-out infinite alternate; }
.skeleton-line { width: 80%; height: .8rem; }.skeleton-line--short { width: 28%; }
.skeleton-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; margin-top: 1rem; }
.skeleton-metrics i { height: 3.6rem; }
@keyframes skeleton { to { background: #2a2630; } }
@keyframes status-pulse { 50% { opacity: .35; } }
@media (max-width: 520px) {
  .checked-time { display: none; }
  .server-metrics { grid-template-columns: 1fr 1fr; }
  .server-metrics div:last-child { grid-column: 1 / -1; }
}
@media (prefers-reduced-motion: reduce) { .status-dot--checking, .skeleton-line, .skeleton-metrics i { animation: none; } }
</style>
