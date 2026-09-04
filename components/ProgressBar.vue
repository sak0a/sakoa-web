<template>
  <div class="progress-bar-container">
    <div class="progress-copy">
      <div><span>{{ label }}</span><strong>{{ formatCurrency(current) }} raised</strong></div>
      <div class="progress-target"><span>Target</span><strong>{{ formatCurrency(target) }}</strong></div>
    </div>
    <div
      class="progress-track"
      role="progressbar"
      :aria-label="label"
      aria-valuemin="0"
      :aria-valuemax="target"
      :aria-valuenow="Math.min(current, target)"
      :aria-valuetext="`${formatCurrency(current)} of ${formatCurrency(target)}, ${displayProgress}%`"
    >
      <div class="progress-fill" :style="{ width: `${animatedProgress}%` }" />
      <span
        v-for="milestone in milestones"
        :key="milestone.value"
        class="milestone"
        :class="{ 'is-reached': actualProgress >= milestone.value }"
        :style="{ left: `${Math.min(100, Math.max(0, milestone.value))}%` }"
        aria-hidden="true"
      />
    </div>
    <div class="progress-foot"><span>0%</span><strong>{{ displayProgress }}% funded</strong><span>100%</span></div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  current: { type: Number, required: true },
  target: { type: Number, required: true },
  label: { type: String, default: 'Progress' },
  currency: { type: String, default: '€' },
  milestones: { type: Array, default: () => [{ value: 25 }, { value: 50 }, { value: 75 }] },
  animated: { type: Boolean, default: true },
  duration: { type: Number, default: 1.2 },
})

const animatedProgress = ref(0)
const actualProgress = computed(() => props.target > 0 ? Math.min(Math.max((props.current / props.target) * 100, 0), 100) : 0)
const displayProgress = computed(() => Math.round(actualProgress.value))
const formatCurrency = value => `${props.currency}${(Number(value) || 0).toLocaleString('en-GB', { maximumFractionDigits: 2 })}`

const updateProgress = () => {
  const reduceMotion = import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  animatedProgress.value = (!props.animated || reduceMotion) ? actualProgress.value : 0
  if (props.animated && !reduceMotion) requestAnimationFrame(() => { animatedProgress.value = actualProgress.value })
}

onMounted(updateProgress)
watch(actualProgress, updateProgress)
</script>

<style scoped>
.progress-copy { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }.progress-copy > div { display: grid; gap: .35rem; }.progress-copy span { color: var(--arena-dim); font: 600 .6rem var(--font-mono); letter-spacing: .09em; text-transform: uppercase; }.progress-copy strong { color: var(--arena-text); font: 650 1rem var(--font-mono); font-variant-numeric: tabular-nums; }.progress-target { text-align: right; }
.progress-track { position: relative; height: .8rem; background: #211e26; border: 1px solid var(--arena-line-strong); }.progress-fill { height: 100%; background: var(--arena-violet); transition: width 1.2s cubic-bezier(.22,1,.36,1); }.milestone { position: absolute; top: -4px; width: 1px; height: 1.2rem; background: #50495a; }.milestone.is-reached { background: var(--arena-violet-soft); }.progress-foot { display: flex; justify-content: space-between; margin-top: .7rem; color: var(--arena-dim); font: 550 .6rem var(--font-mono); }.progress-foot strong { color: var(--arena-violet-soft); font-weight: 600; }
@media (prefers-reduced-motion: reduce) { .progress-fill { transition: none; } }
</style>
