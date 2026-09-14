<template>
  <AdminLayout>
      <div class="admin-page">
        <header class="admin-page-header">
          <div>
            <span class="admin-eyebrow">Operate / Discord</span>
            <h1>Status worker.</h1>
            <p>Configure TF2 status publishing, validate access, inspect durable jobs, and preview managed messages.</p>
          </div>
          <div class="discord-header-actions">
            <span :class="['admin-status', workerStatusClass]">{{ workerStatusLabel }}</span>
            <button class="admin-button admin-button-secondary" :disabled="loading" @click="load">
              {{ loading ? 'Refreshing…' : 'Refresh state' }}
            </button>
          </div>
        </header>

        <div v-if="notice" :class="['admin-notice', noticeClass]" role="status">
          {{ notice.message }}
        </div>

        <div v-if="loading && !snapshot" class="admin-panel admin-empty" aria-live="polite">
          Loading Discord worker state…
        </div>

        <template v-else-if="snapshot">
          <section class="admin-grid admin-grid--stats" aria-label="Discord worker summary">
            <article class="admin-stat">
              <span>Connection</span>
              <strong>{{ snapshot.runtime.connectionState }}</strong>
            </article>
            <article class="admin-stat">
              <span>Identity</span>
              <strong>{{ snapshot.runtime.botUserTag || 'Not connected' }}</strong>
            </article>
            <article class="admin-stat">
              <span>Heartbeat</span>
              <strong>{{ heartbeatLabel }}</strong>
            </article>
            <article class="admin-stat">
              <span>Token</span>
              <strong>{{ snapshot.runtime.tokenConfigured ? 'Configured' : 'Missing' }}</strong>
            </article>
          </section>

          <div class="admin-grid admin-grid--split discord-workspace">
            <form class="admin-panel discord-config" @submit.prevent="saveSettings">
              <div class="discord-section-header">
                <div>
                  <h2>Worker configuration</h2>
                  <p>Revision {{ form.revision }} · changes reload without a container restart.</p>
                </div>
                <div class="discord-toggles">
                  <label class="admin-toggle">
                    <input v-model="form.enabled" type="checkbox">
                    Worker
                  </label>
                  <label class="admin-toggle">
                    <input v-model="form.publishingEnabled" type="checkbox">
                    Publishing
                  </label>
                </div>
              </div>

              <div class="admin-form-grid">
                <label class="admin-field">
                  <span>Guild ID</span>
                  <input v-model.trim="form.guildId" inputmode="numeric" placeholder="123456789012345678">
                </label>
                <label class="admin-field">
                  <span>Status channel ID</span>
                  <input v-model.trim="form.statusChannelId" inputmode="numeric" placeholder="123456789012345678">
                </label>
                <label class="admin-field">
                  <span>Update interval</span>
                  <div class="input-unit">
                    <input v-model.number="form.updateIntervalSeconds" type="number" min="30" max="3600" step="10">
                    <span>seconds</span>
                  </div>
                </label>
                <label class="admin-field field-wide">
                  <span>Optional embed heading</span>
                  <input v-model.trim="form.embedHeading" maxlength="256" placeholder="Leave empty to show only the server name">
                </label>
                <label class="admin-field field-wide">
                  <span>Optional message text</span>
                  <textarea v-model="form.contentText" maxlength="2000" rows="3" placeholder="Shown above the status embed"></textarea>
                </label>
              </div>

              <label class="discord-player-toggle admin-toggle">
                <input v-model="form.showPlayerNames" type="checkbox">
                Include player names, points, and playing time in status embeds
              </label>

              <div class="admin-actions">
                <button type="submit" class="admin-button admin-button-primary" :disabled="saving">
                  {{ saving ? 'Saving…' : 'Save configuration' }}
                </button>
                <button type="button" class="admin-button admin-button-secondary" :disabled="actionPending" @click="queueJob('validate_config')">
                  Validate Discord access
                </button>
                <button type="button" class="admin-button admin-button-secondary" :disabled="actionPending" @click="queueJob('register_commands')">
                  Register commands
                </button>
              </div>
            </form>

            <aside class="discord-side-stack">
              <section class="admin-panel publication-panel">
                <div class="discord-section-header">
                  <div>
                    <h2>Status publication</h2>
                    <p>{{ snapshot.servers.length }} configured server{{ snapshot.servers.length === 1 ? '' : 's' }}</p>
                  </div>
                  <button class="admin-button admin-button-primary" :disabled="actionPending" @click="queueJob('publish_all')">
                    Publish all
                  </button>
                </div>
                <div class="publication-list">
                  <div v-for="server in snapshot.servers" :key="server.id" class="publication-row">
                    <div>
                      <strong>{{ server.displayName }}</strong>
                      <span>{{ server.host }}:{{ server.port }}</span>
                    </div>
                    <div class="publication-actions">
                      <button type="button" @click="preview(server.id)">Preview</button>
                      <button type="button" @click="queueJob('publish_one', server.id)">Publish</button>
                    </div>
                  </div>
                  <p v-if="snapshot.servers.length === 0" class="admin-empty">No servers are enabled for Discord publishing.</p>
                </div>
              </section>

              <section v-if="previewData" class="admin-panel embed-preview" :style="{ borderLeftColor: previewData.status.online ? '#57f287' : '#e05252' }">
                <span class="admin-eyebrow">Managed embed preview</span>
                <h3>{{ previewData.message.embeds[0].title }}</h3>
                <p>{{ previewData.status.online ? 'Online' : 'Offline' }} · {{ previewData.status.map || 'Unavailable' }}</p>
                <dl>
                  <div v-for="field in previewData.message.embeds[0].fields" :key="field.name">
                    <dt>{{ field.name }}</dt>
                    <dd>{{ field.value }}</dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>

          <section class="admin-panel discord-jobs">
            <div class="admin-panel__header">
              <div>
                <h2>Recent jobs</h2>
                <p>Queued {{ snapshot.jobCounts.queued }} · Running {{ snapshot.jobCounts.running }} · Failed {{ snapshot.jobCounts.failed }}</p>
              </div>
            </div>
            <div class="admin-table-wrap">
              <table class="admin-table">
                <caption class="sr-only">Recent Discord worker jobs</caption>
                <thead>
                  <tr><th>Job</th><th>Status</th><th>Attempts</th><th>Created</th><th>Result</th></tr>
                </thead>
                <tbody>
                  <tr v-for="job in snapshot.jobs" :key="job.id">
                    <td class="admin-code">#{{ job.id }} · {{ job.jobType }}</td>
                    <td><span :class="['job-state', `job-state--${job.status}`]">{{ job.status }}</span></td>
                    <td class="admin-code">{{ job.attempts }}/{{ job.maxAttempts }}</td>
                    <td>{{ formatDate(job.createdAt) }}</td>
                    <td class="job-result">{{ job.errorMessage || (job.result ? 'Completed' : '—') }}</td>
                  </tr>
                  <tr v-if="snapshot.jobs.length === 0"><td colspan="5" class="admin-empty">No Discord jobs yet.</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>
      </div>
  </AdminLayout>
