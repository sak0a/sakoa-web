<template>
  <div class="donor-list" aria-live="polite">
    <div v-if="loading" class="donor-loading" role="status">
      <span class="sr-only">Loading donors</span>
      <i v-for="index in 6" :key="index" />
    </div>

    <div v-else-if="error" class="donor-empty" role="alert">
      <span>Data unavailable</span>
      <div><h3>We could not load the donor wall.</h3><p>No placeholder names are shown when the database is unavailable.</p></div>
      <button type="button" @click="refresh()">Try again</button>
    </div>

    <div v-else-if="donors.length === 0" class="donor-empty">
      <span>Open position</span>
      <div><h3>The wall is ready for its first name.</h3><p>Donors appear here only when they opt into public recognition.</p></div>
      <a href="#donate">Support the server →</a>
    </div>

    <ol v-else class="donor-grid">
      <li v-for="(donor, index) in donors" :key="donor.steamid || `${donor.name}-${index}`">
        <span class="donor-order">{{ String(index + 1).padStart(2, '0') }}</span>
        <div class="donor-monogram" aria-hidden="true">{{ initial(donor) }}</div>
        <div class="donor-name"><strong>{{ donor.display_name || donor.name || 'Anonymous donor' }}</strong><span>{{ donor.tier || 'Supporter' }}</span></div>
        <div class="donor-amount"><strong>€{{ formatAmount(donor.amount) }}</strong><span>contributed</span></div>
      </li>
    </ol>

    <p v-if="donors.length" class="donor-note">Want your name here? <a href="#donate">Contribute to this month's server costs.</a></p>
  </div>
</template>

<script setup>
const { data, pending: loading, error, refresh } = await useLazyFetch('/api/donors', {
  default: () => ({ donors: [] }),
})
const donors = computed(() => Array.isArray(data.value?.donors) ? data.value.donors : [])
const initial = donor => (donor.display_name || donor.name || '?').trim().charAt(0).toUpperCase()
const formatAmount = amount => (Number(amount) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
</script>

<style scoped>
.donor-grid { display: grid; grid-template-columns: 1fr 1fr; margin: 0; padding: 0; list-style: none; border: 1px solid var(--arena-line-strong); background: var(--arena-line-strong); gap: 1px; }.donor-grid li { display: grid; grid-template-columns: 2rem 2.65rem minmax(0,1fr) auto; gap: .8rem; align-items: center; min-width: 0; padding: 1rem; background: #111016; }.donor-order { color: var(--arena-dim); font: 500 .6rem var(--font-mono); }.donor-monogram { display: grid; width: 2.65rem; height: 2.65rem; place-items: center; color: var(--arena-violet-soft); background: #1d1923; border: 1px solid var(--arena-line); font: 700 .82rem var(--font-mono); }.donor-name, .donor-amount { display: grid; min-width: 0; gap: .25rem; }.donor-name strong { overflow: hidden; color: var(--arena-text); font-size: .82rem; text-overflow: ellipsis; white-space: nowrap; }.donor-name span, .donor-amount span { color: var(--arena-dim); font: 600 .55rem var(--font-mono); letter-spacing: .07em; text-transform: uppercase; }.donor-amount { text-align: right; }.donor-amount strong { color: var(--arena-text-soft); font: 600 .78rem var(--font-mono); font-variant-numeric: tabular-nums; }.donor-note { margin: 1rem 0 0; color: var(--arena-muted); font-size: .76rem; text-align: right; }.donor-note a { color: var(--arena-violet-soft); }
.donor-loading { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--arena-line); }.donor-loading i { height: 4.7rem; background: #151319; animation: donor-load 1s ease-in-out infinite alternate; }.donor-empty { min-height: 11rem; display: grid; grid-template-columns: 8rem 1fr auto; gap: 1.5rem; align-items: center; padding: 1.5rem; border: 1px solid var(--arena-line-strong); }.donor-empty > span { color: var(--arena-violet-soft); font: 600 .62rem var(--font-mono); letter-spacing: .08em; text-transform: uppercase; }.donor-empty h3, .donor-empty p { margin: 0; }.donor-empty h3 { color: var(--arena-text); font-family: var(--font-display); font-size: 1.25rem; }.donor-empty p { margin-top: .35rem; color: var(--arena-muted); font-size: .75rem; }.donor-empty a, .donor-empty button { padding: .65rem .8rem; color: var(--arena-text); background: transparent; border: 1px solid var(--arena-line-strong); font-size: .72rem; text-decoration: none; }
@keyframes donor-load { to { background: #201d25; } }
@media (max-width: 760px) { .donor-grid { grid-template-columns: 1fr; }.donor-loading { grid-template-columns: 1fr; }.donor-empty { grid-template-columns: 1fr; gap: .8rem; }.donor-empty a, .donor-empty button { justify-self: start; }.donor-note { text-align: left; } }
@media (max-width: 460px) { .donor-grid li { grid-template-columns: 1.8rem 2.4rem minmax(0,1fr); }.donor-amount { grid-column: 3; text-align: left; } }
@media (prefers-reduced-motion: reduce) { .donor-loading i { animation: none; } }
</style>
