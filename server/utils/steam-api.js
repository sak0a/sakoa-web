import { getCachedData } from './cache.js';
import { getAccountId } from './steamid.js';

/**
 * Steam Web API utility for fetching player profiles and avatars
 * Uses Steam's ISteamUser/GetPlayerSummaries endpoint
 */

// Steam API configuration
const STEAM_API_BASE_URL = 'https://api.steampowered.com';

/**
 * Convert Steam3 ID to Steam64 ID for Steam Web API
 * Steam Web API requires Steam64 format
 */
function steam3ToSteam64(steam3Id) {
  if (!steam3Id || typeof steam3Id !== 'string') {
    return null;
  }

  // Extract account ID from Steam3 format [U:1:XXXXXXX]
  const accountId = getAccountId(steam3Id);
  if (!accountId) {
    return null;
  }

  // Convert to Steam64: 76561197960265728 + accountId
  const steam64 = BigInt('76561197960265728') + BigInt(accountId);
  return steam64.toString();
}

/**
 * Fetch player profile data from Steam Web API
 * @param {string} steamId - Steam ID in Steam3 format [U:1:XXXXXXX]
 * @param {string} apiKey - Steam Web API key (optional, will use public data if not provided)
 * @returns {Object|null} Player profile data or null if not found
 */
async function fetchSteamProfile(steamId, apiKey = null) {
  try {
    const steam64Id = steam3ToSteam64(steamId);
    if (!steam64Id) {
      console.error('Invalid Steam ID format:', steamId);
      return null;
    }

    // Build API URL - if no API key provided, try to get basic public data
    let apiUrl;
    if (apiKey) {
      // Use official Steam Web API with key
      apiUrl = `${STEAM_API_BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steam64Id}`;
    } else {
      // Fallback: Try to construct avatar URLs directly using Steam's public avatar system
      // This is a workaround when no API key is available
      return {
        steamid: steam64Id,
        avatar: `https://avatars.steamstatic.com/${steam64Id.slice(-2)}/${steam64Id}_medium.jpg`,
        avatarfull: `https://avatars.steamstatic.com/${steam64Id.slice(-2)}/${steam64Id}_full.jpg`,
        avatarmedium: `https://avatars.steamstatic.com/${steam64Id.slice(-2)}/${steam64Id}_medium.jpg`,
        personaname: 'Steam User',
        profileurl: `https://steamcommunity.com/profiles/${steam64Id}`,
        fallback: true
      };
    }

    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error('Steam API request failed:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (!data.response || !data.response.players || data.response.players.length === 0) {
      console.error('No player data found for Steam ID:', steamId);
      return null;
    }

    return data.response.players[0];
  } catch (error) {
    console.error('Error fetching Steam profile:', error);
    return null;
  }
}

/**
 * Get cached Steam profile data
 * @param {string} steamId - Steam ID in Steam3 format
 * @param {string} apiKey - Steam Web API key (optional)
 * @returns {Object|null} Cached or fresh profile data
 */
export async function getSteamProfile(steamId, apiKey = null) {
  if (!steamId) {
    return null;
  }

  const cacheKey = `steam_profile_${steamId}`;
  
  try {
    // Use steamProfiles cache type for proper TTL management
    const result = await getCachedData(
      cacheKey,
      () => fetchSteamProfile(steamId, apiKey),
      'steamProfiles'
    );

    return result.data;
  } catch (error) {
    console.error('Error getting cached Steam profile:', error);
    return null;
  }
}

/**
 * Get Steam avatar URL for a player
 * @param {string} steamId - Steam ID in Steam3 format
 * @param {string} size - Avatar size: 'small', 'medium', 'full' (default: 'medium')
 * @param {string} apiKey - Steam Web API key (optional)
 * @returns {string|null} Avatar URL or null if not found
 */
export async function getSteamAvatar(steamId, size = 'medium', apiKey = null) {
  const profile = await getSteamProfile(steamId, apiKey);
  if (!profile) {
    return null;
  }

  switch (size) {
    case 'small':
      return profile.avatar;
    case 'full':
      return profile.avatarfull;
    case 'medium':
    default:
      return profile.avatarmedium || profile.avatar;
  }
}

/**
 * Get Steam profile URL for a player
 * @param {string} steamId - Steam ID in Steam3 format
 * @returns {string|null} Steam profile URL or null if invalid
 */
export function getSteamProfileUrl(steamId) {
  const steam64Id = steam3ToSteam64(steamId);
  if (!steam64Id) {
    return null;
  }
  return `https://steamcommunity.com/profiles/${steam64Id}`;
}

/**
 * Batch fetch Steam profiles for multiple players
 * @param {string[]} steamIds - Array of Steam IDs in Steam3 format
 * @param {string} apiKey - Steam Web API key (optional)
 * @returns {Object} Map of steamId -> profile data
 */
export async function getBatchSteamProfiles(steamIds, apiKey = null) {
  if (!Array.isArray(steamIds) || steamIds.length === 0) {
    return {};
  }

  const profiles = {};
  
  // Process in batches of 100 (Steam API limit)
  const batchSize = 100;
  for (let i = 0; i < steamIds.length; i += batchSize) {
    const batch = steamIds.slice(i, i + batchSize);
    
    // Fetch profiles for this batch
    const batchPromises = batch.map(steamId => 
      getSteamProfile(steamId, apiKey).then(profile => ({ steamId, profile }))
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    // Add to results map
    batchResults.forEach(({ steamId, profile }) => {
      if (profile) {
        profiles[steamId] = profile;
      }
    });
  }

  return profiles;
}

/**
 * Check if Steam API key is configured
 * @returns {boolean} True if API key is available
 */
export function hasSteamApiKey() {
  try {
    const config = useRuntimeConfig();
    return !!config.steamApiKey;
  } catch {
    return !!process.env.STEAM_API_KEY;
  }
}

/**
 * Get the configured Steam API key
 * @returns {string|null} Steam API key or null if not configured
 */
export function getSteamApiKey() {
  try {
    const config = useRuntimeConfig();
    return config.steamApiKey || null;
  } catch {
    return process.env.STEAM_API_KEY || null;
  }
}
