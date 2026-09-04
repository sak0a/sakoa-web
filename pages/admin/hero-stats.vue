<template>
  <AdminLayout>
    <div class="admin-page">
      <header class="admin-page-header">
        <div>
          <span class="admin-eyebrow">Operate / public content</span>
          <h1>Hero data.</h1>
          <p>Control the small set of figures shown at the top of the public site and compare manual values with live server state.</p>
        </div>
        <button type="button" class="admin-button admin-button-secondary" :disabled="isLoadingStats" @click="refreshServerStats">
          {{ isLoadingStats ? 'Refreshing…' : 'Refresh live data' }}
        </button>
      </header>

      <div v-if="message" :class="['admin-notice', messageType === 'success' ? 'admin-notice--success' : 'admin-notice--error']" role="status">
        {{ message }}
      </div>

      <section class="admin-grid admin-grid--stats" aria-label="Current server statistics">
        <article class="admin-stat"><span>Players online</span><strong>{{ serverStats.onlinePlayers }}</strong></article>
        <article class="admin-stat"><span>Servers online</span><strong>{{ serverStats.onlineServers }}/{{ serverStats.totalServers }}</strong></article>
        <article class="admin-stat"><span>Public player figure</span><strong>{{ formatPlayerCount(heroForm.activePlayers) }}</strong></article>
        <article class="admin-stat"><span>Monthly funding</span><strong>€{{ Number(heroForm.monthlyDonations || 0).toFixed(2) }}</strong></article>
      </section>

      <div class="admin-grid hero-workspace">
        <form class="admin-panel" @submit.prevent="saveHeroStats">
          <div class="admin-panel__header">
            <div><h2>Published values</h2><p>Manual values remain active whenever their automatic source is disabled.</p></div>
          </div>
          <div class="admin-panel__body">
            <div class="admin-form-grid">
              <label class="admin-field">
                <span>Uptime label</span>
                <input v-model.trim="heroForm.uptime" type="text" required maxlength="24" placeholder="24/7">
                <small>Short display text, not a synthetic availability score.</small>
              </label>
              <label class="admin-field">
                <span>Active player count</span>
                <input v-model.number="heroForm.activePlayers" type="number" min="0" step="1" required>
                <small>Displayed compactly above 1,000.</small>
              </label>
              <label class="admin-field">
                <span>Donated this month (€)</span>
                <input v-model.number="heroForm.monthlyDonations" type="number" min="0" step="0.01" required>
              </label>
              <label class="admin-field">
                <span>Monthly target (€)</span>
                <input v-model.number="heroForm.monthlyGoal" type="number" min="0.01" step="0.01" required>
              </label>
            </div>

            <div class="admin-divider"></div>
            <fieldset class="sync-options">
              <legend class="admin-label">Automatic sources</legend>
              <label class="sync-row">
                <span><strong>Donation total</strong><small>Read this month’s amount from donation records.</small></span>
                <input v-model="heroForm.autoUpdateDonations" type="checkbox">
              </label>
              <label class="sync-row">
                <span><strong>Player count</strong><small>Use the current game-server population.</small></span>
                <input v-model="heroForm.autoUpdatePlayers" type="checkbox">
              </label>
            </fieldset>

            <div class="admin-actions hero-form-actions">
              <button type="button" class="admin-button admin-button-secondary" @click="resetForm">Reset draft</button>
              <button type="submit" class="admin-button admin-button-primary" :disabled="isLoading">{{ isLoading ? 'Saving…' : 'Save hero data' }}</button>
            </div>
          </div>
        </form>

        <aside class="admin-panel preview-panel">
          <div class="admin-panel__header"><div><h2>Public preview</h2><p>Values as they will read in the site hero.</p></div></div>
          <div class="admin-panel__body">
            <dl class="hero-preview">
              <div><dt>Server uptime</dt><dd>{{ heroForm.uptime || '—' }}</dd></div>
              <div><dt>Active players</dt><dd>{{ formatPlayerCount(heroForm.activePlayers) }}+</dd></div>
              <div><dt>Donated this month</dt><dd>€{{ Number(heroForm.monthlyDonations || 0).toFixed(2) }}</dd></div>
            </dl>
            <div class="funding-preview">
              <div><span>Monthly goal</span><strong>{{ donationProgress }}%</strong></div>
              <div class="funding-track" role="progressbar" :aria-valuenow="donationProgress" aria-valuemin="0" aria-valuemax="100" :aria-label="`€${heroForm.monthlyDonations || 0} of €${heroForm.monthlyGoal || 0}`">
                <span :style="{ transform: `scaleX(${donationProgress / 100})` }"></span>
              </div>
              <p>€{{ Number(heroForm.monthlyDonations || 0).toFixed(2) }} of €{{ Number(heroForm.monthlyGoal || 0).toFixed(2) }}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
definePageMeta({ layout: false })

