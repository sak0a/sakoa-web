<template>
  <main class="error-page">
    <a class="skip-link" href="#error-content">Skip to error details</a>

    <div class="error-frame">
      <header>
        <NuxtLink to="/" class="error-brand" aria-label="saka's Dodgeball Server home">
          <img src="/default-512x512.png" alt="" width="36" height="36">
          <span>saka / arena</span>
        </NuxtLink>
        <span class="error-state">Route interrupted</span>
      </header>

      <section id="error-content" aria-labelledby="error-title">
        <p class="error-code" aria-hidden="true">{{ statusCode }}</p>
        <div class="error-copy">
          <p class="error-kicker">System response / {{ statusCode }}</p>
          <h1 id="error-title">{{ title }}</h1>
          <p>{{ description }}</p>

          <div class="error-actions">
            <button type="button" @click="handleClearError">
              Return to the arena <span aria-hidden="true">→</span>
            </button>
            <button type="button" class="error-secondary" @click="goBack">
              Previous page <span aria-hidden="true">↩</span>
            </button>
          </div>
        </div>
      </section>

      <footer>
        <span>Team Fortress 2</span>
        <span>Frankfurt, DE</span>
        <span>Error reference {{ statusCode }}</span>
      </footer>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const statusCode = computed(() => props.error?.statusCode || 500)
const title = computed(() => statusCode.value === 404 ? 'That route left the server.' : 'The match was interrupted.')
const description = computed(() => statusCode.value === 404
  ? 'The page you requested does not exist, may have moved, or is no longer available.'
  : 'An unexpected error stopped this page from loading. Return to the arena and try again.')

const handleClearError = () => clearError({ redirect: '/' })
const goBack = () => {
  if (import.meta.client && window.history.length > 1) {
    window.history.back()
    return
  }
  handleClearError()
}

useHead({
  title: () => `${statusCode.value} — saka's Dodgeball Server`,
  meta: [{ name: 'robots', content: 'noindex' }],
})
</script>

<style scoped>
.error-page { min-height: 100dvh; display: grid; place-items: center; padding: 1rem; color: var(--arena-text); background: var(--arena-ink); }
.error-frame { position: relative; width: min(100%, 72rem); border: 1px solid var(--arena-line-strong); background: #0e0d11; }
.error-frame > header, .error-frame > footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .8rem 1rem; color: var(--arena-dim); font: 600 .6rem var(--font-mono); letter-spacing: .1em; text-transform: uppercase; }
.error-frame > header { border-bottom: 1px solid var(--arena-line); }
.error-brand { display: flex; align-items: center; gap: .75rem; color: var(--arena-text-soft); text-decoration: none; }
.error-brand img { width: 2rem; height: 2rem; border-radius: .25rem; }
.error-frame > section { display: grid; grid-template-columns: .55fr 1.45fr; min-height: 31rem; }
.error-code { display: flex; align-items: flex-end; margin: 0; padding: 2rem; overflow: hidden; color: rgba(142,111,200,.22); background: #131116; border-right: 1px solid var(--arena-line); font: 700 clamp(6rem,17vw,13rem)/.72 var(--font-display); letter-spacing: -.08em; }
.error-copy { align-self: center; padding: clamp(2rem,6vw,5rem); }
.error-kicker { margin: 0; color: var(--arena-violet-soft); font: 600 .65rem var(--font-mono); letter-spacing: .1em; text-transform: uppercase; }
.error-copy h1 { max-width: 12ch; margin: 1rem 0 1.3rem; font-family: var(--font-display); font-size: clamp(2.7rem,6vw,5.5rem); line-height: .94; letter-spacing: -.055em; }
.error-copy > p:not(.error-kicker) { max-width: 39rem; margin: 0; color: var(--arena-muted); line-height: 1.7; }
.error-actions { display: flex; flex-wrap: wrap; gap: .8rem; margin-top: 2rem; }
.error-actions button { display: flex; justify-content: space-between; gap: 1.5rem; min-width: 12rem; padding: .8rem .9rem; color: white; background: var(--arena-violet); border: 1px solid var(--arena-violet); font-size: .76rem; font-weight: 700; cursor: pointer; }
.error-actions .error-secondary { color: var(--arena-text-soft); background: transparent; border-color: var(--arena-line-strong); }
.error-actions button:hover { border-color: var(--arena-violet-soft); }
.error-frame > footer { border-top: 1px solid var(--arena-line); }
@media (max-width: 700px) { .error-frame > section { grid-template-columns: 1fr; }.error-code { min-height: 10rem; border-right: 0; border-bottom: 1px solid var(--arena-line); font-size: 6rem; }.error-copy { padding: 2rem 1.2rem 2.5rem; }.error-copy h1 { font-size: clamp(2.4rem,13vw,4rem) !important; }.error-state { display: none; }.error-frame > footer { align-items: flex-start; flex-direction: column; gap: .4rem; } }
</style>
