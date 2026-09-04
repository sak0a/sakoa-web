<template>
  <div class="site-shell">
    <a class="skip-link" href="#main-content">Skip to content</a>
    <AdminNotice />

    <header ref="navigation" class="navigation admin-aware" :class="{ 'is-scrolled': scrolled }">
      <div class="nav-frame">
        <a href="#top" class="brand" aria-label="saka's dodgeball server, home" @click="closeMobileMenu">
          <img src="/default-512x512.png" alt="" class="brand-mark" width="36" height="36">
          <span class="brand-copy">
            <strong>saka</strong>
            <span>dodgeball / tf2</span>
          </span>
        </a>

        <nav id="primary-navigation" class="nav-menu" :class="{ 'is-open': mobileMenuOpen }" aria-label="Primary navigation">
          <a
            v-for="item in navigationItems"
            :key="item.id"
            :href="`#${item.id}`"
            class="nav-link"
            :class="{ 'is-active': activeSection === item.id }"
            :aria-current="activeSection === item.id ? 'location' : undefined"
            @click="closeMobileMenu"
          >
            {{ item.label }}
          </a>
          <a href="#donate" class="nav-mobile-action" @click="closeMobileMenu">Support the server</a>
        </nav>

        <a href="#donate" class="nav-action">Support</a>
        <button
          class="menu-toggle"
          type="button"
          :aria-expanded="mobileMenuOpen"
          :data-hydrated="hydrated ? 'true' : 'false'"
          aria-controls="primary-navigation"
          :aria-label="mobileMenuOpen ? 'Close navigation' : 'Open navigation'"
          @click="toggleMobileMenu"
        >
          <span />
          <span />
        </button>
      </div>
    </header>

    <main id="main-content"><slot /></main>
    <BackToTop />

    <footer class="site-footer">
      <div class="footer-frame">
        <div>
          <span class="footer-kicker">Community-operated since 2024</span>
          <p>saka's dodgeball server</p>
        </div>
        <div class="footer-meta">
          <span>Team Fortress 2</span>
          <span>Frankfurt, DE</span>
          <span>© {{ currentYear }}</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import AdminNotice from '~/components/AdminNotice.vue'
import BackToTop from '~/components/BackToTop.vue'

const navigation = ref(null)
const hydrated = ref(false)
const scrolled = ref(false)
const mobileMenuOpen = ref(false)
const activeSection = ref('top')
const currentYear = new Date().getFullYear()
const navigationItems = [
  { id: 'top', label: 'Start' },
  { id: 'server-status', label: 'Live' },
  { id: 'leaderboard', label: 'Ranks' },
  { id: 'tiers', label: 'Rewards' },
  { id: 'donors', label: 'Donors' },
]

let sectionObserver

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
  document.body.style.overflow = ''
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  document.body.style.overflow = mobileMenuOpen.value ? 'hidden' : ''
}

const onScroll = () => { scrolled.value = window.scrollY > 24 }
const onKeydown = (event) => {
  if (event.key === 'Escape' && mobileMenuOpen.value) closeMobileMenu()
}
const onResize = () => {
  if (window.innerWidth >= 900 && mobileMenuOpen.value) closeMobileMenu()
}

onMounted(() => {
  hydrated.value = true
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
  document.addEventListener('keydown', onKeydown)
  onScroll()

  sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter(entry => entry.isIntersecting)
      .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]
    if (visible?.target?.id) activeSection.value = visible.target.id
  }, { rootMargin: '-25% 0px -60%', threshold: [0.05, 0.25, 0.5] })

  navigationItems.forEach(({ id }) => {
    const section = document.getElementById(id)
    if (section) sectionObserver.observe(section)
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('keydown', onKeydown)
  sectionObserver?.disconnect()
  document.body.style.overflow = ''
})
</script>