const { getSettings, updateSettings } = useAdmin()
const { getRealTimeServerStats } = useHeroStats()

const isLoading = ref(false)
const isLoadingStats = ref(false)
const message = ref('')
const messageType = ref('success')

const serverStats = ref({ onlinePlayers: 0, onlineServers: 0, totalServers: 0, servers: [] })
const heroForm = ref({
  uptime: '24/7',
  activePlayers: 0,
  monthlyDonations: 0,
  monthlyGoal: 30,
  autoUpdateDonations: false,
  autoUpdatePlayers: false,
})

const donationProgress = computed(() => {
  const goal = Number(heroForm.value.monthlyGoal)
  if (!Number.isFinite(goal) || goal <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((Number(heroForm.value.monthlyDonations) / goal) * 100)))
})

const formatPlayerCount = (count) => {
  const value = Number(count) || 0
  return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString()
}

const showMessage = (text, type = 'success') => {
  message.value = text
  messageType.value = type
  setTimeout(() => { message.value = '' }, 5000)
}

const loadSettings = async () => {
  try {
    const settingsData = await getSettings()
    if (settingsData.heroStats) {
      heroForm.value = {
        uptime: settingsData.heroStats.uptime || '24/7',
        activePlayers: Number(settingsData.heroStats.activePlayers) || 0,
        monthlyDonations: Number(settingsData.heroStats.monthlyDonations) || 0,
        monthlyGoal: Number(settingsData.heroStats.monthlyGoal) || 30,
        autoUpdateDonations: Boolean(settingsData.heroStats.autoUpdateDonations),
        autoUpdatePlayers: Boolean(settingsData.heroStats.autoUpdatePlayers),
      }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
    showMessage('Current hero data could not be loaded.', 'error')
  }
}

const saveHeroStats = async () => {
  isLoading.value = true
  try {
    const response = await updateSettings({
      heroStats: { ...heroForm.value, lastUpdated: new Date().toISOString() },
    })
    if (response.success) showMessage('Hero data saved.')
  } catch (error) {
    console.error('Failed to save hero statistics:', error)
    showMessage('Hero data could not be saved.', 'error')
  } finally {
    isLoading.value = false
  }
}

const refreshServerStats = async () => {
  isLoadingStats.value = true
  try {
    serverStats.value = await getRealTimeServerStats()
  } catch (error) {
    console.error('Failed to refresh server stats:', error)
    showMessage('Live server data could not be refreshed.', 'error')
  } finally {
    isLoadingStats.value = false
  }
}

const resetForm = () => {
  heroForm.value = { uptime: '24/7', activePlayers: 0, monthlyDonations: 0, monthlyGoal: 30, autoUpdateDonations: false, autoUpdatePlayers: false }
}

onMounted(async () => {
  await loadSettings()
  await refreshServerStats()
})
</script>

<style scoped>
.hero-workspace { grid-template-columns: minmax(0, 1.2fr) minmax(18rem, .8fr); margin-top: 1rem; }
.admin-field small { color: #73717b; font-size: .7rem; line-height: 1.45; }
.sync-options { margin: 0; padding: 0; border: 0; }
.sync-options legend { margin-bottom: .65rem; }
.sync-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 4.25rem; padding: .75rem 0; border-top: 1px solid var(--admin-line); }
.sync-row span, .sync-row strong, .sync-row small { display: block; }
.sync-row strong { color: #dddbe4; font-size: .8rem; }
.sync-row small { margin-top: .2rem; color: var(--admin-muted); font-size: .7rem; }
.sync-row input { width: 1rem; height: 1rem; accent-color: var(--admin-accent-strong); }
.hero-form-actions { justify-content: space-between; }
.preview-panel { align-self: start; }
.hero-preview { margin: 0; }
.hero-preview div { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--admin-line); }
.hero-preview dt { color: var(--admin-muted); font-size: .72rem; }
.hero-preview dd { margin: 0; color: #fff; font-family: var(--font-mono); font-size: 1.35rem; font-weight: 600; font-variant-numeric: tabular-nums; }
.funding-preview { margin-top: 1.5rem; }
.funding-preview > div:first-child { display: flex; justify-content: space-between; color: #b8b6c0; font-size: .75rem; }
.funding-preview strong { color: var(--admin-accent); font-family: var(--font-mono); }
.funding-track { height: .4rem; margin-top: .75rem; overflow: hidden; background: #29292f; }
.funding-track span { display: block; width: 100%; height: 100%; background: var(--admin-accent); transform-origin: left; transition: transform .35s ease; }
.funding-preview p { margin: .55rem 0 0; color: var(--admin-muted); font-family: var(--font-mono); font-size: .66rem; text-align: right; }
@media (max-width: 1000px) { .hero-workspace { grid-template-columns: 1fr; } }
@media (max-width: 520px) { .hero-form-actions { align-items: stretch; flex-direction: column-reverse; } }
</style>
