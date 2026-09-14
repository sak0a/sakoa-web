<template>
  <AdminLayout>
    <div class="admin-page">
      <header class="admin-page-header">
        <div>
          <span class="admin-eyebrow">Operate / game servers</span>
          <h1>Server registry.</h1>
          <p>The canonical server list shared by the public site and Discord publisher. Availability below is live; configuration is stored in MySQL.</p>
        </div>
        <div class="admin-actions header-actions">
          <button class="admin-button admin-button-secondary" :disabled="statusLoading" @click="forceRefreshAll">Refresh status</button>
          <button class="admin-button admin-button-primary" @click="openCreate">Add server</button>
        </div>
      </header>

      <div v-if="error" class="admin-notice admin-notice--error" role="alert">{{ error }}</div>
      <div v-if="loading" class="admin-empty">Loading server registry…</div>

      <section v-else class="admin-panel">
        <div class="admin-panel__header">
          <div><h2>Configured endpoints</h2><p>{{ servers.length }} record{{ servers.length === 1 ? '' : 's' }}, ordered for public display.</p></div>
          <span class="admin-status" :class="onlineCount ? 'admin-status--online' : 'admin-status--warning'">{{ onlineCount }} online</span>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table server-table">
            <thead><tr><th>Order</th><th>Server</th><th>Endpoint</th><th>Live state</th><th>Publishing</th><th></th></tr></thead>
            <tbody>
              <tr v-for="(server, index) in servers" :key="server.id">
                <td class="admin-code">{{ String(server.displayOrder).padStart(2, '0') }}</td>
                <td>
                  <strong class="server-name">{{ server.name }}</strong>
                  <span class="server-meta">{{ server.location || 'Location not set' }} · {{ server.id }}</span>
                </td>
                <td class="admin-code">{{ server.host }}:{{ server.port }}</td>
                <td><span :class="['admin-status', statusClass(server.id)]">{{ statusLabel(server) }}</span></td>
                <td>
                  <span class="server-meta">{{ server.enabled ? 'Website on' : 'Website off' }}</span>
                  <span class="server-meta">{{ server.discordPublishEnabled ? 'Discord on' : 'Discord off' }}</span>
                </td>
                <td><div class="row-actions"><button @click="openEdit(index, server)">Edit</button><button class="danger" @click="requestDelete(index, server)">Delete</button></div></td>
              </tr>
              <tr v-if="servers.length === 0"><td colspan="6" class="admin-empty">No servers configured.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="registry-note">
        <span class="admin-eyebrow">Publication flow</span>
        <p>Only enabled records appear publicly. Discord publishing adds a second independent gate, so a live website server can remain absent from status embeds.</p>
        <NuxtLink to="/admin/discord">Configure Discord worker →</NuxtLink>
      </section>
    </div>

    <div v-if="modalOpen" class="admin-modal-backdrop" @click.self="closeModal">
      <form class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="server-dialog-title" @submit.prevent="saveServer">
        <div class="admin-panel__header">
          <div><span class="admin-eyebrow">Registry entry</span><h2 id="server-dialog-title">{{ editingIndex === null ? 'Add server' : 'Edit server' }}</h2></div>
          <button type="button" class="modal-close" aria-label="Close" @click="closeModal">×</button>
        </div>
        <div class="admin-panel__body">
          <div v-if="modalError" class="admin-notice admin-notice--error" role="alert">{{ modalError }}</div>
          <div class="admin-form-grid">
            <label class="admin-field"><span>Stable ID</span><input v-model.trim="form.id" required pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,63}"></label>
            <label class="admin-field"><span>Display order</span><input v-model.number="form.displayOrder" type="number" min="0" max="1000000" required></label>
            <label class="admin-field field-wide"><span>Display name</span><input v-model.trim="form.name" required maxlength="160"></label>
            <label class="admin-field"><span>Host / IP</span><input v-model.trim="form.host" required></label>
            <label class="admin-field"><span>Query port</span><input v-model.number="form.port" type="number" min="1" max="65535" required></label>
            <label class="admin-field field-wide"><span>Location</span><input v-model.trim="form.location" maxlength="160" placeholder="Frankfurt"></label>
          </div>
          <div class="admin-divider"></div>
          <div class="server-toggles">
            <label class="admin-toggle"><input v-model="form.enabled" type="checkbox"> Show on website</label>
            <label class="admin-toggle"><input v-model="form.comingSoon" type="checkbox"> Mark coming soon</label>
            <label class="admin-toggle"><input v-model="form.discordPublishEnabled" type="checkbox"> Publish to Discord</label>
          </div>
          <p class="connect-preview"><span>Connect URI</span>{{ connectUrl || 'Enter a valid host and port' }}</p>
          <div class="admin-actions">
            <button class="admin-button admin-button-primary" :disabled="saving">{{ saving ? 'Saving…' : 'Save server' }}</button>
            <button type="button" class="admin-button admin-button-secondary" @click="closeModal">Cancel</button>
          </div>
        </div>
      </form>
    </div>

    <div v-if="deleteTarget" class="admin-modal-backdrop" @click.self="deleteTarget = null">
      <section class="admin-modal admin-modal--small" role="alertdialog" aria-modal="true" aria-labelledby="delete-server-title">
        <div class="admin-panel__body">
          <span class="admin-eyebrow">Destructive action</span>
          <h2 id="delete-server-title">Delete {{ deleteTarget.server.name }}?</h2>
          <p>This removes the server from the website and Discord publishing registry. It does not modify the game server itself.</p>
          <div class="admin-actions">
            <button class="admin-button admin-button-danger" :disabled="deleting" @click="confirmDelete">{{ deleting ? 'Deleting…' : 'Delete server' }}</button>
            <button class="admin-button admin-button-secondary" @click="deleteTarget = null">Cancel</button>
          </div>
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup>
definePageMeta({ layout: false })

