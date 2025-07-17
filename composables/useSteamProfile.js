/**
 * Vue composable for fetching Steam profile data and avatars
 */

// Client-side cache for Steam profiles
const profileCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Helper function to check if cached data is still valid
function isCacheValid(cacheEntry) {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
}

// Helper function to get cached profile
function getCachedProfile(steamId) {
  const cacheEntry = profileCache.get(steamId);
  return isCacheValid(cacheEntry) ? cacheEntry.data : null;
}

// Helper function to set cached profile
function setCachedProfile(steamId, data) {
  profileCache.set(steamId, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Fetch Steam profile data for a single player
 * @param {string} steamId - Steam ID in Steam3 format
 * @param {string} avatarSize - Avatar size: 'small', 'medium', 'full'
 * @returns {Object} Reactive profile data
 */
export function useSteamProfile(steamId, avatarSize = 'medium') {
  const profile = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const fetchProfile = async () => {
    if (!steamId) {
      profile.value = null;
      return;
    }

    // Check client-side cache first
    const cachedProfile = getCachedProfile(steamId);
    if (cachedProfile) {
      profile.value = cachedProfile;
      loading.value = false;
      error.value = null;
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`/api/steam-profile?steamid=${encodeURIComponent(steamId)}&size=${avatarSize}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        profile.value = data.data;
        // Cache the profile data client-side
        setCachedProfile(steamId, data.data);
      } else {
        error.value = data.error || 'Failed to fetch profile';
        profile.value = null;
      }
    } catch (err) {
      console.error('Error fetching Steam profile:', err);
      error.value = err.message;
      profile.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Auto-fetch when steamId changes
  watch(() => steamId, fetchProfile, { immediate: true });

  return {
    profile: readonly(profile),
    loading: readonly(loading),
    error: readonly(error),
    refetch: fetchProfile
  };
}

/**
 * Fetch Steam avatars for multiple players
 * @param {Array} steamIds - Array of Steam IDs in Steam3 format
 * @param {string} avatarSize - Avatar size: 'small', 'medium', 'full'
 * @returns {Object} Reactive profiles data
 */
export function useSteamProfiles(steamIds, avatarSize = 'medium') {
  const profiles = ref({});
  const loading = ref(false);
  const error = ref(null);

  const fetchProfiles = async () => {
    if (!steamIds || !Array.isArray(steamIds) || steamIds.length === 0) {
      profiles.value = {};
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      // Check cache first and separate cached vs uncached IDs
      const newProfiles = {};
      const uncachedIds = [];

      steamIds.forEach(steamId => {
        const cachedProfile = getCachedProfile(steamId);
        if (cachedProfile) {
          newProfiles[steamId] = cachedProfile;
        } else {
          uncachedIds.push(steamId);
        }
      });

      // If all profiles are cached, return immediately
      if (uncachedIds.length === 0) {
        profiles.value = newProfiles;
        loading.value = false;
        return;
      }

      // Fetch only uncached profiles
      const promises = uncachedIds.map(async (steamId) => {
        try {
          const response = await fetch(`/api/steam-profile?steamid=${encodeURIComponent(steamId)}&size=${avatarSize}`);

          if (!response.ok) {
            console.warn(`Failed to fetch profile for ${steamId}: ${response.status}`);
            return { steamId, profile: null };
          }

          const data = await response.json();
          const profileData = data.success ? data.data : null;

          // Cache the profile data
          if (profileData) {
            setCachedProfile(steamId, profileData);
          }

          return { steamId, profile: profileData };
        } catch (err) {
          console.warn(`Error fetching profile for ${steamId}:`, err);
          return { steamId, profile: null };
        }
      });

      const results = await Promise.all(promises);

      // Add fetched profiles to the cached ones
      results.forEach(({ steamId, profile }) => {
        newProfiles[steamId] = profile;
      });

      profiles.value = newProfiles;
    } catch (err) {
      console.error('Error fetching Steam profiles:', err);
      error.value = err.message;
      profiles.value = {};
    } finally {
      loading.value = false;
    }
  };

  // Auto-fetch when steamIds changes
  watch(() => steamIds, fetchProfiles, { immediate: true, deep: true });

  return {
    profiles: readonly(profiles),
    loading: readonly(loading),
    error: readonly(error),
    refetch: fetchProfiles
  };
}

/**
 * Get Steam avatar URL for a player
 * @param {string} steamId - Steam ID in Steam3 format
 * @param {string} size - Avatar size: 'small', 'medium', 'full'
 * @returns {Object} Reactive avatar data
 */
export function useSteamAvatar(steamId, size = 'medium') {
  const { profile, loading, error } = useSteamProfile(steamId, size);
  
  const avatar = computed(() => {
    if (!profile.value) return null;
    
    switch (size) {
      case 'small':
        return profile.value.avatar;
      case 'full':
        return profile.value.avatarfull;
      case 'medium':
      default:
        return profile.value.avatarmedium || profile.value.avatar;
    }
  });

  const profileUrl = computed(() => {
    return profile.value?.profileurl || null;
  });

  const personaName = computed(() => {
    return profile.value?.personaname || 'Steam User';
  });

  return {
    avatar: readonly(avatar),
    profileUrl: readonly(profileUrl),
    personaName: readonly(personaName),
    loading: readonly(loading),
    error: readonly(error)
  };
}

/**
 * Create a fallback avatar URL when Steam profile is not available
 * @param {string} steamId - Steam ID for generating a unique fallback
 * @returns {string} Fallback avatar URL
 */
export function createFallbackAvatar(steamId) {
  // Use a service like DiceBear or Gravatar for fallback avatars
  // For now, return a simple colored circle based on steamId hash
  const hash = steamId ? steamId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0) : 0;
  
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  
  const color = colors[Math.abs(hash) % colors.length];
  
  // Return a simple SVG data URL for a colored circle
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="30" fill="${color}"/>
    <text x="32" y="38" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">?</text>
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
