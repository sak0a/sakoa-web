<template>
  <AdminLayout><div class="admin-page tf2-page">
    <header class="admin-page-header"><div><span class="admin-eyebrow">Operate / Pterodactyl</span><h1>Server operations.</h1><p>Inspect server resources, edit configs with backups, and send deliberate commands.</p></div><a href="https://panel.f.sakoa.xyz" target="_blank" rel="noopener" class="admin-button admin-button-secondary">Open live console ↗</a></header>
    <div v-if="error" class="admin-notice admin-notice--error" role="alert">{{ error }} <a href="/api/auth/steam?admin=1">Sign in through Steam</a></div>
    <div v-if="notice" class="admin-notice" role="status">{{ notice }}</div>
    <section class="admin-panel"><div class="admin-panel__header"><h2>Server</h2><div class="admin-actions"><select v-model="sid" aria-label="Select server" :disabled="busy" @change="changeServer"><option value="">Choose a server</option><option v-for="server in servers" :key="server.sid" :value="String(server.sid)">#{{ server.sid }} · {{ server.ip }}:{{ server.port }}</option></select><button class="admin-button admin-button-secondary" :disabled="!sid || loading || busy" @click="loadStatus">Refresh</button></div></div><div class="admin-panel__body"><p v-if="selectedServer && !selectedServer.hasPterodactyl">Pterodactyl is not connected for this server. Configure its Client API key and server mapping in Coolify.</p><div v-if="status" class="tf2-status"><span>State <strong>{{ status.current_state }}</strong></span><span>CPU {{ Number(status.resources?.cpu_absolute || 0).toFixed(1) }}%</span><span>RAM {{ formatBytes(status.resources?.memory_bytes) }}</span><span>Disk {{ formatBytes(status.resources?.disk_bytes) }}</span><span>Uptime {{ Math.floor((status.resources?.uptime || 0) / 60000) }} min</span></div><p v-else>{{ loading ? 'Loading status…' : 'Select a connected server.' }}</p></div></section>
    <template v-if="selectedServer?.hasPterodactyl">
      <section class="admin-panel"><div class="admin-panel__header"><h2>Configuration files</h2><div class="admin-actions"><button class="admin-button admin-button-secondary" :disabled="busy" @click="browse('/tf/cfg')">TF2 configs</button><button class="admin-button admin-button-secondary" :disabled="busy" @click="browse('/tf/addons/sourcemod/configs')">SourceMod configs</button></div></div><div class="admin-panel__body">
        <form class="tf2-filters" @submit.prevent="browse(directory)"><input v-model="directory" aria-label="Configuration directory"><button class="admin-button admin-button-secondary" :disabled="busy">Browse</button><button type="button" class="admin-button admin-button-secondary" :disabled="busy || atRoot" @click="browse(directory.slice(0, directory.lastIndexOf('/')))">Up</button></form>
        <div class="tf2-files"><button v-for="file in files" :key="file.name" class="admin-button admin-button-secondary" :disabled="busy" @click="file.isDirectory ? browse(`${directory}/${file.name}`) : openFile(`${directory}/${file.name}`)">{{ file.isDirectory ? '↳ ' : '' }}{{ file.name }}</button></div>
        <p v-if="!files.length">No editable files loaded.</p>
      </div></section>
      <section v-if="opened" class="admin-panel"><div class="admin-panel__header"><div><h2>{{ opened.path }}</h2><p>{{ dirty ? 'Unsaved changes' : 'Matches loaded revision' }} · saving does not execute this file</p></div><button class="admin-button admin-button-secondary" :disabled="busy" @click="openFile(opened.path)">Reload file</button></div><div class="admin-panel__body tf2-editor">
        <div v-if="settings.length" class="admin-form-grid"><label v-for="setting in settings" :key="setting.line" class="admin-field"><span>{{ setting.key }}</span><input :value="setting.value" :disabled="busy" @change="updateSetting(setting, $event.target.value)"></label></div>
        <label class="admin-field"><span>Raw configuration</span><textarea v-model="content" spellcheck="false" :disabled="busy" aria-label="Raw configuration"></textarea></label>
        <div v-if="dirty"><h3>Change preview</h3><pre class="tf2-diff"><template v-for="(line, i) in diff" :key="i"><span :class="line.kind">{{ line.text }}
