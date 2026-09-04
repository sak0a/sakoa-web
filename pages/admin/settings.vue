<template>
  <AdminLayout>
    <div class="admin-page">
      <header class="admin-page-header">
        <div>
          <span class="admin-eyebrow">System / settings</span>
          <h1>Site settings.</h1>
          <p>Public availability, season boundaries, community links and cache freshness. Discord worker configuration lives in its dedicated workspace.</p>
        </div>
        <span v-if="meta.updatedAt" class="settings-revision">REV {{ meta.revision }} · {{ formatDate(meta.updatedAt) }}</span>
      </header>

      <div v-if="notice" :class="['admin-notice', notice.type === 'error' ? 'admin-notice--error' : 'admin-notice--success']" role="status">{{ notice.text }}</div>
      <div v-if="loading && !settings" class="admin-empty">Loading settings…</div>

      <div v-else-if="settings" class="settings-stack">
        <section class="admin-panel">
          <div class="admin-panel__header">
            <div><h2>Maintenance gate</h2><p>Controls the public maintenance screen and its message.</p></div>
            <label class="admin-toggle"><input v-model="settings.maintenance.enabled" type="checkbox"> Enabled</label>
          </div>
          <form class="admin-panel__body" @submit.prevent="save('maintenance')">
            <div class="admin-form-grid">
              <label class="admin-field"><span>Headline</span><input v-model.trim="settings.maintenance.title" required maxlength="120"></label>
              <label class="admin-field"><span>Estimated duration</span><input v-model.trim="settings.maintenance.estimatedTime" maxlength="120" placeholder="Optional"></label>
              <label class="admin-field field-wide"><span>Message</span><textarea v-model.trim="settings.maintenance.message" required maxlength="1000"></textarea></label>
            </div>
            <div class="admin-actions"><button class="admin-button admin-button-primary" :disabled="saving">Save maintenance</button></div>
          </form>
        </section>

        <section class="admin-panel">
          <div class="admin-panel__header"><div><h2>Season boundary</h2><p>The first day used by seasonal leaderboard queries.</p></div></div>
          <form class="admin-panel__body" @submit.prevent="save('seasons')">
            <div class="season-grid">
              <label class="admin-field"><span>Year</span><input v-model.number="settings.seasons.startYear" type="number" min="2020" max="2200" required></label>
              <label class="admin-field"><span>Month</span><input v-model.number="settings.seasons.startMonth" type="number" min="1" max="12" required></label>
              <label class="admin-field"><span>Day</span><input v-model.number="settings.seasons.startDay" type="number" min="1" max="31" required></label>
            </div>
            <div class="admin-actions"><button class="admin-button admin-button-primary" :disabled="saving">Save season date</button></div>
          </form>
        </section>

        <section class="admin-panel">
          <div class="admin-panel__header"><div><h2>Community & support</h2><p>Public Discord destination and the payment routes visible on the site.</p></div></div>
          <form class="admin-panel__body" @submit.prevent="saveCommunity">
            <label class="admin-field"><span>Discord invite URL</span><input v-model.trim="settings.discord.inviteUrl" type="url" required placeholder="https://discord.gg/…"></label>
            <div class="channel-toggles">
              <label class="admin-toggle"><input v-model="settings.donations.paypalEnabled" type="checkbox"> PayPal</label>
              <label class="admin-toggle"><input v-model="settings.donations.revolutEnabled" type="checkbox"> Revolut</label>
              <label class="admin-toggle"><input v-model="settings.donations.buyMeACoffeeEnabled" type="checkbox"> Buy Me a Coffee</label>
            </div>
            <div class="admin-actions"><button class="admin-button admin-button-primary" :disabled="saving">Save community settings</button></div>
          </form>
        </section>

        <section class="admin-panel">
          <div class="admin-panel__header"><div><h2>Data freshness</h2><p>Cache lifetimes in seconds. Lower values increase traffic to MySQL and game servers.</p></div></div>
          <form class="admin-panel__body" @submit.prevent="save('cache')">
            <div class="cache-grid">
              <label v-for="field in cacheFields" :key="field.key" class="admin-field">
                <span>{{ field.label }}</span>
                <input v-model.number="settings.cache[field.key]" type="number" :min="field.min" max="86400" required>
              </label>
            </div>
            <div class="admin-actions">
              <button class="admin-button admin-button-primary" :disabled="saving">Save cache intervals</button>
              <NuxtLink to="/admin/cache" class="admin-button admin-button-secondary">Inspect cache</NuxtLink>
            </div>
          </form>
        </section>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
definePageMeta({ layout: false })

const { getSettings, updateSettings } = useAdmin()
const settings = ref(null)
const meta = ref({ revision: 0, updatedAt: null })
const loading = ref(false)
const saving = ref(false)
const notice = ref(null)
let noticeTimer

const cacheFields = [
  { key: 'serverStatusInterval', label: 'Server status', min: 10 },
  { key: 'leaderboardInterval', label: 'Leaderboard', min: 10 },
  { key: 'seasonalLeaderboardInterval', label: 'Season leaderboard', min: 10 },
  { key: 'playerSearchInterval', label: 'Player search', min: 10 },
  { key: 'databaseStatusInterval', label: 'Database status', min: 5 },
  { key: 'steamProfilesInterval', label: 'Steam profiles', min: 60 },
]

function showNotice(text, type = 'success') {
  notice.value = { text, type }
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = null }, 5000)
}

async function loadSettings() {
  loading.value = true
  try {
    const result = await getSettings()
    meta.value = result._meta || meta.value
    const { _meta, ...editable } = result
    settings.value = structuredClone(editable)
  } catch (error) {
    showNotice(error?.data?.message || 'Settings could not be loaded.', 'error')
  } finally {
    loading.value = false
  }
}

async function persist(payload, successMessage) {
  saving.value = true
  try {
    const result = await updateSettings(payload)
    settings.value = structuredClone(result.settings)
    meta.value.revision = result.revision
    meta.value.updatedAt = new Date().toISOString()
    showNotice(successMessage)
  } catch (error) {
    showNotice(error?.data?.message || error?.data?.statusMessage || 'Settings could not be saved.', 'error')
  } finally {
    saving.value = false
  }
}

function save(section) {
  return persist({ [section]: settings.value[section] }, `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved.`)
}

function saveCommunity() {
  return persist({ discord: settings.value.discord, donations: settings.value.donations }, 'Community settings saved.')
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

onMounted(loadSettings)
onBeforeUnmount(() => clearTimeout(noticeTimer))
</script>

<style scoped>
.settings-stack { display: grid; gap: 1rem; }
.settings-revision { color: var(--admin-muted); font-family: var(--font-mono); font-size: .65rem; letter-spacing: .08em; }
.field-wide { grid-column: 1 / -1; }
.season-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 10rem)); gap: 1rem; }
.cache-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
.channel-toggles { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-top: 1.25rem; padding: 1rem 0; border-block: 1px solid var(--admin-line); }
@media (max-width: 950px) { .cache-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .season-grid, .cache-grid { grid-template-columns: 1fr; } .field-wide { grid-column: auto; } }
</style>
