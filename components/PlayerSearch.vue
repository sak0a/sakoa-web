<template>
  <form class="player-search" role="search" @submit.prevent="searchPlayer">
    <div class="search-field">
      <label for="player-search-input">Find a player</label>
      <div class="search-input-wrap">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        <input
          id="player-search-input"
          v-model="searchInput"
          type="search"
          name="player"
          autocomplete="off"
          placeholder="Player name or SteamID"
          :disabled="loading"
          aria-describedby="player-search-help"
          @input="clearMessages"
        >
      </div>
      <p id="player-search-help">SteamID3 and legacy formats are supported.</p>
    </div>
    <button type="submit" :disabled="loading || !searchInput.trim()">
      <span>{{ loading ? 'Searching' : 'Search' }}</span>
      <span aria-hidden="true">{{ loading ? '···' : '→' }}</span>
    </button>
  </form>

  <div v-if="error" class="search-error" role="alert">{{ error }}</div>

  <div v-if="searchResults.length > 0" class="search-results">
    <p>{{ searchResults.length }} matches. Choose a player:</p>
    <div>
      <button v-for="player in searchResults" :key="player.steamid" type="button" @click="selectPlayer(player)">
        <span class="result-rank">#{{ player.rank }}</span>
        <span class="result-name">{{ player.name }}</span>
        <span class="result-points">{{ player.points?.toLocaleString('en-GB') || '0' }} pts</span>
        <span class="result-hours">{{ player.playtimeHours }}h</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  selectedSeason: { type: Object, required: true },
})
const emit = defineEmits(['playerFound'])
const searchInput = ref('')
const loading = ref(false)
const error = ref(null)
const searchResults = ref([])

const searchPlayer = async () => {
  const query = searchInput.value.trim()
  if (!query) {
    error.value = 'Enter a player name or SteamID.'
    return
  }
  loading.value = true
  error.value = null
  searchResults.value = []
  try {
    const response = await fetch(`/api/player-search?steamid=${encodeURIComponent(query)}&season=${props.selectedSeason.seasonNumber}`)
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      error.value = data?.error?.message || data.message || data.statusMessage || `Search failed (${response.status})`
      return
    }
    if (!data.success) {
      error.value = data?.error?.message || data.error || 'No matching player found.'
      return
    }
    if (data.data.multiple && data.data.players?.length) {
      searchResults.value = data.data.players
      return
    }
    if (data.data.player) {
      emit('playerFound', { player: data.data.player, steamid: data.data.player.steamid, season: data.data.season })
      searchInput.value = ''
    }
  } catch {
    error.value = 'Player search is temporarily unavailable.'
  } finally {
    loading.value = false
  }
}

const selectPlayer = (player) => {
  emit('playerFound', { player, steamid: player.steamid, season: props.selectedSeason })
  searchResults.value = []
  searchInput.value = ''
}
const clearMessages = () => { error.value = null; searchResults.value = [] }
</script>

<style scoped>
.player-search { display: grid; grid-template-columns: 1fr auto; gap: .65rem; align-items: end; }
.search-field label { display: block; margin-bottom: .35rem; color: var(--arena-dim); font: 600 .58rem var(--font-mono); letter-spacing: .1em; text-transform: uppercase; }
.search-input-wrap { position: relative; }.search-input-wrap svg { position: absolute; top: 50%; left: .75rem; width: 1rem; transform: translateY(-50%); fill: none; stroke: var(--arena-dim); stroke-width: 1.7; }.search-input-wrap input { width: 100%; padding: .78rem .8rem .78rem 2.35rem; color: var(--arena-text); background: #17151b; border: 1px solid var(--arena-line-strong); border-radius: 0; font-size: .8rem; }.search-input-wrap input::placeholder { color: var(--arena-dim); }.search-field p { margin: .32rem 0 0; color: var(--arena-dim); font-size: .64rem; }
.player-search > button { min-width: 8rem; display: flex; justify-content: space-between; gap: 1rem; padding: .78rem .85rem; color: white; background: var(--arena-violet); border: 1px solid var(--arena-violet); font-size: .78rem; font-weight: 700; }.player-search > button:hover:not(:disabled) { background: #7658aa; }.player-search > button:disabled { cursor: not-allowed; opacity: .45; }
.search-error { margin-top: .75rem; padding: .7rem .8rem; color: #f0afb2; background: rgba(205,92,97,.08); border-left: 2px solid var(--arena-danger); font-size: .75rem; }
.search-results { margin-top: .75rem; }.search-results > p { margin: 0 0 .4rem; color: var(--arena-muted); font-size: .7rem; }.search-results > div { border: 1px solid var(--arena-line-strong); }.search-results button { width: 100%; display: grid; grid-template-columns: 3rem 1fr auto 3.5rem; gap: .7rem; padding: .7rem .8rem; color: var(--arena-muted); background: #141218; border: 0; border-top: 1px solid var(--arena-line); text-align: left; font-size: .72rem; }.search-results button:first-child { border-top: 0; }.search-results button:hover { background: #1b1820; }.result-rank, .result-points { color: var(--arena-violet-soft); font-family: var(--font-mono); }.result-name { overflow: hidden; color: var(--arena-text); font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }.result-hours { color: var(--arena-dim); text-align: right; }
@media (max-width: 560px) { .player-search { grid-template-columns: 1fr; }.player-search > button { width: 100%; }.search-results button { grid-template-columns: 2.5rem 1fr auto; }.result-hours { display: none; } }
</style>