</span></template></pre></div>
        <div class="admin-actions"><button class="admin-button admin-button-primary" :disabled="busy || !dirty" @click="reviewSave">Review save</button><button class="admin-button admin-button-secondary" :disabled="busy || !dirty" @click="content = opened.content">Discard local changes</button></div>
        <p v-if="lastBackup">Original preserved as {{ lastBackup }} <button class="admin-button admin-button-secondary" :disabled="busy" @click="reviewRestore">Review rollback</button></p>
      </div></section>
      <section class="admin-panel"><div class="admin-panel__header"><h2>Console command</h2></div><form class="admin-panel__body" @submit.prevent="reviewCommand"><label class="admin-field"><span>Single command</span><input v-model="command" required maxlength="1000" placeholder="status" :disabled="busy" autocomplete="off"></label><p>Commands run with server-console privileges. Results appear in the Pterodactyl live console.</p><button class="admin-button admin-button-secondary" :disabled="busy || !command.trim()">Review command</button></form></section>
      <section class="admin-panel"><div class="admin-panel__header"><h2>Power and backups</h2></div><div class="admin-panel__body"><div class="admin-actions"><button v-for="signal in ['start','stop','restart']" :key="signal" class="admin-button admin-button-secondary" :disabled="busy" @click="reviewPower(signal)">{{ signal }}</button><button class="admin-button admin-button-secondary" :disabled="busy" @click="pending = { action: 'backup', sid, operationId: cryptoId() }">Create backup</button><button class="admin-button admin-button-secondary" :disabled="busy" @click="loadBackups">Refresh backups</button></div><ul><li v-for="backup in backups" :key="backup.uuid">{{ backup.name }} · {{ backup.completed_at ? backup.is_successful ? 'Complete' : 'Failed' : 'In progress' }} · {{ formatBytes(backup.bytes) }}</li></ul></div></section>
      <section v-if="pending" class="admin-panel tf2-review" aria-label="Review server operation"><div class="admin-panel__body"><h2>Confirm {{ pending.signal || pending.action }} on server #{{ pending.sid }}</h2><p v-if="pending.action === 'command'" class="admin-code">{{ pending.command }}</p><p v-if="['save','restore'].includes(pending.action)">{{ pending.path }} · the current file is backed up before writing. No config execution or server restart.</p><label v-if="pending.action === 'power'" class="admin-field"><span>This can interrupt connected players. Type server ID {{ pending.sid }} to confirm.</span><input v-model="pending.confirm" autocomplete="off"></label><div class="admin-actions"><button class="admin-button admin-button-primary" :disabled="busy || (pending.action === 'power' && pending.confirm !== String(pending.sid))" @click="execute">{{ busy ? 'Working…' : 'Confirm operation' }}</button><button class="admin-button admin-button-secondary" :disabled="busy" @click="pending = null">Cancel</button></div></div></section>
    </template>
    <section class="admin-panel"><div class="admin-panel__header"><h2>Recent actions</h2><button class="admin-button admin-button-secondary" :disabled="busy" @click="loadOverview">Refresh activity</button></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>When</th><th>Actor SteamID</th><th>Action</th><th>Result</th></tr></thead><tbody><tr v-for="operation in operations" :key="operation.id"><td>{{ new Date(operation.created_at).toLocaleString() }}</td><td>{{ operation.actor_steam64 }}</td><td>{{ operation.action }}</td><td>{{ operation.status }}{{ operationPartial(operation) ? ' · needs attention' : '' }}</td></tr><tr v-if="!operations.length"><td colspan="4" class="admin-empty">No operations recorded.</td></tr></tbody></table></div></section>
  </div></AdminLayout>
</template>

