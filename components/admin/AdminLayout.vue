<template>
  <div class="admin-shell">
    <a class="admin-skip-link" href="#admin-content">Skip to content</a>

    <aside class="admin-rail" aria-label="Administration">
      <div class="admin-brand">
        <NuxtLink to="/admin/dashboard" class="admin-brand__mark" aria-label="saka control room home">
          <img src="/default-512x512.png" alt="" width="36" height="36">
        </NuxtLink>
        <div>
          <span class="admin-kicker">saka dodgeball</span>
          <strong>Control room</strong>
        </div>
      </div>

      <nav class="admin-nav" aria-label="Administration">
        <p class="admin-nav__label">Operate</p>
        <NuxtLink v-for="item in primaryItems" :key="item.to" :to="item.to" class="admin-nav__link">
          <span class="admin-nav__index">{{ item.index }}</span>
          <span>{{ item.label }}</span>
        </NuxtLink>

        <p class="admin-nav__label admin-nav__label--spaced">System</p>
        <NuxtLink v-for="item in systemItems" :key="item.to" :to="item.to" class="admin-nav__link">
          <span class="admin-nav__index">{{ item.index }}</span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="admin-rail__footer">
        <NuxtLink to="/" target="_blank" class="admin-exit-link">
          Open public site
          <span aria-hidden="true">↗</span>
        </NuxtLink>
        <button type="button" class="admin-logout" @click="handleLogout">Sign out</button>
      </div>
    </aside>

    <main id="admin-content" class="admin-main" tabindex="-1">
      <div class="admin-mobile-bar">
        <div>
          <span class="admin-kicker">saka dodgeball</span>
          <strong>Control room</strong>
        </div>
        <button type="button" class="admin-menu-button" :aria-expanded="mobileOpen" aria-controls="admin-mobile-nav" @click="mobileOpen = !mobileOpen">
          {{ mobileOpen ? 'Close' : 'Menu' }}
        </button>
      </div>

      <nav v-if="mobileOpen" id="admin-mobile-nav" class="admin-mobile-nav" aria-label="Mobile administration">
        <NuxtLink v-for="item in allItems" :key="item.to" :to="item.to" @click="mobileOpen = false">{{ item.label }}</NuxtLink>
        <NuxtLink to="/" target="_blank">Public site ↗</NuxtLink>
        <button type="button" @click="handleLogout">Sign out</button>
      </nav>

      <slot />
    </main>
  </div>
</template>

<script setup>
setPageLayout(false)

const { logout } = useAdmin()
const mobileOpen = ref(false)

const primaryItems = [
  { index: '01', label: 'Overview', to: '/admin/dashboard' },
  { index: '02', label: 'Servers', to: '/admin/servers' },
  { index: '↳', label: 'Moderation', to: '/admin/moderation' },
  { index: '↳', label: 'Server operations', to: '/admin/operations' },
  { index: '03', label: 'Discord bot', to: '/admin/discord' },
  { index: '04', label: 'Donors', to: '/admin/donors' },
]

const systemItems = [
  { index: '05', label: 'Site content', to: '/admin/hero-stats' },
  { index: '06', label: 'Settings', to: '/admin/settings' },
  { index: '07', label: 'Database & cache', to: '/admin/cache' },
]

const allItems = [...primaryItems, ...systemItems]

async function handleLogout() {
  await logout()
}
</script>
