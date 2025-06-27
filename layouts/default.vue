<template>
  <div class="min-h-screen flex flex-col">
    <!-- Admin Notice -->
    <AdminNotice />

    <header
      ref="navigation"
      class="navigation fixed left-0 w-full z-50 transition-all duration-1000 ease-out admin-aware"
      :class="{ 'scrolled': scrolled }"
    >
      <div class="nav-container">
        <div class="nav-parent">
          <!-- Logo and title section -->
          <div class="nav-logo">
            <img
              src="/assets/img/default-512x512.png"
              alt="Saka's Dodgeball Server Logo"
              class="nav-logo-img"
            />
            <span
              class="nav-title transition-all duration-1000 ease-out"
              :class="{ 'nav-title-hidden': scrolled }"
            >
              saka's dodgeball server
            </span>
          </div>

          <!-- Centered navigation menu -->
          <nav class="nav-menu">
            <a href="#" class="nav-link">Start</a>
            <a href="#about" class="nav-link">About</a>
            <a href="#server-status" class="nav-link">Status</a>
            <a href="#leaderboard" class="nav-link">Leaderboard</a>
            <a href="#tiers" class="nav-link">Rewards</a>
            <a href="#donors" class="nav-link">Donators</a>

          </nav>

          <!-- Right-side buttons -->
          <div class="nav-buttons-right">
            <a href="#donate" rel="noopener noreferrer" class="nav-button outline">
              <span>Donate</span>
              <svg class="nav-button-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-grow">
      <slot />
    </main>

    <!-- Back to Top Button -->
    <BackToTop />

    <footer class="py-8" style="background-color: #0a0a0a; color: var(--text-primary);">
      <div class=" text-center text-sm animate-on-scroll animate-fade-in animate-delay-3" style="border-color: var(--border-color); color: var(--text-tertiary);">
        <p>&copy; {{ new Date().getFullYear() }} saka's dodgeball server. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import BackToTop from '~/components/BackToTop.vue';
import AdminNotice from '~/components/AdminNotice.vue';

const navigation = ref(null);
const scrolled = ref(false);

onMounted(() => {
  // Register ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  // Wait for DOM to be ready
  setTimeout(() => {
    const heroSection = document.querySelector('section'); // First section is the hero

    if (heroSection && navigation.value) {
      // ScrollTrigger for the main navigation animation
      ScrollTrigger.create({
        trigger: heroSection,
        start: "bottom top", // When the bottom of hero section hits the top of viewport
        end: "bottom top",
        onEnter: () => {
          scrolled.value = true;
        },
        onLeaveBack: () => {
          scrolled.value = false;
        },
      });
    }
  }, 100);
});

onUnmounted(() => {
  // Clean up ScrollTrigger instances
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
});
</script>
