<template>
  <section class="admin-panel" aria-labelledby="cache-heading">
    <div class="admin-panel__header">
      <div>
        <h2 id="cache-heading">Runtime cache</h2>
        <p>Inspect active entries and refresh only the data that needs it.</p>
      </div>
      <button type="button" class="admin-button admin-button-secondary" :disabled="isLoading" @click="refreshStats">
        {{ isLoading ? 'Refreshing…' : 'Refresh state' }}
      </button>
    </div>

    <div class="admin-panel__body">
      <div v-if="message" :class="['admin-notice', messageType === 'success' ? 'admin-notice--success' : 'admin-notice--error']" role="status">
        {{ message }}
      </div>

      <div v-if="isLoading && !cacheStats" class="admin-empty" aria-live="polite">Reading cache state…</div>

      <template v-else-if="cacheStats">
        <div class="cache-metrics" aria-label="Cache summary">
          <div><span>Entries</span><strong>{{ cacheStats.totalEntries }}</strong></div>
          <div><span>Memory</span><strong>{{ formatBytes(cacheStats.memoryUsage) }}</strong></div>
          <div><span>Expired</span><strong :class="{ 'cache-value--warning': expiredCount > 0 }">{{ expiredCount }}</strong></div>
        </div>

        <div class="cache-command-bar" aria-label="Cache actions">
          <div>
            <span class="admin-label">Targeted refresh</span>
            <div class="cache-actions">
              <button type="button" class="admin-button admin-button-secondary" :disabled="isLoading" @click="forceRefresh('servers')">Server status</button>
              <button type="button" class="admin-button admin-button-secondary" :disabled="isLoading" @click="forceRefresh('leaderboard')">Leaderboard</button>
              <button type="button" class="admin-button admin-button-secondary" :disabled="isLoading" @click="cleanup">Remove expired</button>
            </div>
          </div>
          <button type="button" class="admin-button admin-button-danger" :disabled="isLoading || cacheStats.totalEntries === 0" @click="clearAll">Clear all entries</button>
        </div>

        <div v-if="cacheStats.entries.length" class="admin-table-wrap cache-table-wrap">
          <table class="admin-table">
            <caption class="sr-only">Current application cache entries</caption>
            <thead>
              <tr><th>Key</th><th>TTL</th><th>Payload</th><th>State</th><th><span class="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              <tr v-for="entry in cacheStats.entries" :key="entry.key">
                <td class="admin-code" :title="entry.key">{{ truncateKey(entry.key) }}</td>
                <td class="admin-code">{{ entry.ttlRemaining }}s</td>
                <td class="admin-code">{{ formatBytes(entry.dataSize) }}</td>
                <td><span :class="['cache-state', entry.isExpired ? 'cache-state--expired' : 'cache-state--valid']">{{ entry.isExpired ? 'Expired' : 'Valid' }}</span></td>
                <td class="cache-row-action"><button type="button" class="cache-clear-link" :disabled="isLoading" :aria-label="`Clear ${entry.key}`" @click="clearSpecific(entry.key)">Clear</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="admin-empty">The cache is empty. Data will appear here after the public endpoints are requested.</div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const { getCacheStats, clearCache, forceRefreshCache, cleanupCache } = useAdmin()

const cacheStats = ref(null)
const isLoading = ref(false)
const message = ref('')
const messageType = ref('success')

const expiredCount = computed(() => {
  if (!cacheStats.value) return 0
  return cacheStats.value.entries.filter(entry => entry.isExpired).length
})

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const truncateKey = key => key.length > 44 ? `${key.substring(0, 44)}…` : key

const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => { message.value = '' }, 5000)
}

const refreshStats = async () => {
  isLoading.value = true
  try {
    cacheStats.value = await getCacheStats()
  } catch (error) {
    console.error('Failed to refresh cache stats:', error)
    showMessage('Cache statistics could not be refreshed.', 'error')
  } finally {
    isLoading.value = false
  }
}

const forceRefresh = async (dataType) => {
  isLoading.value = true
  try {
    const result = await forceRefreshCache(dataType)
    if (!result.success) throw new Error('Refresh rejected')
    showMessage(result.message)
    await refreshStats()
  } catch (error) {
    console.error('Failed to force refresh:', error)
    showMessage('The selected cache could not be refreshed.', 'error')
  } finally {
    isLoading.value = false
  }
}

const clearAll = async () => {
  if (!confirm('Clear every cache entry? The application will refill them from source data.')) return
  isLoading.value = true
  try {
    const result = await clearCache()
    if (!result.success) throw new Error('Clear rejected')
    showMessage(result.message)
    await refreshStats()
  } catch (error) {
    console.error('Failed to clear cache:', error)
    showMessage('The cache could not be cleared.', 'error')
  } finally {
    isLoading.value = false
  }
}

const clearSpecific = async (key) => {
  isLoading.value = true
  try {
    const result = await clearCache(key)
    if (!result.success) throw new Error('Clear rejected')
    showMessage(result.message)
    await refreshStats()
  } catch (error) {
    console.error('Failed to clear cache entry:', error)
    showMessage('The cache entry could not be cleared.', 'error')
  } finally {
    isLoading.value = false
  }
}

const cleanup = async () => {
  isLoading.value = true
  try {
    const result = await cleanupCache()
    if (!result.success) throw new Error('Cleanup rejected')
    showMessage(result.message)
    await refreshStats()
  } catch (error) {
    console.error('Failed to clean cache:', error)
    showMessage('Expired entries could not be removed.', 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(refreshStats)
</script>

<style scoped>
.cache-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid var(--admin-line); background: #0c0c0f; }
.cache-metrics > div { min-height: 6rem; padding: 1rem; border-right: 1px solid var(--admin-line); }
.cache-metrics > div:last-child { border-right: 0; }
.cache-metrics span, .cache-metrics strong { display: block; }
.cache-metrics span { color: var(--admin-muted); font-family: var(--font-mono); font-size: .62rem; letter-spacing: .1em; text-transform: uppercase; }
.cache-metrics strong { margin-top: 1rem; font-family: var(--font-mono); font-size: 1.25rem; font-variant-numeric: tabular-nums; }
.cache-value--warning { color: #fbbf24; }
.cache-command-bar { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin: 1rem 0; padding: 1rem 0; border-block: 1px solid var(--admin-line); }
.cache-actions { display: flex; flex-wrap: wrap; gap: .55rem; margin-top: .55rem; }
.cache-table-wrap { max-height: 23rem; border: 1px solid var(--admin-line); }
.cache-table-wrap thead { position: sticky; top: 0; z-index: 1; background: #111114; }
.cache-state { font-family: var(--font-mono); font-size: .65rem; text-transform: uppercase; }
.cache-state--valid { color: #6ee7b7; }
.cache-state--expired { color: #fbbf24; }
.cache-row-action { text-align: right; }
.cache-clear-link { color: #fca5a5; font-size: .72rem; font-weight: 650; }
.cache-clear-link:hover { color: #fecaca; text-decoration: underline; }
.cache-clear-link:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 3px; }
.cache-clear-link:disabled { opacity: .45; }
@media (max-width: 650px) {
  .cache-metrics { grid-template-columns: 1fr; }
  .cache-metrics > div { min-height: auto; border-right: 0; border-bottom: 1px solid var(--admin-line); }
  .cache-metrics > div:last-child { border-bottom: 0; }
  .cache-command-bar { align-items: stretch; flex-direction: column; }
}
</style>
