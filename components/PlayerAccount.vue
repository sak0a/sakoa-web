<template>
  <button ref="trigger" type="button" class="account-trigger" :disabled="!hydrated" aria-haspopup="dialog" :aria-expanded="isOpen" aria-controls="player-account-dialog" @click="openPanel">
    <img v-if="account?.identity.avatar && session?.authenticated" :src="account.identity.avatar" alt="" width="25" height="25" @error="account.identity.avatar = null">
    <span v-else-if="session?.authenticated" aria-hidden="true" class="account-trigger-symbol">●</span>
    <img v-else src="/steam.svg" class="account-steam-icon" alt="" width="20" height="20">
    <span>{{ session?.authenticated ? 'My account' : 'Steam login' }}</span>
  </button>
  <Teleport to="body">
    <dialog id="player-account-dialog" ref="dialog" class="player-account-dialog" aria-labelledby="account-title" @close="onClosed" @cancel.prevent="closePanel" @keydown="trapFocus" @click="backdropClick">
      <div class="account-panel">
        <header class="account-panel-header"><div class="account-panel-heading"><img v-if="session?.authenticated" src="/default-512x512.png" alt="" width="36" height="36"><div><span class="account-eyebrow">SAKA’S DODGEBALL</span><h2 id="account-title">Your account</h2></div></div><button type="button" class="account-close" aria-label="Close account panel" autofocus @click="closePanel">×</button></header>
        <main class="account-panel-content">
          <p v-if="loginMessage" class="account-notice" role="status">{{ loginMessage }}</p>
          <div v-if="sessionLoading" class="account-loading" role="status">Checking your Steam session…</div>
          <div v-else-if="sessionError" class="account-empty"><h3>Account service unavailable</h3><p>{{ sessionError }}</p><button type="button" class="account-secondary" @click="loadSession">Try again</button></div>
          <section v-else-if="!session?.authenticated" class="account-welcome">
            <img class="account-welcome-mark" src="/default-512x512.png" alt="saka’s Dodgeball Server" width="60" height="60">
            <h3>Your game.<br>Your style.</h3><p>Bring your Steam account to see your stats, check your benefits, and make your chat your own.</p>
            <a v-if="session?.loginAvailable" href="/api/auth/steam" class="account-primary account-steam-link"><img src="/steam.svg" class="account-steam-icon" alt="" width="22" height="22"><span>Sign in through Steam</span></a>
            <p v-else class="account-notice">Steam sign-in is not configured yet. Please check back soon.</p>
            <p class="account-muted">You’ll sign in on Steam and return here. Your Steam password stays with Steam.</p>
            <div class="account-welcome-features"><span>Seasonal stats</span><span>Donator benefits</span><span>Custom chat style</span></div>
          </section>
          <template v-else>
            <div class="account-identity">
              <img v-if="account?.identity.avatar" :src="account.identity.avatar" alt="" width="48" height="48" @error="account.identity.avatar = null">
              <span v-else class="account-avatar-fallback" aria-hidden="true">{{ (account?.identity.name || 'S').slice(0, 1) }}</span>
              <div><h3>{{ account?.identity.name || 'Steam player' }}</h3><a :href="`https://steamcommunity.com/profiles/${session.steam64}`" target="_blank" rel="noopener noreferrer">Steam profile ↗</a></div>
              <button type="button" class="account-text-button" :disabled="loggingOut" @click="logout">{{ loggingOut ? 'Signing out…' : 'Sign out' }}</button>
            </div>
            <p v-if="actionError" class="account-error" role="alert">{{ actionError }}</p>
            <p v-if="savedMessage" class="account-notice" role="status">{{ savedMessage }}</p>
            <p v-if="loading" class="account-loading" role="status">Loading your player profile…</p>
            <div v-else-if="loadError" class="account-empty"><p role="alert">{{ loadError }}</p><button type="button" class="account-secondary" @click="loadAccount">Try again</button></div>
            <template v-else-if="account">
              <section v-if="account.donor?.active" class="account-membership" aria-labelledby="membership-title">
                <div><span class="account-eyebrow">YOUR BENEFITS</span><h3 id="membership-title">{{ donorTitle }}</h3><p>{{ donorDescription }}</p></div>
                <a href="/#donate" class="account-secondary" @click="closePanel">{{ account.donor?.active ? 'Extend support' : 'Support the server' }}</a>
              </section>
              <section class="account-statistics" aria-labelledby="account-stats-title">
                <div class="account-section-title"><h3 id="account-stats-title">Your stats</h3><select v-if="account.stats" v-model="selectedSeason" aria-label="Stats season" @change="loadAccount"><option v-for="season in seasonOptions" :key="season" :value="season">{{ season === account.stats.currentSeason ? 'Current season' : `Season ${season}` }}</option></select></div>
                <p v-if="account.unavailable.stats" class="account-notice">Stats are unavailable right now. <button type="button" class="account-text-button" @click="loadAccount">Retry</button></p>
                <p v-else-if="!account.stats?.player" class="account-muted">No stats for this season yet. Join the server to start playing.</p>
                <dl v-else class="account-stats-grid"><div v-for="stat in stats" :key="stat.label"><dt>{{ stat.label }}</dt><dd>{{ stat.value }}</dd></div></dl>
              </section>
              <template v-if="hasStyleAccess">
                <p v-if="account.unavailable.preferences" class="account-notice">Chat settings are unavailable. <button type="button" class="account-text-button" @click="loadAccount">Retry</button></p>
                <p v-else-if="!account.preferences" class="account-notice">Join the game server once to create your chat profile.</p>
                <PlayerChatSettings v-else :access-label="account.access?.admin ? 'ADMIN' : 'DONATOR'" :preferences="account.preferences" :player-name="account.identity.name" :csrf-token="session.csrfToken" :enabled="canEdit" :disabled-reason="styleDisabledReason" @reload="loadAccount" @saved="onSaved" @expired="loadSession" />
              </template>
            </template>
          </template>
        </main>
        <footer class="account-panel-footer">Same Steam account. Same dodgeball community.</footer>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup>
