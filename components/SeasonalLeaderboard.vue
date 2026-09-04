<template>
  <div class="leaderboard-shell">
    <header class="leaderboard-toolbar">
      <div class="leaderboard-title">
        <span class="leaderboard-mark" aria-hidden="true">↗</span>
        <div><p>Live database</p><h3>Player leaderboard</h3></div>
      </div>

      <div class="leaderboard-controls">
        <label>
          <span>Season</span>
          <select v-model="selectedSeasonNumber" :disabled="seasonsLoading" @change="onSeasonChange">
            <option v-if="seasonsLoading" :value="null">Loading seasons…</option>
            <option v-for="season in availableSeasons" :key="season.seasonNumber" :value="season.seasonNumber">
              {{ season.displayName }} · {{ season.dateRange }}
            </option>
          </select>
        </label>
        <label>
          <span>Metric</span>
          <select v-model="selectedSort">
            <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label>
          <span>Order</span>
          <select v-model="selectedOrder">
            <option v-for="option in orderOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
      </div>
    </header>

    <div class="search-wrap">
      <PlayerSearch v-if="selectedSeason" :selected-season="selectedSeason" @player-found="onPlayerFound" />
    </div>

    <div v-if="loading" class="rank-loading" role="status" aria-live="polite">
      <span class="sr-only">Loading leaderboard</span>
      <i v-for="index in 5" :key="index" />
    </div>

    <div v-else-if="error && players.length === 0" class="rank-message" role="alert">
      <strong>Leaderboard unavailable</strong>
      <p>{{ error }}</p>
      <button type="button" @click="fetchLeaderboard">Try again</button>
    </div>

    <div v-else-if="players.length > 0" class="leaderboard-content">
      <section class="featured-ranks" aria-labelledby="featured-heading">
        <div class="subheading"><h4 id="featured-heading">Featured results</h4><span>{{ getStatLabel(selectedSort) }}</span></div>
        <div class="featured-grid">
          <article
            v-for="(player, index) in topThree"
            :key="player.steamid"
            class="featured-player"
            :class="{ 'featured-player--lead': index === 0 }"
          >
            <div class="featured-rank">#{{ player.rank }}</div>
            <SteamAvatar :steam-id="player.steamid" :size="index === 0 ? '88px' : '54px'" avatar-size="full" :clickable="true" :show-status="false" />
            <button type="button" class="player-open" :aria-label="`View ${player.name}'s statistics`" @click="openPlayerModal(player.steamid)">
              <span class="featured-name">{{ player.name }}</span>
              <span class="featured-value">{{ formatStatValue(player[selectedSort], selectedSort) }}</span>
            </button>
            <dl>
              <div><dt>K/D</dt><dd>{{ player.kd_ratio }}</dd></div>
              <div><dt>Playtime</dt><dd>{{ player.playtimeHours }}h</dd></div>
            </dl>
          </article>
        </div>
      </section>

      <section v-if="remainingPlayers.length" class="all-ranks" aria-labelledby="all-ranks-heading">
        <div class="subheading"><h4 id="all-ranks-heading">Full ranking</h4><span>{{ players.length }} tracked players</span></div>
        <div class="rank-table-wrap">
          <table class="rank-table">
            <thead><tr><th>Rank</th><th>Player</th><th>{{ getStatLabel(selectedSort) }}</th><th>K/D</th><th>Hours</th></tr></thead>
            <tbody>
              <tr v-for="player in remainingPlayers" :key="player.steamid">
                <td class="rank-cell">#{{ player.rank }}</td>
                <td>
                  <div class="table-player">
                    <SteamAvatar :steam-id="player.steamid" size="28px" avatar-size="small" :clickable="true" :show-status="false" />
                    <button type="button" :aria-label="`View ${player.name}'s statistics`" @click="openPlayerModal(player.steamid)">{{ player.name }}</button>
                  </div>
                </td>
                <td class="metric-cell">{{ formatStatValue(player[selectedSort], selectedSort) }}</td>
                <td>{{ player.kd_ratio }}</td>
                <td>{{ player.playtimeHours }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer class="rank-footer">
        <span>Updated {{ updateLabel }}</span>
        <span v-if="error" class="rank-warning">Refresh failed; showing available data</span>
      </footer>
    </div>

    <div v-else class="rank-message">
      <strong>No player data yet</strong>
      <p>This season has no recorded leaderboard entries.</p>
    </div>

    <PlayerModal
      :is-open="showPlayerModal"
      :steamid="selectedPlayerSteamId"
      :season="selectedSeason"
      @close="closePlayerModal"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import PlayerModal from './PlayerModal.vue'
import PlayerSearch from './PlayerSearch.vue'
import SteamAvatar from './SteamAvatar.vue'

const availableSeasons = ref([])
const selectedSeasonNumber = ref(null)
const selectedSeason = ref(null)
const players = ref([])
const loading = ref(true)
const seasonsLoading = ref(true)
const error = ref(null)
const selectedSort = ref('points')
const selectedOrder = ref('desc')
const showPlayerModal = ref(false)
const selectedPlayerSteamId = ref(null)
const updateLabel = ref('just now')

const sortOptions = [
  { label: 'Points', value: 'points' },
  { label: 'Top speed', value: 'topspeed' },
  { label: 'Playtime', value: 'playtime' },
  { label: 'Kills', value: 'kills' },
  { label: 'Deaths', value: 'deaths' },
]
const orderOptions = [
  { label: 'Highest first', value: 'desc' },
  { label: 'Lowest first', value: 'asc' },
]

const topThree = computed(() => players.value.slice(0, 3))
const remainingPlayers = computed(() => players.value.slice(3))

const fetchSeasons = async () => {
  seasonsLoading.value = true
  try {
    const response = await fetch('/api/seasons')
    const data = await response.json()
    if (!response.ok || !data.success) throw new Error(data?.error?.message || data?.error || 'Could not load seasons')
    availableSeasons.value = data.data.seasons || []
    const current = availableSeasons.value.find(season => season.isCurrent) || availableSeasons.value[0]
    if (current) {
      selectedSeasonNumber.value = current.seasonNumber
      selectedSeason.value = current
    }
  } catch (fetchError) {
    error.value = fetchError instanceof Error ? fetchError.message : 'Could not load seasons'
  } finally {
    seasonsLoading.value = false
  }
}

const fetchLeaderboard = async () => {
  if (!selectedSeasonNumber.value) {
    loading.value = false
    return
  }
  loading.value = true
  error.value = null
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  try {
    const response = await fetch(`/api/seasonal-leaderboard?season=${selectedSeasonNumber.value}&sortBy=${selectedSort.value}&order=${selectedOrder.value}&limit=50`, { signal: controller.signal })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.statusMessage || `Leaderboard request failed (${response.status})`)
    if (data.success) {
      players.value = data.data.players || []
      selectedSeason.value = data.data.season
      updateLabel.value = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' })
    } else {
      error.value = data?.error?.message || data.error || 'Leaderboard data is unavailable'
      players.value = data.data?.players || []
    }
  } catch (fetchError) {
    error.value = fetchError?.name === 'AbortError' ? 'The leaderboard request timed out' : (fetchError?.message || 'Could not load the leaderboard')
    players.value = []
  } finally {
    clearTimeout(timeoutId)
    loading.value = false
  }
}

