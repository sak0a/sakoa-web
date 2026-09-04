<template>
  <Transition name="back-to-top">
    <button
      v-if="showButton"
      class="back-to-top-button"
      type="button"
      aria-label="Back to top"
      @click="scrollToTop"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m18 15-6-6-6 6"/>
      </svg>
    </button>
  </Transition>
</template>

<script setup>
const showButton = ref(false)

const handleScroll = () => {
  // Show button after scrolling past the first section (hero section)
  const heroSection = document.querySelector('section')
  if (heroSection) {
    const heroHeight = heroSection.offsetHeight
    showButton.value = window.scrollY > heroHeight
  }
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.back-to-top-button {
  position: fixed;
  bottom: 2rem;
  right: 1.25rem;
  z-index: 1000;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0;
  background-color: var(--arena-panel);
  color: var(--arena-text-soft);
  border: 1px solid var(--arena-line-strong);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 180ms ease, background-color 180ms ease, border-color 180ms ease, transform 180ms ease;
}

.back-to-top-button:hover {
  background-color: var(--arena-violet);
  color: #fff;
  border-color: var(--arena-violet);
  transform: translateY(-2px);
}

.back-to-top-button:active {
  transform: translateY(0);
}

/* Transition animations */
.back-to-top-enter-active,
.back-to-top-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.back-to-top-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.back-to-top-enter-to,
.back-to-top-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .back-to-top-button {
    bottom: 1rem;
    right: 1rem;
    width: 2.5rem;
    height: 2.5rem;
  }
}
</style>
