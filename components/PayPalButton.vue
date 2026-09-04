<template>
  <a :href="paypalUrl" target="_blank" rel="noopener noreferrer" class="payment-button payment-button--paypal" :class="customClass">
    <span class="payment-brand"><strong aria-hidden="true">P</strong><span>{{ fullText }}</span></span>
    <span aria-hidden="true">↗</span>
  </a>
</template>

<script setup>
defineProps({
  fullText: { type: String, default: 'Donate with PayPal' },
  shortText: { type: String, default: 'PayPal' },
  customClass: { type: String, default: '' },
})
const paypalUrl = 'https://paypal.me/sakoacom'
</script>

<style scoped>
.payment-button { display: flex; align-items: center; justify-content: space-between; padding: .85rem 1rem; color: white; background: #1665a5; text-decoration: none; font-size: .82rem; font-weight: 700; transition: transform 180ms ease, background-color 180ms ease; }.payment-button:hover { transform: translateX(3px); background: #1d70b5; }.payment-brand { display: flex; align-items: center; gap: .65rem; }.payment-brand strong { display: grid; width: 1.5rem; height: 1.5rem; place-items: center; color: #1665a5; background: white; font: 800 .85rem var(--font-display); }
</style>
