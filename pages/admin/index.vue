<template>
  <main class="admin-login">
    <NuxtLink to="/" class="admin-login__back">← Public site</NuxtLink>

    <section class="admin-login__intro" aria-labelledby="login-title">
      <div class="admin-login__brand">
        <img src="/default-512x512.png" alt="" width="42" height="42">
        <span>saka dodgeball / private operations</span>
      </div>
      <p class="admin-eyebrow">Control room</p>
      <h1 id="login-title">Keep the arena running.</h1>
      <p class="admin-login__lede">Server state, community support, publishing and site controls in one restricted workspace.</p>
      <div class="admin-login__signal" aria-hidden="true">
        <span>DB</span><i></i><span>WEB</span><i></i><span>DISCORD</span>
      </div>
    </section>

    <section class="admin-login__form-wrap" aria-label="Admin sign in">
      <form class="admin-login__form" @submit.prevent="handleLogin">
        <p class="admin-eyebrow">Authorized access only</p>
        <h2>Sign in</h2>
        <p>Use the administrator credential configured for this deployment.</p>

        <label class="admin-field">
          <span>Password</span>
          <input v-model="password" type="password" required autocomplete="current-password" placeholder="Enter admin password" :disabled="isLoading">
        </label>

        <div v-if="error" class="admin-notice admin-notice--error" role="alert">{{ error }}</div>

        <button type="submit" class="admin-button admin-button-primary" :disabled="isLoading || !password">
          {{ isLoading ? 'Verifying…' : 'Enter control room' }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
definePageMeta({ layout: false })

const { login, isLoading, error } = useAdmin()
const password = ref('')

async function handleLogin() {
  if (await login(password.value)) await navigateTo('/admin/dashboard')
}
</script>

<style scoped>
.admin-login { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(24rem, .85fr); background: #09090b; color: #f5f3ff; }
.admin-login__back { position: fixed; top: 1.5rem; right: 1.75rem; z-index: 2; color: #8c8995; font-family: var(--font-mono); font-size: .68rem; letter-spacing: .08em; text-transform: uppercase; }
.admin-login__back:hover { color: #fff; }
.admin-login__intro { position: relative; display: flex; min-height: 100vh; flex-direction: column; justify-content: center; overflow: hidden; padding: clamp(3rem, 8vw, 9rem); border-right: 1px solid #29292f; }
.admin-login__intro::after { position: absolute; right: -10rem; bottom: -17rem; width: 38rem; height: 38rem; border: 1px solid #312b3f; border-radius: 50%; box-shadow: 0 0 0 7rem #0d0c10, 0 0 0 7.05rem #312b3f, 0 0 0 14rem #0b0b0d; content: ''; }
.admin-login__brand { position: absolute; top: 2rem; left: clamp(2rem, 8vw, 9rem); display: flex; align-items: center; gap: .8rem; color: #8c8995; font-family: var(--font-mono); font-size: .63rem; letter-spacing: .1em; text-transform: uppercase; }
.admin-login__brand img { border-radius: .35rem; }
.admin-login h1 { position: relative; z-index: 1; max-width: 11ch; margin: 1rem 0 1.5rem; font-size: clamp(3.3rem, 7vw, 7.4rem); font-weight: 600; letter-spacing: -.075em; line-height: .9; }
.admin-login__lede { position: relative; z-index: 1; max-width: 35rem; color: #9e9ba7; font-size: clamp(.95rem, 1.5vw, 1.15rem); }
.admin-login__signal { position: relative; z-index: 1; display: flex; max-width: 28rem; align-items: center; gap: .75rem; margin-top: 3.5rem; color: #787580; font-family: var(--font-mono); font-size: .62rem; letter-spacing: .12em; }
.admin-login__signal i { height: 1px; flex: 1; background: #39363f; }
.admin-login__form-wrap { display: grid; place-items: center; padding: 6rem clamp(1.5rem, 5vw, 6rem); background: #0d0d10; }
.admin-login__form { width: min(100%, 25rem); }
.admin-login__form h2 { margin: .75rem 0 .25rem; font-size: 2.4rem; letter-spacing: -.055em; }
.admin-login__form > p:not(.admin-eyebrow) { margin: 0 0 2.25rem; color: #8f8c98; font-size: .85rem; }
.admin-login__form .admin-field { margin-bottom: 1rem; }
.admin-login__form .admin-button { width: 100%; margin-top: .25rem; }
@media (max-width: 850px) {
  .admin-login { grid-template-columns: 1fr; }
  .admin-login__intro { min-height: 46vh; padding: 7rem 1.25rem 3rem; border-right: 0; border-bottom: 1px solid #29292f; }
  .admin-login__brand { left: 1.25rem; }
  .admin-login h1 { font-size: clamp(3rem, 15vw, 5rem); }
  .admin-login__signal { display: none; }
  .admin-login__form-wrap { min-height: 54vh; padding: 3rem 1.25rem; }
}
</style>
