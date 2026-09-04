<template>
  <div class="steam-avatar" :class="containerClass" :style="{ width: size, height: size }">
    <div v-if="loading" class="avatar-loading" role="status"><span class="sr-only">Loading Steam avatar</span></div>
    <a
      v-else-if="clickable && profileUrl"
      :href="profileUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="avatar-frame is-clickable"
      :aria-label="`Open ${personaName}'s Steam profile in a new tab`"
      @click="emitClick"
    >
      <NuxtImg :src="avatarUrl" :alt="`${personaName}'s Steam avatar`" class="avatar-image" :width="pixelSize" :height="pixelSize" loading="lazy" format="webp" preset="avatar" @error="onImageError" />
      <span v-if="showStatus && profile?.personastate !== undefined" class="steam-state" :class="statusClass(profile.personastate)"><span class="sr-only">{{ statusText(profile.personastate) }}</span></span>
    </a>
    <div v-else class="avatar-frame">
      <NuxtImg :src="avatarUrl" :alt="`${personaName}'s Steam avatar`" class="avatar-image" :width="pixelSize" :height="pixelSize" loading="lazy" format="webp" preset="avatar" @error="onImageError" />
      <span v-if="showStatus && profile?.personastate !== undefined" class="steam-state" :class="statusClass(profile.personastate)"><span class="sr-only">{{ statusText(profile.personastate) }}</span></span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { createFallbackAvatar, useSteamProfile } from '~/composables/useSteamProfile.js'

const props = defineProps({
  steamId: { type: String, required: true },
  size: { type: String, default: '48px' },
  avatarSize: { type: String, default: 'medium', validator: value => ['small', 'medium', 'full'].includes(value) },
  clickable: { type: Boolean, default: true },
  showStatus: { type: Boolean, default: false },
  showTooltip: { type: Boolean, default: true },
  fallbackColor: { type: String, default: null },
  containerClass: { type: String, default: '' },
  imageClass: { type: String, default: '' },
})
const emit = defineEmits(['click', 'error'])
const { profile, loading } = useSteamProfile(props.steamId, props.avatarSize)
const avatarUrl = ref(createFallbackAvatar(props.steamId))
const imageError = ref(false)
const pixelSize = computed(() => Number.parseInt(props.size, 10) || 48)
const personaName = computed(() => profile.value?.personaname || 'Steam user')
const profileUrl = computed(() => {
  try {
    const url = new URL(profile.value?.profileurl || '')
    return url.protocol === 'https:' && url.hostname.endsWith('steamcommunity.com') ? url.toString() : null
  } catch { return null }
})

watch([profile, () => props.avatarSize], () => {
  imageError.value = false
  if (!profile.value) {
    avatarUrl.value = createFallbackAvatar(props.steamId)
    return
  }
  avatarUrl.value = props.avatarSize === 'small'
    ? profile.value.avatar
    : props.avatarSize === 'full'
      ? profile.value.avatarfull
      : (profile.value.avatarmedium || profile.value.avatar)
})

const onImageError = () => {
  if (imageError.value) return
  imageError.value = true
  avatarUrl.value = createFallbackAvatar(props.steamId)
  emit('error', { steamId: props.steamId, error: 'Failed to load avatar' })
}
const emitClick = () => emit('click', { steamId: props.steamId, profile: profile.value })
const statusClass = state => ({ 1: 'is-online', 2: 'is-busy', 3: 'is-away', 4: 'is-away', 5: 'is-online', 6: 'is-online' }[state] || 'is-offline')
const statusText = state => ({ 1: 'Online', 2: 'Busy', 3: 'Away', 4: 'Snooze', 5: 'Looking to trade', 6: 'Looking to play' }[state] || 'Offline')
</script>

<style scoped>
.steam-avatar, .avatar-frame { position: relative; display: block; flex: 0 0 auto; }.steam-avatar { background: #211e26; }.avatar-frame { width: 100%; height: 100%; overflow: hidden; border: 1px solid var(--arena-line-strong); border-radius: .38rem; }.avatar-frame.is-clickable { transition: border-color 160ms ease, transform 160ms ease; }.avatar-frame.is-clickable:hover { border-color: var(--arena-violet-soft); transform: translateY(-1px); }.avatar-image { width: 100%; height: 100%; object-fit: cover; }.avatar-loading { width: 100%; height: 100%; border: 1px solid var(--arena-line); background: #211e26; animation: avatar-load 1s ease-in-out infinite alternate; }.steam-state { position: absolute; right: .18rem; bottom: .18rem; width: .48rem; height: .48rem; border: 2px solid #111016; border-radius: 50%; background: var(--arena-dim); }.steam-state.is-online { background: var(--arena-success); }.steam-state.is-busy { background: var(--arena-danger); }.steam-state.is-away { background: var(--arena-warning); }
@keyframes avatar-load { to { background: #2a2630; } }
@media (prefers-reduced-motion: reduce) { .avatar-loading { animation: none; } }
</style>
