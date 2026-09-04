<template>
  <AdminLayout>
    <div class="admin-page">
      <header class="admin-page-header">
        <div>
          <span class="admin-eyebrow">Operations / overview</span>
          <h1>Arena control.</h1>
          <p>A compact view of the services players depend on. No synthetic performance scores—only state from the application, database and Discord worker.</p>
        </div>
        <button class="admin-button admin-button-secondary" :disabled="loading" @click="loadDashboard">
          {{ loading ? 'Refreshing…' : 'Refresh state' }}
        </button>
      </header>

      <div v-if="loadError" class="admin-notice admin-notice--error" role="alert">{{ loadError }}</div>

      <section class="admin-grid admin-grid--stats" aria-label="Platform summary">
        <article class="admin-stat">
          <span>Game servers</span>
          <strong>{{ serverStats.online }}/{{ serverStats.total }} online</strong>
        </article>
        <article class="admin-stat">
          <span>Current players</span>
          <strong>{{ serverStats.players }}</strong>
        </article>
        <article class="admin-stat">
          <span>Visible donors</span>
          <strong>{{ donorStats.visible }}/{{ donorStats.total }}</strong>
        </article>
        <article class="admin-stat">
          <span>Discord worker</span>
          <strong>{{ discordState }}</strong>
        </article>
      </section>

      <div class="admin-grid admin-grid--split mt-4">
        <section class="admin-panel">
          <div class="admin-panel__header">
            <div>
              <h2>Platform state</h2>
              <p>Live operational checks and direct routes to each control surface.</p>
            </div>
            <span :class="['admin-status', platformHealthy ? 'admin-status--online' : 'admin-status--warning']">
              {{ platformHealthy ? 'Nominal' : 'Attention' }}
            </span>
          </div>
          <div class="operations-list">
            <NuxtLink v-for="item in operationLinks" :key="item.to" :to="item.to" class="operation-row">
              <span class="operation-row__index">{{ item.index }}</span>
              <div>
                <strong>{{ item.label }}</strong>
                <small>{{ item.detail }}</small>
              </div>
              <span aria-hidden="true">→</span>
            </NuxtLink>
          </div>
        </section>

        <aside class="admin-panel">
          <div class="admin-panel__header">
            <div>
              <h2>Maintenance gate</h2>
              <p>Immediately replace the public site with its maintenance notice.</p>
            </div>
          </div>
          <div class="admin-panel__body">
            <div class="maintenance-control">
              <span :class="['admin-status', maintenanceSettings?.enabled ? 'admin-status--warning' : 'admin-status--online']">
                {{ maintenanceSettings?.enabled ? 'Public site closed' : 'Public site open' }}
              </span>
              <button class="admin-button" :class="maintenanceSettings?.enabled ? 'admin-button-primary' : 'admin-button-secondary'" :disabled="togglingMaintenance" @click="toggleMaintenance">
                {{ togglingMaintenance ? 'Updating…' : maintenanceSettings?.enabled ? 'Disable maintenance' : 'Enable maintenance' }}
              </button>
            </div>
            <p v-if="maintenanceSettings?.enabled" class="maintenance-copy">{{ maintenanceSettings.message }}</p>
            <NuxtLink to="/admin/settings" class="text-link">Edit maintenance copy →</NuxtLink>
          </div>
        </aside>
      </div>

      <section class="admin-panel mt-4">
        <div class="admin-panel__header">
          <div>
            <h2>Database</h2>
            <p>Connection controls are kept because the application and worker share this source of truth.</p>
          </div>
        </div>
        <div class="admin-panel__body database-host">
          <DatabaseStatus />
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup>
definePageMeta({ layout: false })

const { adminFetch, getServers, getSettings, updateSettings } = useAdmin()
const loading = ref(false)
const togglingMaintenance = ref(false)
const loadError = ref('')
const maintenanceSettings = ref(null)
const donorStats = ref({ total: 0, visible: 0, totalAmount: 0 })
const serverStats = ref({ total: 0, online: 0, players: 0 })
const discordState = ref('Unknown')