const onSeasonChange = () => {
  selectedSeason.value = availableSeasons.value.find(season => season.seasonNumber === selectedSeasonNumber.value) || null
  fetchLeaderboard()
}
const onPlayerFound = data => openPlayerModal(data.steamid)
const openPlayerModal = (steamid) => {
  selectedPlayerSteamId.value = steamid
  showPlayerModal.value = true
}
const closePlayerModal = () => {
  showPlayerModal.value = false
  selectedPlayerSteamId.value = null
}

const formatStatValue = (value, statType) => {
  const numeric = Number(value) || 0
  if (statType === 'topspeed') return `${numeric.toLocaleString('en-GB')} mph`
  if (statType === 'playtime') return `${Math.round(numeric / 3600)} hrs`
  return numeric.toLocaleString('en-GB')
}
const getStatLabel = statType => ({ topspeed: 'Top speed', points: 'Points', playtime: 'Playtime', kills: 'Kills', deaths: 'Deaths' }[statType] || statType)

onMounted(async () => {
  await fetchSeasons()
  await fetchLeaderboard()
})
watch([selectedSort, selectedOrder], fetchLeaderboard)
</script>

<style scoped>
.leaderboard-shell { background: #0d0c10; border: 1px solid var(--arena-line-strong); }
.leaderboard-toolbar { display: flex; justify-content: space-between; gap: 2rem; padding: 1.4rem; border-bottom: 1px solid var(--arena-line-strong); }
.leaderboard-title { display: flex; align-items: center; gap: .8rem; min-width: 13rem; }
.leaderboard-mark { display: grid; width: 2.5rem; height: 2.5rem; place-items: center; color: white; background: var(--arena-violet); font-size: 1.1rem; }
.leaderboard-title p, .leaderboard-title h3 { margin: 0; }.leaderboard-title p { color: var(--arena-dim); font: 600 .59rem var(--font-mono); letter-spacing: .12em; text-transform: uppercase; }.leaderboard-title h3 { margin-top: .3rem; font-family: var(--font-display); font-size: 1.1rem; }
.leaderboard-controls { display: grid; grid-template-columns: minmax(12rem, 1.5fr) minmax(8rem, 1fr) minmax(8rem, 1fr); gap: .65rem; width: min(100%, 38rem); }
.leaderboard-controls label { display: grid; gap: .3rem; }.leaderboard-controls label span { color: var(--arena-dim); font: 600 .58rem var(--font-mono); letter-spacing: .09em; text-transform: uppercase; }
.leaderboard-controls select { width: 100%; min-width: 0; padding: .65rem 2rem .65rem .7rem; color: var(--arena-text-soft); background: #17151b; border: 1px solid var(--arena-line-strong); border-radius: 0; font: 600 .72rem var(--font-sans); }
.search-wrap { padding: 1.2rem 1.4rem .2rem; border-bottom: 1px solid var(--arena-line); }
.leaderboard-content { padding: 1.4rem; }.subheading { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }.subheading h4 { margin: 0; color: var(--arena-text); font-size: .82rem; }.subheading span { color: var(--arena-dim); font: 600 .62rem var(--font-mono); text-transform: uppercase; letter-spacing: .08em; }
.featured-grid { display: grid; grid-template-columns: 1.35fr 1fr 1fr; gap: 1px; background: var(--arena-line-strong); border: 1px solid var(--arena-line-strong); }
.featured-player { position: relative; display: grid; align-content: start; gap: 1rem; min-width: 0; padding: 1.25rem; background: #141218; }.featured-player--lead { padding: 1.75rem; background: #19151f; }
.featured-rank { position: absolute; top: 1rem; right: 1rem; color: var(--arena-violet-soft); font: 650 .72rem var(--font-mono); }.player-open { display: grid; gap: .35rem; padding: 0; text-align: left; color: inherit; background: none; border: 0; cursor: pointer; }.player-open::after { content: ''; position: absolute; inset: 0; }.player-open:focus-visible::after { outline: 2px solid var(--arena-focus); outline-offset: -3px; }
.featured-name { overflow: hidden; color: var(--arena-text); font-family: var(--font-display); font-size: clamp(1.05rem, 2vw, 1.5rem); font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }.featured-value { color: var(--arena-violet-soft); font: 650 clamp(1.3rem, 3vw, 2.25rem)/1 var(--font-mono); font-variant-numeric: tabular-nums; }
.featured-player dl { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; margin: auto 0 0; background: var(--arena-line); }.featured-player dl div { padding: .65rem; background: #100f13; }.featured-player dt { color: var(--arena-dim); font: 600 .55rem var(--font-mono); text-transform: uppercase; }.featured-player dd { margin: .3rem 0 0; color: var(--arena-text-soft); font: 600 .75rem var(--font-mono); }
.all-ranks { margin-top: 2.3rem; }.rank-table-wrap { max-height: 29rem; overflow: auto; border: 1px solid var(--arena-line-strong); }.rank-table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }.rank-table thead { position: sticky; top: 0; z-index: 2; background: #18161c; }.rank-table th { padding: .7rem .85rem; color: var(--arena-dim); font: 600 .58rem var(--font-mono); letter-spacing: .09em; text-align: left; text-transform: uppercase; }.rank-table td { padding: .72rem .85rem; border-top: 1px solid var(--arena-line); color: var(--arena-muted); font: 500 .75rem var(--font-mono); }.rank-table tbody tr:hover { background: rgba(142,111,200,.055); }.rank-cell, .metric-cell { color: var(--arena-violet-soft) !important; }.table-player { display: flex; align-items: center; gap: .6rem; }.table-player button { position: relative; overflow: hidden; max-width: 18rem; padding: .25rem 0; color: var(--arena-text); background: none; border: 0; font: 650 .78rem var(--font-sans); text-align: left; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }.table-player button:hover { color: var(--arena-violet-soft); }
.rank-footer { display: flex; justify-content: space-between; gap: 1rem; padding-top: .9rem; color: var(--arena-dim); font: 500 .62rem var(--font-mono); }.rank-warning { color: var(--arena-warning); }
.rank-loading { display: grid; gap: 1px; padding: 1.4rem; }.rank-loading i { display: block; height: 3.5rem; background: #17151b; animation: loading 1s ease-in-out infinite alternate; }.rank-message { display: grid; justify-items: start; min-height: 14rem; align-content: center; padding: 2rem; }.rank-message strong { color: var(--arena-text); }.rank-message p { margin: .4rem 0 1rem; color: var(--arena-muted); font-size: .82rem; }.rank-message button { padding: .6rem .8rem; color: var(--arena-text); background: transparent; border: 1px solid var(--arena-line-strong); }
@keyframes loading { to { background: #201d25; } }
@media (max-width: 820px) { .leaderboard-toolbar { flex-direction: column; }.leaderboard-controls { width: 100%; }.featured-grid { grid-template-columns: 1fr 1fr; }.featured-player--lead { grid-column: 1 / -1; }.rank-table { min-width: 38rem; } }
@media (max-width: 580px) { .leaderboard-toolbar, .leaderboard-content { padding: 1rem; }.search-wrap { padding: 1rem 1rem .1rem; }.leaderboard-controls { grid-template-columns: 1fr 1fr; }.leaderboard-controls label:first-child { grid-column: 1 / -1; }.featured-grid { grid-template-columns: 1fr; }.featured-player--lead { grid-column: auto; }.rank-footer { flex-direction: column; } }
@media (prefers-reduced-motion: reduce) { .rank-loading i { animation: none; } }
</style>
