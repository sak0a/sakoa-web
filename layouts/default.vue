<template>
  <div class="min-h-screen flex flex-col">
    <!-- Admin Notice -->
    <AdminNotice />

    <header
      ref="navigation"
      class="navigation fixed left-0 w-full z-50 transition-all duration-500 ease-out admin-aware"
      :class="{ 'scrolled': scrolled }"
    >
      <div class="nav-container" :class="navContainerClasses">
        <div class="nav-parent">
          <!-- Logo and title section -->
          <div class="nav-logo">
            <NuxtImg
              src="/default-512x512.png"
              alt="saka's Dodgeball Server Logo"
              class="nav-logo-img w-10 h-10 rounded-lg"
              width="40"
              height="40"
              loading="eager"
              format="webp"
              preset="logo"
            />
            <span
              class="nav-title transition-all duration-500 ease-out font-semibold text-white"
              :class="{ 'nav-title-hidden': scrolled }"
            >
              saka's dodgeball server
            </span>
          </div>

          <!-- Centered navigation menu -->
          <nav class="nav-menu" :class="{ 'open': mobileMenuOpen }">
            <a href="#" class="nav-link" @click="closeMobileMenu">Start</a>
            <a href="#about" class="nav-link" @click="closeMobileMenu">About</a>
            <a href="#server-status" class="nav-link" @click="closeMobileMenu">Status</a>
            <a href="#leaderboard" class="nav-link" @click="closeMobileMenu">Leaderboard</a>
            <a href="#tiers" class="nav-link" @click="closeMobileMenu">Rewards</a>
            <a href="#donors" class="nav-link" @click="closeMobileMenu">Donators</a>

            <!-- Mobile menu buttons -->
            <div class="nav-buttons-mobile">
              <a href="#donate" rel="noopener noreferrer" class="nav-button outline" @click="closeMobileMenu">
                <span>Donate</span>
                <svg class="nav-button-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>
            </div>
          </nav>

          <!-- Mobile hamburger menu button -->
          <button
            class="mobile-menu-toggle"
            @click="toggleMobileMenu"
            :class="{ 'open': mobileMenuOpen }"
            aria-label="Toggle mobile menu"
          >
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>

          <!-- Right-side buttons (desktop only) -->
          <div class="nav-buttons-right">
            <button
              @click="showSearchModal = true"
              class="btn btn-ghost text-sm px-3 py-2 mr-2 group"
              title="Search"
            >
              <svg class="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
            <a href="#donate" rel="noopener noreferrer" class="btn btn-primary text-sm px-4 py-2 group">
              <span>Donate</span>
              <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12H19M19 12L12 5M19 12L12 19"/>
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

    <!-- Chatbot -->
    <Chatbot />

    <!-- Search Modal -->
    <SearchModal
      :is-open="showSearchModal"
      @close="showSearchModal = false"
      @select="handleSearchSelect"
    />

    <!-- Performance Monitor (dev only) -->
    <!-- <PerformanceMonitor /> -->

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
import Chatbot from '~/components/Chatbot.vue';
import SearchModal from '~/components/SearchModal.vue';
// import PerformanceMonitor from '~/components/PerformanceMonitor.vue';

const navigation = ref(null);
const scrolled = ref(false);
const mobileMenuOpen = ref(false);
const showSearchModal = ref(false);
const currentScrollY = ref(0);

// Dynamic navbar background based on scroll position and section
const navContainerClasses = computed(() => {
  const isInHero = currentScrollY.value < (typeof window !== 'undefined' ? window.innerHeight * 0.8 : 600);
  const isCompact = currentScrollY.value > 100;

  return {
    'backdrop-blur-xl': isCompact,
    'bg-gray-950/80': isCompact && !isInHero,
    'bg-gray-950/20': isCompact && isInHero,
    'border-b': isCompact,
    'border-gray-800/50': isCompact && !isInHero,
    'border-gray-700/30': isCompact && isInHero,
  };
});

// Mobile menu functions
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;

  // Prevent body scrolling when menu is open
  if (mobileMenuOpen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
  document.body.style.overflow = '';
};

// Search functionality
const handleSearchSelect = (result) => {
  console.log('Selected search result:', result);
  // Handle search result selection
  // You can implement navigation or other actions here
};

// Close mobile menu when clicking outside
const handleClickOutside = (event) => {
  if (mobileMenuOpen.value && navigation.value && !navigation.value.contains(event.target)) {
    closeMobileMenu();
  }
};

// Close mobile menu on escape key
const handleEscapeKey = (event) => {
  if (event.key === 'Escape' && mobileMenuOpen.value) {
    closeMobileMenu();
  }
};

// Close mobile menu on window resize to desktop
const handleResize = () => {
  if (window.innerWidth > 991 && mobileMenuOpen.value) {
    closeMobileMenu();
  }
};

// Search keyboard shortcut (Cmd/Ctrl + K)
const handleSearchShortcut = (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault();
    showSearchModal.value = true;
  }
};

// Track scroll position for navbar styling
const updateScrollPosition = () => {
  currentScrollY.value = window.scrollY;
};

onMounted(() => {
  // Register ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  // Add event listeners for mobile menu and search
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEscapeKey);
  document.addEventListener('keydown', handleSearchShortcut);
  window.addEventListener('resize', handleResize);

  // Add scroll listener for navbar styling
  window.addEventListener('scroll', updateScrollPosition);
  updateScrollPosition(); // Initial call

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

  // Remove event listeners
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleEscapeKey);
  document.removeEventListener('keydown', handleSearchShortcut);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', updateScrollPosition);
});
</script>
