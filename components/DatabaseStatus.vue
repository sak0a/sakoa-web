<template>
  <section class="database-console" aria-labelledby="database-heading">
    <div class="database-console__header">
      <div>
        <h3 id="database-heading">Connection</h3>
        <p>Runtime configuration and the most recent connectivity check.</p>
      </div>
      <span :class="['admin-status', statusClass]">{{ statusText }}</span>
    </div>

    <div v-if="message" :class="['admin-notice', messageType === 'success' ? 'admin-notice--success' : 'admin-notice--error']" role="status">
      {{ message }}
    </div>

    <div v-if="dbStatus" class="database-details">
      <dl>
        <div><dt>Host</dt><dd>{{ dbStatus.connection.host }}</dd></div>
        <div><dt>Port</dt><dd>{{ dbStatus.connection.port }}</dd></div>
        <div><dt>Database</dt><dd>{{ dbStatus.connection.database }}</dd></div>
        <div><dt>User</dt><dd>{{ dbStatus.connection.user }}</dd></div>
      </dl>
      <dl>
        <div><dt>State</dt><dd>{{ statusText }}</dd></div>
        <div><dt>Last check</dt><dd>{{ formatTimestamp(dbStatus.connection.timestamp) }}</dd></div>
        <div v-if="dbStatus.error" class="database-error"><dt>Error</dt><dd>{{ dbStatus.error.message }}</dd></div>
      </dl>
    </div>
    <div v-else class="admin-empty">No connection state has been returned yet.</div>

    <div class="database-actions" aria-label="Database connection actions">
      <button type="button" class="admin-button admin-button-primary" :disabled="isLoading" @click="testConnection">
        {{ isLoading && currentAction === 'test' ? 'Testing…' : 'Test connection' }}
      </button>
      <button type="button" class="admin-button admin-button-secondary" :disabled="isLoading" @click="retryConnection">
        {{ isLoading && currentAction === 'retry' ? 'Retrying…' : 'Retry connection' }}
      </button>
      <button type="button" class="admin-button admin-button-secondary" :disabled="isLoading" @click="refreshStatus">
        {{ isLoading && currentAction === 'refresh' ? 'Refreshing…' : 'Refresh state' }}
      </button>
      <button type="button" class="admin-button admin-button-secondary" :disabled="isLoading" @click="reloadConfig">
        {{ isLoading && currentAction === 'reload' ? 'Reloading…' : 'Reload environment' }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const { getDatabaseStatus, testDatabaseConnection, retryDatabaseConnection, reloadDatabaseConfig } = useAdmin()

const dbStatus = ref(null)
const isLoading = ref(false)
const currentAction = ref('')
const message = ref('')
const messageType = ref('success')

const statusText = computed(() => {
  const status = dbStatus.value?.connection?.status
  if (status === 'connected') return 'Connected'
  if (status === 'failed') return 'Failed'
  if (status === 'disconnected') return 'Disconnected'
  return 'Unknown'
})

const statusClass = computed(() => {
  const status = dbStatus.value?.connection?.status
  if (status === 'connected') return 'admin-status--online'
  if (status === 'failed') return 'admin-status--error'
  return 'admin-status--warning'
})

const formatTimestamp = timestamp => timestamp
  ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(timestamp))
  : 'Never'

const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => { message.value = '' }, 5000)
}

const runAction = async (action, operation, successMessage, failureMessage) => {
  isLoading.value = true
  currentAction.value = action
  try {
    const result = await operation()
    if (result?.success === false) throw new Error('Operation rejected')
    showMessage(successMessage)
    if (action !== 'refresh') dbStatus.value = await getDatabaseStatus()
    else dbStatus.value = result
  } catch (error) {
    console.error(failureMessage, error)
    showMessage(failureMessage, 'error')
  } finally {
    isLoading.value = false
    currentAction.value = ''
  }
}

const refreshStatus = () => runAction('refresh', getDatabaseStatus, 'Database state refreshed.', 'Database state could not be refreshed.')
const testConnection = () => runAction('test', testDatabaseConnection, 'Database connection test passed.', 'Database connection test failed.')
const retryConnection = () => runAction('retry', retryDatabaseConnection, 'Database connection restored.', 'Database connection could not be restored.')
const reloadConfig = () => runAction('reload', reloadDatabaseConfig, 'Database environment reloaded.', 'Database environment could not be reloaded.')

onMounted(refreshStatus)
</script>

<style scoped>
.database-console { display: grid; gap: 1rem; }
.database-console__header { display: flex; align-items: start; justify-content: space-between; gap: 1rem; }
.database-console__header h3 { margin: 0; font-size: .95rem; font-weight: 650; }
.database-console__header p { margin: .3rem 0 0; color: var(--admin-muted); font-size: .75rem; }
.database-details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border: 1px solid var(--admin-line); background: #0c0c0f; }
.database-details dl { margin: 0; padding: .7rem 1rem; }
.database-details dl + dl { border-left: 1px solid var(--admin-line); }
.database-details dl div { display: grid; grid-template-columns: 7rem minmax(0, 1fr); gap: 1rem; padding: .55rem 0; border-bottom: 1px solid var(--admin-line); }
.database-details dl div:last-child { border-bottom: 0; }
.database-details dt { color: var(--admin-muted); font-size: .72rem; }
.database-details dd { overflow: hidden; margin: 0; color: #dedce5; font-family: var(--font-mono); font-size: .72rem; text-align: right; text-overflow: ellipsis; white-space: nowrap; }
.database-details .database-error { display: block; }
.database-error dd { margin-top: .6rem; color: #fecaca; text-align: left; white-space: normal; }
.database-actions { display: flex; flex-wrap: wrap; gap: .55rem; padding-top: .25rem; }
@media (max-width: 760px) {
  .database-details { grid-template-columns: 1fr; }
  .database-details dl + dl { border-top: 1px solid var(--admin-line); border-left: 0; }
}
@media (max-width: 480px) {
  .database-console__header { flex-direction: column; }
  .database-actions { display: grid; grid-template-columns: 1fr; }
}
</style>
