<template>
  <main class="maintenance-page">
    <div class="maintenance-frame">
      <header>
        <img src="/default-512x512.png" alt="" width="40" height="40">
        <span>saka / system notice</span>
      </header>

      <section aria-labelledby="maintenance-title" aria-live="polite">
        <div class="maintenance-code">503</div>
        <div class="maintenance-copy">
          <p class="maintenance-kicker"><span /> Scheduled pause</p>
          <h1 id="maintenance-title">{{ maintenanceData?.title || 'The arena is between rounds.' }}</h1>
          <p>{{ maintenanceData?.message || 'We are performing maintenance. Please check back soon.' }}</p>

          <dl v-if="maintenanceData?.estimatedTime || maintenanceData?.lastUpdated">
            <div v-if="maintenanceData?.estimatedTime"><dt>Estimated return</dt><dd>{{ maintenanceData.estimatedTime }}</dd></div>
            <div v-if="maintenanceData?.lastUpdated"><dt>Notice updated</dt><dd>{{ formatDate(maintenanceData.lastUpdated) }}</dd></div>
          </dl>

          <p v-if="statusError" class="status-error" role="alert">{{ statusError }}</p>
          <div class="maintenance-actions">
            <button type="button" :disabled="isChecking" @click="checkStatus">{{ isChecking ? 'Checking status…' : 'Check status' }} <span aria-hidden="true">↻</span></button>
            <a :href="discordUrl" target="_blank" rel="noopener noreferrer">Community updates <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>

      <footer><span>Team Fortress 2</span><span>Frankfurt, DE</span><span>Automatic status check available</span></footer>
    </div>
  </main>
</template>

<script setup>
definePageMeta({ layout: false })

const maintenanceData = ref(null)
const isChecking = ref(false)
const statusError = ref('')
const discordUrl = ref('https://discord.gg/JuxYYVEkzc')

const loadMaintenanceData = async () => {
  statusError.value = ''
  try {
    const [status, settings] = await Promise.all([
      $fetch('/api/maintenance-status'),
      $fetch('/api/settings').catch(() => null),
    ])
    maintenanceData.value = status.maintenance
    discordUrl.value = settings?.data?.discord?.inviteUrl || discordUrl.value
  } catch {
    statusError.value = 'The status service did not respond. Please try again shortly.'
  }
}

const checkStatus = async () => {
  isChecking.value = true
  await loadMaintenanceData()
  if (maintenanceData.value && !maintenanceData.value.enabled) await navigateTo('/')
  isChecking.value = false
}
const formatDate = value => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-GB', { timeZone: 'Europe/Berlin' })
}

onMounted(loadMaintenanceData)
useHead({
  title: 'Maintenance',
  meta: [{ name: 'description', content: 'saka\'s Dodgeball Server is currently under maintenance.' }],
})
</script>

<style scoped>
.maintenance-page { min-height: 100dvh; display: grid; place-items: center; padding: 1rem; color: var(--arena-text); background: var(--arena-ink); }.maintenance-frame { position: relative; width: min(100%, 72rem); border: 1px solid var(--arena-line-strong); background: #0e0d11; }.maintenance-frame > header, .maintenance-frame > footer { display: flex; align-items: center; gap: 1rem; padding: .8rem 1rem; color: var(--arena-dim); font: 600 .6rem var(--font-mono); letter-spacing: .1em; text-transform: uppercase; }.maintenance-frame > header { border-bottom: 1px solid var(--arena-line); }.maintenance-frame > header img { width: 2rem; height: 2rem; border-radius: .25rem; }.maintenance-frame > section { display: grid; grid-template-columns: .55fr 1.45fr; min-height: 31rem; }.maintenance-code { display: flex; align-items: flex-end; padding: 2rem; color: rgba(142,111,200,.22); background: #131116; border-right: 1px solid var(--arena-line); font: 700 clamp(6rem,17vw,13rem)/.72 var(--font-display); letter-spacing: -.08em; }.maintenance-copy { align-self: center; padding: clamp(2rem,6vw,5rem); }.maintenance-kicker { display: flex; align-items: center; gap: .6rem; margin: 0; color: var(--arena-violet-soft); font: 600 .65rem var(--font-mono); letter-spacing: .1em; text-transform: uppercase; }.maintenance-kicker span { width: .45rem; height: .45rem; background: var(--arena-warning); border-radius: 50%; }.maintenance-copy h1 { max-width: 12ch; margin: 1rem 0 1.3rem; font-family: var(--font-display); font-size: clamp(2.7rem,6vw,5.5rem); line-height: .94; letter-spacing: -.055em; }.maintenance-copy > p:not(.maintenance-kicker):not(.status-error) { max-width: 39rem; margin: 0; color: var(--arena-muted); line-height: 1.7; }.maintenance-copy dl { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; margin: 2rem 0; background: var(--arena-line); border: 1px solid var(--arena-line); }.maintenance-copy dl div { padding: .8rem; background: #141218; }.maintenance-copy dt { color: var(--arena-dim); font: 600 .57rem var(--font-mono); text-transform: uppercase; }.maintenance-copy dd { margin: .4rem 0 0; color: var(--arena-text-soft); font: 600 .72rem var(--font-mono); }.maintenance-actions { display: flex; flex-wrap: wrap; gap: .8rem; margin-top: 2rem; }.maintenance-actions button, .maintenance-actions a { display: flex; justify-content: space-between; gap: 1.5rem; min-width: 10rem; padding: .8rem .9rem; color: white; background: var(--arena-violet); border: 1px solid var(--arena-violet); font-size: .76rem; font-weight: 700; text-decoration: none; }.maintenance-actions a { color: var(--arena-text-soft); background: transparent; border-color: var(--arena-line-strong); }.maintenance-actions button:disabled { opacity: .45; }.status-error { margin: 1rem 0 0; color: #f0afb2; font-size: .75rem; }.maintenance-frame > footer { justify-content: space-between; border-top: 1px solid var(--arena-line); }
@media (max-width: 700px) { .maintenance-frame > section { grid-template-columns: 1fr; }.maintenance-code { min-height: 10rem; align-items: flex-end; border-right: 0; border-bottom: 1px solid var(--arena-line); font-size: 6rem; }.maintenance-copy { padding: 2rem 1.2rem 2.5rem; }.maintenance-frame > footer { align-items: flex-start; flex-direction: column; gap: .4rem; } }
</style>