const platformHealthy = computed(() => !loadError.value && serverStats.value.online > 0)
const operationLinks = computed(() => [
  { index: '01', label: 'Servers', detail: `${serverStats.value.total} configured · ${serverStats.value.players} players`, to: '/admin/servers' },
  { index: '02', label: 'Discord publishing', detail: `Worker ${discordState.value.toLowerCase()}`, to: '/admin/discord' },
  { index: '03', label: 'Donor records', detail: `€${donorStats.value.totalAmount.toFixed(2)} recorded`, to: '/admin/donors' },
  { index: '04', label: 'Public content', detail: 'Hero metrics and donation goal', to: '/admin/hero-stats' },
])

async function toggleMaintenance() {
  togglingMaintenance.value = true
  try {
    const response = await updateSettings({ maintenance: { enabled: !maintenanceSettings.value?.enabled } })
    maintenanceSettings.value = response.settings.maintenance
  } catch (error) {
    loadError.value = error?.data?.message || 'Maintenance mode could not be updated.'
  } finally {
    togglingMaintenance.value = false
  }
}

async function loadDashboard() {
  loading.value = true
  loadError.value = ''
  const [settingsResult, donorsResult, serversResult, statusResult, discordResult] = await Promise.allSettled([
    getSettings(),
    adminFetch('/api/admin/donors-db'),
    getServers(),
    $fetch('/api/server-status'),
    adminFetch('/api/admin/discord'),
  ])

  if (settingsResult.status === 'fulfilled') maintenanceSettings.value = settingsResult.value.maintenance
  if (donorsResult.status === 'fulfilled') {
    const donors = donorsResult.value.donors || []
    donorStats.value = {
      total: donors.length,
      visible: donors.filter(donor => donor.show_on_website).length,
      totalAmount: donors.reduce((sum, donor) => sum + Number(donor.total_amount || 0), 0),
    }
  }
  if (serversResult.status === 'fulfilled') serverStats.value.total = serversResult.value.servers?.length || 0
  if (statusResult.status === 'fulfilled') {
    const servers = statusResult.value.servers || []
    serverStats.value.online = servers.filter(server => server.status === 'online').length
    serverStats.value.players = servers.reduce((sum, server) => sum + Number(server.numplayers ?? server.players?.length ?? 0), 0)
  }
  if (discordResult.status === 'fulfilled') {
    const state = discordResult.value.data?.runtime?.connectionState
    discordState.value = state ? state.charAt(0).toUpperCase() + state.slice(1) : 'Unknown'
  }

  const failures = [settingsResult, donorsResult, serversResult].filter(result => result.status === 'rejected')
  if (failures.length) loadError.value = 'Some control-room data is unavailable. Check the database connection below.'
  loading.value = false
}

onMounted(loadDashboard)
</script>

<style scoped>
.operations-list { display: grid; }
.operation-row { display: grid; grid-template-columns: 2rem 1fr auto; align-items: center; gap: .75rem; min-height: 5.25rem; padding: .9rem 1.25rem; border-bottom: 1px solid var(--admin-line); color: #d8d6df; }
.operation-row:last-child { border-bottom: 0; }
.operation-row:hover { background: #151519; }
.operation-row__index { color: var(--admin-accent); font-family: var(--font-mono); font-size: .64rem; }
.operation-row strong, .operation-row small { display: block; }
.operation-row strong { font-size: .88rem; }
.operation-row small { margin-top: .25rem; color: var(--admin-muted); font-size: .72rem; }
.maintenance-control { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.maintenance-copy { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--admin-line); color: #aaa8b2; font-size: .8rem; }
.text-link { display: inline-block; margin-top: 1rem; color: var(--admin-accent); font-size: .76rem; }
.database-host :deep(> div) { border: 0; background: transparent; padding: 0; }
.database-host :deep(.bg-gray-700) { border-radius: 0; background: #0c0c0f; }
@media (max-width: 520px) { .maintenance-control { align-items: flex-start; flex-direction: column; } }
</style>
