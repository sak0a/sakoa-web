<template>
  <div class="steam-avatar-container" :class="containerClass">
    <!-- Loading state -->
    <div v-if="loading" class="steam-avatar-loading" :style="{ width: size, height: size }">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- Avatar image -->
    <div v-else class="steam-avatar-wrapper" :style="{ width: size, height: size }">
      <img
        :src="avatarUrl"
        :alt="`${personaName}'s Steam Avatar`"
        :title="showTooltip ? `${personaName} - Click to view Steam profile` : undefined"
        class="steam-avatar-image"
        :class="imageClass"
        @error="onImageError"
        @click="onAvatarClick"
      />
      
      <!-- Online status indicator (if enabled) -->
      <div 
        v-if="showStatus && profile && profile.personastate !== undefined" 
        class="steam-status-indicator"
        :class="getStatusClass(profile.personastate)"
        :title="getStatusText(profile.personastate)"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { useSteamProfile, createFallbackAvatar } from '~/composables/useSteamProfile.js';

const props = defineProps({
  steamId: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: '48px'
  },
  avatarSize: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'full'].includes(value)
  },
  clickable: {
    type: Boolean,
    default: true
  },
  showStatus: {
    type: Boolean,
    default: false
  },
  showTooltip: {
    type: Boolean,
    default: true
  },
  fallbackColor: {
    type: String,
    default: null
  },
  containerClass: {
    type: String,
    default: ''
  },
  imageClass: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['click', 'error']);

// Use the Steam profile composable
const { profile, loading, error } = useSteamProfile(props.steamId, props.avatarSize);

// Reactive avatar URL with fallback
const avatarUrl = ref(null);
const imageError = ref(false);

// Watch for profile changes to update avatar URL
watch([profile, () => props.avatarSize], () => {
  if (profile.value && !imageError.value) {
    switch (props.avatarSize) {
      case 'small':
        avatarUrl.value = profile.value.avatar;
        break;
      case 'full':
        avatarUrl.value = profile.value.avatarfull;
        break;
      case 'medium':
      default:
        avatarUrl.value = profile.value.avatarmedium || profile.value.avatar;
        break;
    }
  } else {
    // Use fallback avatar
    avatarUrl.value = createFallbackAvatar(props.steamId);
  }
}, { immediate: true });

// Computed persona name
const personaName = computed(() => {
  return profile.value?.personaname || 'Steam User';
});

// Handle image load errors
const onImageError = () => {
  imageError.value = true;
  avatarUrl.value = createFallbackAvatar(props.steamId);
  emit('error', { steamId: props.steamId, error: 'Failed to load avatar' });
};

// Handle avatar clicks
const onAvatarClick = () => {
  if (props.clickable) {
    const profileUrl = profile.value?.profileurl;
    if (profileUrl) {
      window.open(profileUrl, '_blank', 'noopener,noreferrer');
    }
    emit('click', { steamId: props.steamId, profile: profile.value });
  }
};

// Status indicator helpers
const getStatusClass = (personaState) => {
  switch (personaState) {
    case 1: return 'status-online';
    case 2: return 'status-busy';
    case 3: return 'status-away';
    case 4: return 'status-snooze';
    case 5: return 'status-looking-to-trade';
    case 6: return 'status-looking-to-play';
    default: return 'status-offline';
  }
};

const getStatusText = (personaState) => {
  switch (personaState) {
    case 1: return 'Online';
    case 2: return 'Busy';
    case 3: return 'Away';
    case 4: return 'Snooze';
    case 5: return 'Looking to Trade';
    case 6: return 'Looking to Play';
    default: return 'Offline';
  }
};
</script>

<style scoped>
.steam-avatar-container {
  position: relative;
  display: inline-block;
}

.steam-avatar-wrapper {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(115, 76, 150, 0.1);
  border: 2px solid rgba(115, 76, 150, 0.2);
  transition: all 0.3s ease;
}

.steam-avatar-wrapper:hover {
  border-color: rgba(115, 76, 150, 0.4);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(115, 76, 150, 0.3);
}

.steam-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: all 0.3s ease;
}

.steam-avatar-image:hover {
  filter: brightness(1.1);
}

.steam-avatar-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(115, 76, 150, 0.1);
  border: 2px solid rgba(115, 76, 150, 0.2);
}

.loading-spinner {
  width: 50%;
  height: 50%;
  border: 2px solid transparent;
  border-top: 2px solid #734C96;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Status indicators */
.steam-status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(26, 26, 26, 0.8);
  z-index: 10;
}

.status-online { background-color: #57cbde; }
.status-busy { background-color: #ff6b6b; }
.status-away { background-color: #ffa726; }
.status-snooze { background-color: #ab47bc; }
.status-looking-to-trade { background-color: #66bb6a; }
.status-looking-to-play { background-color: #42a5f5; }
.status-offline { background-color: #757575; }

/* Responsive sizing */
@media (max-width: 768px) {
  .steam-avatar-wrapper:hover {
    transform: scale(1.02);
  }
}
</style>