const emit = defineEmits(['opening']);
const route = useRoute();
const router = useRouter();
const trigger = ref(null);
const dialog = ref(null);
const isOpen = ref(false);
const hydrated = ref(false);
const session = ref(null);
const account = ref(null);
const sessionLoading = ref(true);
const sessionError = ref('');
const loadError = ref('');
const actionError = ref('');
const loginMessage = ref('');
const savedMessage = ref('');
const loading = ref(false);
const loggingOut = ref(false);
const selectedSeason = ref(undefined);
let bodyOverflow = '';
let requestGeneration = 0;
const hasStyleAccess = computed(() => Boolean(account.value?.access?.canStyle));
const canEdit = computed(() => hasStyleAccess.value && account.value.colorWritesEnabled);
const styleDisabledReason = computed(() => !hasStyleAccess.value ? 'Donator or admin access is required.' : 'Website color changes are not enabled yet. Your current settings are shown below.');
const donorTitle = computed(() => account.value?.unavailable.donor ? 'Benefits unavailable' : account.value?.donor?.active ? `${account.value.donor.tier} · Active` : account.value?.donor?.state === 'expired' ? 'Donator benefits expired' : account.value?.donor?.state === 'inactive' ? 'Donator benefits inactive' : 'Player account');
const donorDescription = computed(() => {
  const donor = account.value?.donor;
  if (!donor) return 'Please try again shortly.';
  if (donor.permanent) return 'Permanent benefits. Thank you for your support.';
  if (donor.expiresAt) return `${donor.active ? 'Active until' : 'Expiry'} ${new Date(donor.expiresAt * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`;
  return donor.exists ? 'Contact the server team about your benefits.' : 'Support the server to unlock your own in-game style.';
});
const seasonOptions = computed(() => Array.from({ length: account.value?.stats?.currentSeason || 0 }, (_, index) => account.value.stats.currentSeason - index));
const stats = computed(() => {
  const p = account.value?.stats?.player;
  if (!p) return [];
  return [
    { label: 'Season rank', value: Number(p.points) > 0 ? `#${p.rank}` : 'Unranked' },
    { label: 'Points', value: Number(p.points).toLocaleString() },
    { label: 'Deflections', value: Number(p.deflections).toLocaleString() },
    { label: 'Playtime', value: `${(Number(p.playtime) / 3600).toFixed(1)} h` },
    { label: 'Kills', value: Number(p.kills).toLocaleString() },
    { label: 'Deaths', value: Number(p.deaths).toLocaleString() }
  ];
});
async function loadSession() {
  sessionLoading.value = true;
  sessionError.value = '';
  try {
    session.value = await $fetch('/api/account/session');
    if (!session.value.authenticated) { account.value = null; requestGeneration++; }
    else if (isOpen.value) await loadAccount();
  } catch { sessionError.value = 'We could not check your login. Please try again.'; }
  finally { sessionLoading.value = false; }
}
async function loadAccount() {
  const generation = ++requestGeneration;
  loading.value = true;
  loadError.value = '';
  try {
    const result = await $fetch('/api/account', { query: selectedSeason.value ? { season: selectedSeason.value } : undefined });
    if (generation !== requestGeneration) return;
    account.value = result;
    if (result.stats) selectedSeason.value = result.stats.season;
  } catch (error) {
    if (generation !== requestGeneration) return;
    if (error?.statusCode === 401) { session.value = { authenticated: false, loginAvailable: true }; account.value = null; loginMessage.value = 'Your session expired. Sign in again to continue.'; }
    else loadError.value = 'Your account could not be loaded. Please try again.';
  } finally { if (generation === requestGeneration) loading.value = false; }
}
async function onSaved() {
  savedMessage.value = 'Preferences saved. Your game servers will pick up the change shortly.';
  await loadAccount();
}
async function openPanel() {
  emit('opening');
  await nextTick();
  if (isOpen.value) return;
  bodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  dialog.value.showModal();
  isOpen.value = true;
  await loadSession();
}
function closePanel() { dialog.value?.close(); onClosed(); }
function trapFocus(event) {
  if (event.key !== 'Tab') return;
  const elements = [...dialog.value.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled)')].filter(element => element.getClientRects().length);
  const first = elements[0];
  const last = elements[elements.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
}
function onClosed() {
  if (!isOpen.value) return;
  isOpen.value = false;
  document.body.style.overflow = bodyOverflow;
  trigger.value?.focus();
}
function backdropClick(event) {
  if (event.target !== dialog.value) return;
  const rect = dialog.value.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closePanel();
}
async function logout() {
  loggingOut.value = true;
  savedMessage.value = '';
  actionError.value = '';
  try {
    await $fetch('/api/account/logout', { method: 'POST', headers: { 'x-csrf-token': session.value.csrfToken } });
    requestGeneration++;
    session.value = { authenticated: false, loginAvailable: true };
    account.value = null;
    selectedSeason.value = undefined;
  } catch { actionError.value = 'Could not sign out. Please try again.'; }
  finally { loggingOut.value = false; }
}
onMounted(async () => {
  hydrated.value = true;
  const returned = route.query.account;
  if (returned) {
    loginMessage.value = returned === 'cancelled' ? 'Steam sign-in was cancelled.' : returned === 'login-failed' ? 'Steam sign-in could not be verified. Please try again.' : '';
    const query = { ...route.query };
    delete query.account;
    await router.replace({ query });
    await openPanel();
  } else await loadSession();
});
onBeforeUnmount(() => { requestGeneration++; if (isOpen.value) document.body.style.overflow = bodyOverflow; });
</script>