<style scoped>
.site-shell { min-height: 100dvh; background: var(--arena-ink); color: var(--arena-text); }
.navigation { position: fixed; inset: 0 0 auto; z-index: 50; padding: .85rem 0; transition: background-color 180ms ease, border-color 180ms ease, padding 180ms ease; border-bottom: 1px solid transparent; }
.navigation.is-scrolled { padding: .45rem 0; background: rgba(12, 11, 15, .94); border-color: var(--arena-line); }
.nav-frame, .footer-frame { width: min(100% - 2rem, 86rem); margin-inline: auto; display: flex; align-items: center; }
.nav-frame { min-height: 3.5rem; gap: 1.5rem; }
.brand { display: inline-flex; align-items: center; gap: .7rem; color: var(--arena-text); text-decoration: none; flex-shrink: 0; }
.brand-mark { width: 2.25rem; height: 2.25rem; border-radius: .35rem; border: 1px solid var(--arena-line-strong); }
.brand-copy { display: grid; line-height: 1; }
.brand-copy strong { font-family: var(--font-display); font-size: 1rem; letter-spacing: -.02em; }
.brand-copy span, .footer-kicker { margin-top: .28rem; color: var(--arena-muted); font: 600 .62rem/1 var(--font-mono); letter-spacing: .12em; text-transform: uppercase; }
.nav-menu { margin-left: auto; display: flex; align-items: center; gap: .2rem; }
.nav-link { position: relative; padding: .7rem .8rem; color: var(--arena-muted); font-size: .82rem; font-weight: 600; text-decoration: none; }
.nav-link::after { content: ''; position: absolute; inset: auto .8rem .36rem; height: 1px; background: var(--arena-violet); transform: scaleX(0); transform-origin: left; transition: transform 180ms ease; }
.nav-link:hover, .nav-link.is-active { color: var(--arena-text); }
.nav-link.is-active::after { transform: scaleX(1); }
.nav-action, .nav-mobile-action { border: 1px solid var(--arena-violet); color: var(--arena-text); text-decoration: none; font-size: .78rem; font-weight: 700; padding: .68rem 1rem; transition: background-color 180ms ease, transform 180ms ease; }
.nav-action:hover, .nav-mobile-action:hover { background: var(--arena-violet); }
.nav-action:active, .nav-mobile-action:active { transform: translateY(1px); }
.nav-mobile-action, .menu-toggle { display: none; }
.site-footer { border-top: 1px solid var(--arena-line); padding: 2.5rem 0 3rem; background: #09080b; }
.footer-frame { justify-content: space-between; gap: 2rem; }
.footer-frame p { margin: .45rem 0 0; color: var(--arena-text); font-family: var(--font-display); font-size: 1.1rem; }
.footer-meta { display: flex; gap: 1.5rem; color: var(--arena-muted); font: 500 .72rem/1.4 var(--font-mono); }

@media (max-width: 899px) {
  .nav-frame { justify-content: space-between; }
  .nav-action { display: none; }
  .menu-toggle { display: grid; place-content: center; gap: .38rem; width: 2.75rem; height: 2.75rem; border: 1px solid var(--arena-line-strong); color: var(--arena-text); background: var(--arena-panel); }
  .menu-toggle span { display: block; width: 1.1rem; height: 1px; background: currentColor; transition: transform 180ms ease; }
  .menu-toggle[aria-expanded='true'] span:first-child { transform: translateY(.22rem) rotate(45deg); }
  .menu-toggle[aria-expanded='true'] span:last-child { transform: translateY(-.22rem) rotate(-45deg); }
  .nav-menu { position: absolute; z-index: 100; inset: calc(100% + 1px) 1rem auto; width: auto; margin: 0; display: none; align-items: stretch; padding: 1rem; background: #111016; border: 1px solid var(--arena-line-strong); border-radius: 0; box-shadow: 0 1.5rem 3rem rgba(5, 4, 7, .45); opacity: 0; visibility: hidden; transform: none; pointer-events: none; }
  .nav-menu.is-open { display: grid; opacity: 1; visibility: visible; transform: none; pointer-events: auto; }
  .nav-link { padding: .9rem .65rem; border-bottom: 1px solid var(--arena-line); }
  .nav-link::after { display: none; }
  .nav-mobile-action { display: block; margin-top: 1rem; text-align: center; }
  .footer-frame, .footer-meta { align-items: flex-start; flex-direction: column; }
  .footer-meta { gap: .45rem; }
}
</style>
