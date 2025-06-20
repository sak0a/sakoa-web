<template>
  <Transition name="back-to-top">
    <button
      v-if="showButton"
      @click="scrollToTop"
      class="back-to-top-button"
      aria-label="Back to top"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m18 15-6-6-6 6"/>
      </svg>
    </button>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const showButton = ref(false);

const handleScroll = () => {
  // Show button after scrolling past the first section (hero section)
  const heroSection = document.querySelector('section');
  if (heroSection) {
    const heroHeight = heroSection.offsetHeight;
    showButton.value = window.scrollY > heroHeight;
  }
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.back-to-top-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: #734C96;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(115, 76, 150, 0.3);
  transition: all 0.3s ease;
}

.back-to-top-button:hover {
  background-color: #9B6BC7;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(115, 76, 150, 0.4);
}

.back-to-top-button:active {
  transform: translateY(0);
}

/* Transition animations */
.back-to-top-enter-active,
.back-to-top-leave-active {
  transition: all 0.3s ease;
}

.back-to-top-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.back-to-top-enter-to,
.back-to-top-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .back-to-top-button {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 2.5rem;
    height: 2.5rem;
  }
}
</style>
