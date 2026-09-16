<template>
  <AdminLayout><div class="admin-page tf2-page">
    <header class="admin-page-header"><div><span class="admin-eyebrow">Operate / SourceBans</span><h1>Moderation.</h1><p>Live players, shared punishment history, and clear delivery status.</p></div><a class="admin-button admin-button-secondary" href="https://sbpp.sakoa.xyz" target="_blank" rel="noopener">Open SourceBans ↗</a></header>
    <div v-if="error" class="admin-notice admin-notice--error" role="alert">{{ error }} <a href="/api/auth/steam?admin=1">Sign in through Steam</a></div>
    <div v-if="result" class="admin-notice" role="status"><strong>{{ result.partial ? 'Saved action needs attention.' : result.saved ? 'Punishment records saved.' : 'Command sent.' }}</strong><p v-if="result.message">{{ result.message }}</p><ul v-if="result.deliveries"><li v-for="delivery in result.deliveries" :key="delivery.sid">Server {{ delivery.sid || 'lookup' }}: {{ delivery.status }}{{ delivery.message ? ` — ${delivery.message}` : '' }}</li></ul><p v-if="result.partial">Refresh the history and use “Reconcile” on the record to retry live enforcement.</p></div>
    <section class="admin-panel">
      <div class="admin-panel__header"><div><h2>Connected players</h2><p>Names and Steam identities come from the game server.</p></div><div class="admin-actions"><select v-model="sid" aria-label="Game server" @change="loadPlayers"><option value="">Select server</option><option v-for="server in servers" :key="server.sid" :value="String(server.sid)">#{{ server.sid }} · {{ server.ip }}:{{ server.port }}</option></select><button class="admin-button admin-button-secondary" :disabled="!sid || playersLoading" @click="loadPlayers">{{ playersLoading ? 'Querying…' : 'Refresh players' }}</button></div></div>
      <p v-if="playerError" class="admin-notice admin-notice--error" role="alert">{{ playerError }}</p>
      <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Player</th><th>SteamID</th><th>Ping</th><th>Action</th></tr></thead><tbody><tr v-for="player in players" :key="player.steam64"><td>{{ player.name }}</td><td class="admin-code">{{ player.steam3 }}</td><td>{{ player.ping }}</td><td><button class="admin-button admin-button-secondary" @click="choose(player)">Moderate</button></td></tr><tr v-if="!players.length"><td colspan="4" class="admin-empty">{{ playersLoading ? 'Loading players…' : sid ? 'No verified players loaded.' : 'Select a server to query players.' }}</td></tr></tbody></table></div>
    </section>
    <section class="admin-panel"><div class="admin-panel__header"><h2>{{ revoke ? `Revoke ${revoke.kind} #${revoke.bid}` : 'New action' }}</h2><button v-if="revoke" class="admin-button admin-button-secondary" @click="resetForm">Cancel revocation</button></div>
      <form class="admin-panel__body" @submit.prevent="reviewAction">
        <div class="admin-form-grid">
          <label class="admin-field"><span>SteamID</span><input v-model="form.steamId" required :readonly="Boolean(revoke)" placeholder="Steam2, Steam3, or SteamID64"></label>
          <label v-if="!revoke" class="admin-field"><span>Player name</span><input v-model="form.name" maxlength="128" placeholder="Optional"></label>
          <label v-if="!revoke" class="admin-field"><span>Action</span><select v-model="form.kind"><option value="ban">Ban</option><option value="kick">Kick from selected server</option><option value="mute">Mute voice</option><option value="gag">Gag chat</option><option value="silence">Silence voice and chat</option></select></label>
          <label v-if="!revoke && form.kind !== 'kick'" class="admin-field"><span>Duration in minutes (0 = permanent)</span><input v-model.number="form.minutes" required type="number" min="0" max="525600"></label>
          <label class="admin-field"><span>Reason</span><input v-model="form.reason" required maxlength="160" placeholder="Required for the audit trail"></label>
        </div>
        <p>Persistent bans and communication blocks use the shared SourceBans database. Live enforcement is attempted on both servers.</p>
        <button class="admin-button admin-button-primary" :disabled="busy">Review action</button>
      </form>
    </section>
    <section v-if="pending" class="admin-panel tf2-review" aria-label="Review moderation action"><div class="admin-panel__body"><h2>Confirm {{ pending.action === 'revoke' ? 'revocation' : pending.kind }}</h2><p><strong>{{ pending.name || pending.steamId }}</strong> · {{ pending.steamId }}</p><p>{{ pending.reason }}</p><p v-if="pending.action === 'create'">{{ pending.minutes === 0 ? 'Permanent' : `${pending.minutes} minutes` }} · shared across servers</p><p v-if="pending.action === 'kick'">Only server #{{ pending.sid }}</p><div class="admin-actions"><button class="admin-button admin-button-primary" :disabled="busy" @click="submitPending">{{ busy ? 'Applying…' : 'Confirm action' }}</button><button class="admin-button admin-button-secondary" :disabled="busy" @click="pending = null">Cancel</button></div></div></section>
    <section class="admin-panel"><div class="admin-panel__header"><div><h2>Punishment history</h2><p>{{ total }} matching records</p></div></div>
      <form class="admin-panel__body tf2-filters" @submit.prevent="page = 1; loadHistory()"><select v-model="kind" aria-label="History type"><option value="bans">Bans</option><option value="comms">Communication blocks</option></select><input v-model="search" aria-label="Search history" placeholder="Name, reason, or SteamID"><label><input v-model="active" type="checkbox"> Active only</label><button class="admin-button admin-button-secondary" :disabled="historyLoading">Search</button></form>
      <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Player / ID</th><th>Reason</th><th>Duration</th><th>Admin</th><th>Status</th><th>Actions</th></tr></thead><tbody><tr v-for="row in rows" :key="row.bid"><td><strong>{{ row.name || 'Unnamed' }}</strong><small>{{ row.authid }} · #{{ row.bid }}</small></td><td>{{ row.reason }}<small>{{ new Date(row.created * 1000).toLocaleString() }}</small></td><td>{{ Number(row.length) ? `${Math.round(row.length / 60)} min` : 'Permanent' }}<small v-if="loadedKind === 'comms'">{{ Number(row.type) === 1 ? 'Voice mute' : 'Chat gag' }}</small></td><td>{{ row.admin || 'Console' }}</td><td>{{ row.active ? 'Active' : row.RemoveType === 'U' ? 'Revoked' : 'Expired / removed' }}</td><td><div class="admin-actions"><button v-if="row.active" class="admin-button admin-button-secondary" :disabled="busy" @click="prepareRevoke(row)">Revoke</button><button class="admin-button admin-button-secondary" :disabled="busy" @click="reconcile(row)">Reconcile</button></div></td></tr><tr v-if="!rows.length"><td colspan="6" class="admin-empty">{{ historyLoading ? 'Loading history…' : 'No matching punishments.' }}</td></tr></tbody></table></div>
      <div class="admin-panel__body admin-actions"><button class="admin-button admin-button-secondary" :disabled="page <= 1 || historyLoading" @click="page--; loadHistory()">Previous</button><span>Page {{ page }}</span><button class="admin-button admin-button-secondary" :disabled="page * 30 >= total || historyLoading" @click="page++; loadHistory()">Next</button></div>
    </section>
  </div></AdminLayout>
