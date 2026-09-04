<template>
  <div class="stats-counter">
    <strong>{{ displayValue }}{{ suffix }}</strong>
    <span>{{ label }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: [Number, String], required: true },
  label: { type: String, required: true },
  suffix: { type: String, default: '' },
  duration: { type: Number, default: 1 },
  format: { type: String, default: 'number' },
  currency: { type: String, default: '€' },
  glow: { type: Boolean, default: false },
})

const displayValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  if (props.format === 'currency') return `${props.currency}${props.value.toLocaleString('en-GB')}`
  if (props.format === 'percentage') return `${props.value}%`
  return props.value >= 1000 ? `${(props.value / 1000).toFixed(1)}K` : props.value.toLocaleString('en-GB')
})
</script>

<style scoped>
.stats-counter { display: grid; gap: .4rem; }.stats-counter strong { color: var(--arena-text); font: 650 clamp(1.35rem,3vw,2.3rem)/1 var(--font-mono); font-variant-numeric: tabular-nums; }.stats-counter span { color: var(--arena-dim); font: 600 .6rem var(--font-mono); letter-spacing: .1em; text-transform: uppercase; }
</style>
