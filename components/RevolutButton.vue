<template>
  <a :href="revolutUrl" target="_blank" rel="noopener noreferrer" class="payment-button payment-button--revolut" :class="customClass">
    <span class="payment-brand"><strong aria-hidden="true">R</strong><span>{{ fullText }}</span></span>
    <span aria-hidden="true">↗</span>
  </a>
</template>

<script setup>
defineProps({
  fullText: { type: String, default: 'Donate with Revolut' },
  shortText: { type: String, default: 'Revolut' },
  customClass: { type: String, default: '' },
})
const revolutUrl = 'https://revolut.me/laurinnoel'
</script>

<style scoped>
.payment-button { display: flex; align-items: center; justify-content: space-between; padding: .85rem 1rem; color: #111015; background: #f1eff4; text-decoration: none; font-size: .82rem; font-weight: 700; transition: transform 180ms ease, background-color 180ms ease; }.payment-button:hover { transform: translateX(3px); background: white; }.payment-brand { display: flex; align-items: center; gap: .65rem; }.payment-brand strong { display: grid; width: 1.5rem; height: 1.5rem; place-items: center; color: white; background: #111015; font: 800 .85rem var(--font-display); }
</style>