</template>

<script setup>
const { adminFetch } = useAdmin()
const servers = ref([]), players = ref([]), rows = ref([])
const sid = ref(''), kind = ref('bans'), loadedKind = ref('bans'), search = ref(''), active = ref(false), page = ref(1), total = ref(0)
const error = ref(''), playerError = ref(''), result = ref(null), pending = ref(null), revoke = ref(null)
const busy = ref(false), playersLoading = ref(false), historyLoading = ref(false)
const form = reactive({ steamId: '', name: '', kind: 'ban', minutes: 60, reason: '' })
const message = e => e?.data?.statusMessage || e?.message || 'Request failed'
let playerRequest = 0
async function loadPlayers() {
  const request = ++playerRequest
  players.value = []; playerError.value = ''
  if (!sid.value) return
  playersLoading.value = true
  try { const data = await adminFetch('/api/admin/tf2/moderation', { query: { view: 'players', sid: sid.value } }); if (request === playerRequest) players.value = data.players }
  catch (e) { if (request === playerRequest) playerError.value = message(e) }
  finally { if (request === playerRequest) playersLoading.value = false }
}
async function loadHistory() {
  historyLoading.value = true
  try { const selectedKind = kind.value; const data = await adminFetch('/api/admin/tf2/moderation', { query: { kind: selectedKind, search: search.value, active: String(active.value), page: page.value } }); rows.value = data.rows; total.value = data.total; loadedKind.value = selectedKind }
  catch (e) { error.value = message(e) }
  finally { historyLoading.value = false }
}
function choose(player) { revoke.value = null; form.steamId = player.steam64; form.name = player.name; pending.value = null }
function resetForm() { revoke.value = null; pending.value = null; form.reason = '' }
function prepareRevoke(row) { revoke.value = { bid: row.bid, kind: loadedKind.value }; form.steamId = row.authid; form.name = row.name; form.reason = ''; pending.value = null }
function reviewAction() {
  error.value = ''
  if (!revoke.value && form.kind === 'kick' && !sid.value) { error.value = 'Select a server to kick from'; return }
  pending.value = { ...form, ...(revoke.value || {}), sid: sid.value, action: revoke.value ? 'revoke' : form.kind === 'kick' ? 'kick' : 'create', operationId: crypto.randomUUID() }
}
async function perform(body) {
  busy.value = true; error.value = ''; result.value = null
  try { result.value = await adminFetch('/api/admin/tf2/moderation', { method: 'POST', body }); pending.value = null; revoke.value = null; await loadHistory() }
  catch (e) { error.value = message(e) }
  finally { busy.value = false }
}
const submitPending = () => perform(pending.value)
const reconcile = row => perform({ action: 'reconcile', kind: loadedKind.value, bid: row.bid, operationId: crypto.randomUUID() })
watch(form, () => { pending.value = null }, { deep: true })
watch(pending, async value => { if (value) { await nextTick(); document.querySelector('.tf2-review')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) } })
onMounted(async () => {
  try { const data = await adminFetch('/api/admin/tf2'); servers.value = data.servers; await loadHistory() } catch (e) { error.value = message(e) }
})
</script>