</template>

<script setup>
const { adminFetch } = useAdmin()
const snapshot = ref(null)
const loading = ref(false)
const saving = ref(false)
const actionPending = ref(false)
const previewData = ref(null)
const notice = ref(null)
const form = reactive({
  enabled: false,
  publishingEnabled: false,
  guildId: '',
  statusChannelId: '',
  updateIntervalSeconds: 60,
  embedHeading: 'saka Dodgeball',
  contentText: '',
  showPlayerNames: true,
  revision: 0,
})
const accentHex = ref('#8b55ff')

const workerStatusLabel = computed(() => {
  const state = snapshot.value?.runtime?.connectionState
  if (!state) return 'Unknown'
  if (state === 'connected') return 'Connected'
  if (state === 'disabled') return 'Disabled'
  return state.charAt(0).toUpperCase() + state.slice(1)
})

const workerStatusClass = computed(() => {
  const state = snapshot.value?.runtime?.connectionState
  if (state === 'connected') return 'admin-status--online'
  if (state === 'disabled' || state === 'stopped') return ''
  return 'admin-status--warning'
})

const heartbeatLabel = computed(() => {
  const heartbeat = snapshot.value?.runtime?.heartbeatAt
  if (!heartbeat) return 'Never'
  const seconds = Math.max(0, Math.round((Date.now() - new Date(heartbeat).getTime()) / 1000))
  return seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`
})

const noticeClass = computed(() => notice.value?.type === 'error'
  ? 'admin-notice--error'
  : 'admin-notice--success')

function applySnapshot(data) {
  snapshot.value = data
  const settings = data.settings
  Object.assign(form, {
    enabled: settings.enabled,
    publishingEnabled: settings.publishingEnabled,
    guildId: settings.guildId || '',
    statusChannelId: settings.statusChannelId || '',
    updateIntervalSeconds: settings.updateIntervalSeconds,
    embedHeading: settings.embedHeading,
    contentText: settings.contentText,
    showPlayerNames: settings.showPlayerNames,
    revision: settings.revision,
  })
  accentHex.value = `#${Number(settings.embedAccentColor).toString(16).padStart(6, '0')}`
}

async function load() {
  loading.value = true
  try {
    const response = await adminFetch('/api/admin/discord')
    applySnapshot(response.data)
  } catch (error) {
    showNotice(error?.data?.statusMessage || 'Could not load Discord worker state', 'error')
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  try {
    await adminFetch('/api/admin/discord', {
      method: 'PUT',
      body: {
        expectedRevision: form.revision,
        settings: {
          enabled: form.enabled,
          publishingEnabled: form.publishingEnabled,
          guildId: form.guildId || null,
          statusChannelId: form.statusChannelId || null,
          updateIntervalSeconds: form.updateIntervalSeconds,
          embedHeading: form.embedHeading,
          embedAccentColor: Number.parseInt(accentHex.value.slice(1), 16),
          contentText: form.contentText,
          showPlayerNames: form.showPlayerNames,
        },
      },
    })
    showNotice('Discord configuration saved')
    await load()
  } catch (error) {
    showNotice(error?.data?.statusMessage || 'Could not save Discord configuration', 'error')
  } finally {
    saving.value = false
  }
}

async function queueJob(jobType, serverId) {
  actionPending.value = true
  try {
    await adminFetch('/api/admin/discord/jobs', {
      method: 'POST',
      body: serverId ? { jobType, serverId } : { jobType },
    })
    showNotice('Discord action queued')
    window.setTimeout(load, 800)
  } catch (error) {
    showNotice(error?.data?.statusMessage || 'Could not queue Discord action', 'error')
  } finally {
    actionPending.value = false
  }
}

async function preview(serverId) {
  try {
    const response = await adminFetch('/api/admin/discord/preview', { query: { serverId } })
    previewData.value = response.data
  } catch (error) {
    showNotice(error?.data?.statusMessage || 'Could not generate the preview', 'error')
  }
}

function showNotice(message, type = 'success') {
  notice.value = { message, type }
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

onMounted(load)
</script>

<style scoped>
.discord-header-actions, .discord-toggles, .color-inputs, .publication-actions { display: flex; align-items: center; gap: .65rem; }
.discord-workspace { margin-top: 1rem; }
.discord-config { padding: 1.25rem; }
.discord-section-header { display: flex; align-items: start; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--admin-line); }
.discord-section-header h2 { margin: 0; font-size: .95rem; font-weight: 650; }
.discord-section-header p { margin: .25rem 0 0; color: var(--admin-muted); font-size: .72rem; }
.field-wide { grid-column: 1 / -1; }
.input-unit { position: relative; }
.input-unit input { padding-right: 4.5rem; }
.input-unit span { position: absolute; top: 50%; right: .75rem; color: var(--admin-muted); font-family: var(--font-mono); font-size: .62rem; transform: translateY(-50%); }
.color-inputs input[type='color'] { flex: 0 0 3rem; padding: .3rem; }
.discord-player-toggle { width: 100%; margin-top: 1rem; border-block: 1px solid var(--admin-line); padding: .9rem 0; }
.discord-side-stack { display: grid; align-content: start; gap: 1rem; }
.publication-panel, .embed-preview { padding: 1.1rem; }
.publication-list { border-top: 1px solid var(--admin-line); }
.publication-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .85rem 0; border-bottom: 1px solid var(--admin-line); }
.publication-row strong, .publication-row span { display: block; }
.publication-row strong { overflow: hidden; max-width: 15rem; color: #e7e5ec; font-size: .8rem; text-overflow: ellipsis; white-space: nowrap; }
.publication-row span { margin-top: .2rem; color: var(--admin-muted); font-family: var(--font-mono); font-size: .64rem; }
.publication-actions button { color: var(--admin-accent); font-size: .7rem; font-weight: 650; }
.publication-actions button:hover { text-decoration: underline; }
.publication-actions button:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 3px; }
.embed-preview { border-left: 2px solid var(--admin-accent); }
.embed-preview h3 { margin: .85rem 0 .2rem; font-size: 1rem; }
.embed-preview > p { margin: 0; color: var(--admin-muted); font-size: .72rem; }
.embed-preview dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; margin: 1rem 0 0; }
.embed-preview dl div { padding: .7rem; background: #0c0c0f; }
.embed-preview dt { color: var(--admin-muted); font-size: .65rem; }
.embed-preview dd { margin: .3rem 0 0; color: #d8d6df; font-size: .7rem; white-space: pre-line; }
.discord-jobs { margin-top: 1rem; }
.job-state { font-family: var(--font-mono); font-size: .64rem; text-transform: uppercase; }
.job-state--completed { color: #6ee7b7; }
.job-state--failed { color: #fca5a5; }
.job-state--running, .job-state--queued { color: #c4b5fd; }
.job-result { overflow: hidden; max-width: 20rem; color: var(--admin-muted); text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 620px) {
  .discord-header-actions, .discord-section-header { align-items: flex-start; flex-direction: column; }
  .discord-toggles { flex-wrap: wrap; }
  .field-wide { grid-column: auto; }
  .publication-row { align-items: flex-start; flex-direction: column; }
  .embed-preview dl { grid-template-columns: 1fr; }
}
</style>