<script setup>
const { adminFetch } = useAdmin()
const servers = ref([]), operations = ref([]), backups = ref([]), files = ref([])
const sid = ref(''), previousSid = ref(''), directory = ref('/tf/cfg'), content = ref(''), command = ref(''), error = ref(''), notice = ref(''), lastBackup = ref('')
const opened = ref(null), pending = ref(null), status = ref(null), busy = ref(false), loading = ref(false)
const selectedServer = computed(() => servers.value.find(s => String(s.sid) === sid.value))
const dirty = computed(() => opened.value && opened.value.content !== content.value)
const atRoot = computed(() => ['/tf/cfg', '/tf/addons/sourcemod/configs'].includes(directory.value))
const settings = computed(() => content.value.split('\n').map((text, line) => {
  const match = /^([a-zA-Z_][\w.]*)\s+"([^"\r\n]*)"\s*(\/\/.*)?$/.exec(text.trim())
  return match ? { key: match[1], value: match[2], comment: match[3] || '', line } : null
}).filter(Boolean).filter(s => !/password|token|secret|key/i.test(s.key)).slice(0, 40))
const diff = computed(() => {
  const old = (opened.value?.content || '').split('\n'), current = content.value.split('\n'), changes = []
  for (let i = 0; i < Math.max(old.length, current.length); i++) if (old[i] !== current[i]) {
    if (old[i] !== undefined) changes.push({ kind: 'removed', text: `− ${i + 1}: ${old[i]}` })
    if (current[i] !== undefined) changes.push({ kind: 'added', text: `+ ${i + 1}: ${current[i]}` })
  }
  return changes
})
const cryptoId = () => crypto.randomUUID()
const formatBytes = value => `${((Number(value) || 0) / 1024 / 1024).toFixed(1)} MB`
const message = e => e?.data?.statusMessage || e?.message || 'Request failed'
const operationPartial = op => { try { return (typeof op.result_json === 'string' ? JSON.parse(op.result_json) : op.result_json)?.partial } catch { return false } }
let generation = 0
async function loadOverview() { try { const data = await adminFetch('/api/admin/tf2'); servers.value = data.servers; operations.value = data.operations } catch (e) { error.value = message(e) } }
async function loadStatus() {
  if (!sid.value) return
  const current = generation; loading.value = true
  try { const data = await adminFetch('/api/admin/tf2/operations', { query: { sid: sid.value, view: 'status' } }); if (current === generation) status.value = data.attributes }
  catch (e) { if (current === generation) error.value = message(e) }
  finally { if (current === generation) loading.value = false }
}
async function changeServer() {
  if (dirty.value && !window.confirm('Discard unsaved config changes and switch servers?')) { sid.value = previousSid.value; return }
  previousSid.value = sid.value
  generation++; status.value = null; opened.value = null; files.value = []; backups.value = []; pending.value = null; lastBackup.value = ''; content.value = ''; error.value = ''; notice.value = ''; if (selectedServer.value?.hasPterodactyl) await loadStatus()
}
async function browse(path) {
  busy.value = true; error.value = ''
  try { const data = await adminFetch('/api/admin/tf2/operations', { query: { sid: sid.value, view: 'files', directory: path } }); directory.value = data.directory; files.value = data.files }
  catch (e) { error.value = message(e) } finally { busy.value = false }
}
async function openFile(path) {
  if (dirty.value && !window.confirm('Discard unsaved changes and load this file?')) return
  busy.value = true; error.value = ''; pending.value = null
  try { opened.value = await adminFetch('/api/admin/tf2/operations', { query: { sid: sid.value, view: 'file', path } }); content.value = opened.value.content; lastBackup.value = '' }
  catch (e) { error.value = message(e) } finally { busy.value = false }
}
function updateSetting(setting, value) {
  if (/["\r\n;]/.test(value)) { error.value = 'Use the raw editor for values containing quotes, semicolons, or newlines'; return }
  const lines = content.value.split('\n'); lines[setting.line] = `${setting.key} "${value}" ${setting.comment}`.trimEnd(); content.value = lines.join('\n'); pending.value = null
}
function reviewSave() { pending.value = { action: 'save', sid: sid.value, path: opened.value.path, revision: opened.value.revision, content: content.value, operationId: cryptoId() } }
function reviewRestore() { pending.value = { action: 'restore', sid: sid.value, path: opened.value.path, revision: opened.value.revision, backup: lastBackup.value, operationId: cryptoId() } }
function reviewCommand() { pending.value = { action: 'command', sid: sid.value, command: command.value, operationId: cryptoId() } }
function reviewPower(signal) { pending.value = { action: 'power', sid: sid.value, signal, confirm: '', operationId: cryptoId() } }
async function loadBackups() { try { const response = await adminFetch('/api/admin/tf2/operations', { query: { sid: sid.value, view: 'backups' } }); backups.value = response.data.map(b => b.attributes) } catch (e) { error.value = message(e) } }
async function execute() {
  busy.value = true; error.value = ''; notice.value = ''
  const action = pending.value
  try {
    const response = await adminFetch('/api/admin/tf2/operations', { method: 'POST', body: action })
    notice.value = response.message; pending.value = null
    if (response.backup && ['save','restore'].includes(action.action)) lastBackup.value = response.backup
    if (response.saved && ['save','restore'].includes(action.action)) { opened.value = await adminFetch('/api/admin/tf2/operations', { query: { sid: sid.value, view: 'file', path: action.path } }); content.value = opened.value.content }
    await loadOverview()
    if (action.action === 'backup') await loadBackups()
  } catch (e) { error.value = message(e) }
  finally { busy.value = false }
}
watch(content, () => { if (pending.value?.action === 'save' && pending.value.content !== content.value) pending.value = null })
watch(pending, async value => { if (value) { await nextTick(); document.querySelector('.tf2-review')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) } })
onBeforeRouteLeave(() => !dirty.value || window.confirm('Leave and discard unsaved config changes?'))
onMounted(loadOverview)
</script>