const { getServers, addServer, updateServer, deleteServer } = useAdmin()
const { getServerState, forceRefreshAll, isLoading: statusLoading } = useServerStatus()
const servers = ref([])
const loading = ref(false)
const error = ref('')
const modalOpen = ref(false)
const modalError = ref('')
const editingIndex = ref(null)
const saving = ref(false)
const deleting = ref(false)
const deleteTarget = ref(null)
const blankForm = () => ({ id: '', name: '', host: '', port: 27015, location: '', enabled: true, comingSoon: false, displayOrder: 0, discordPublishEnabled: true })
const form = ref(blankForm())

const connectUrl = computed(() => {
  if (!form.value.host || !form.value.port) return ''
  const host = form.value.host.includes(':') && !form.value.host.startsWith('[') ? `[${form.value.host}]` : form.value.host
  return `steam://connect/${host}:${form.value.port}`
})
const onlineCount = computed(() => servers.value.filter(server => getServerState(server.id)?.status === 'online').length)

function statusLabel(server) {
  if (server.comingSoon) return 'Coming soon'
  if (!server.enabled) return 'Disabled'
  const state = getServerState(server.id)
  if (state?.status === 'online') return `Online · ${state.numplayers ?? state.players?.length ?? 0}/${state.maxplayers ?? '—'}`
  if (state?.status === 'offline') return 'Offline'
  if (state?.isQuerying || state?.status === 'checking') return 'Checking'
  return 'Unknown'
}

function statusClass(id) {
  const status = getServerState(id)?.status
  if (status === 'online') return 'admin-status--online'
  if (status === 'offline') return 'admin-status--error'
  return 'admin-status--warning'
}

async function loadServers() {
  loading.value = true
  error.value = ''
  try {
    const result = await getServers()
    servers.value = result.servers || []
  } catch (failure) {
    error.value = failure?.data?.message || failure?.data?.statusMessage || 'Server registry could not be loaded.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingIndex.value = null
  form.value = { ...blankForm(), displayOrder: servers.value.length }
  modalError.value = ''
  modalOpen.value = true
}

function openEdit(index, server) {
  editingIndex.value = index
  form.value = { ...blankForm(), ...server }
  modalError.value = ''
  modalOpen.value = true
}

function closeModal() { modalOpen.value = false }

async function saveServer() {
  saving.value = true
  modalError.value = ''
  try {
    const payload = { ...form.value, connectUrl: connectUrl.value }
    if (editingIndex.value === null) await addServer(payload)
    else await updateServer(editingIndex.value, payload)
    await loadServers()
    closeModal()
  } catch (failure) {
    modalError.value = failure?.data?.message || failure?.data?.statusMessage || 'Server could not be saved.'
  } finally {
    saving.value = false
  }
}

function requestDelete(index, server) { deleteTarget.value = { index, server } }
async function confirmDelete() {
  deleting.value = true
  try {
    await deleteServer(deleteTarget.value.index)
    deleteTarget.value = null
    await loadServers()
  } catch (failure) {
    error.value = failure?.data?.message || failure?.data?.statusMessage || 'Server could not be deleted.'
  } finally {
    deleting.value = false
  }
}

onMounted(loadServers)
</script>

<style scoped>
.header-actions { margin-top: 0; }
.server-name, .server-meta { display: block; }
.server-name { color: #f0eef7; font-size: .83rem; }
.server-meta { margin-top: .2rem; color: var(--admin-muted); font-size: .68rem; }
.row-actions { display: flex; justify-content: flex-end; gap: .8rem; font-size: .73rem; }
.row-actions button { color: var(--admin-accent); }
.row-actions .danger { color: #fb9ca6; }
.registry-note { display: grid; grid-template-columns: 11rem 1fr auto; align-items: center; gap: 1rem; margin-top: 1rem; padding: 1.1rem 1.25rem; border: 1px solid var(--admin-line); }
.registry-note p { color: var(--admin-muted); font-size: .76rem; }
.registry-note a { color: var(--admin-accent); font-size: .75rem; }
.admin-modal-backdrop { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; overflow-y: auto; background: rgb(0 0 0 / .78); padding: 1rem; }
.admin-modal { width: min(100%, 46rem); border: 1px solid var(--admin-line-strong); background: #111114; box-shadow: 0 2rem 7rem rgb(0 0 0 / .65); }
.admin-modal--small { width: min(100%, 30rem); }
.admin-modal h2 { margin-top: .35rem; font-size: 1.4rem; }
.admin-modal p { margin-top: .75rem; color: var(--admin-muted); font-size: .8rem; }
.modal-close { color: var(--admin-muted); font-size: 1.5rem; line-height: 1; }
.field-wide { grid-column: 1 / -1; }
.server-toggles { display: flex; flex-wrap: wrap; gap: 1.2rem; }
.connect-preview { display: grid; gap: .35rem; margin-top: 1.3rem; padding: .8rem; border: 1px solid var(--admin-line); font-family: var(--font-mono); word-break: break-all; }
.connect-preview span { color: var(--admin-muted); font-size: .6rem; letter-spacing: .1em; text-transform: uppercase; }
@media (max-width: 900px) { .registry-note { grid-template-columns: 1fr; } }
</style>
