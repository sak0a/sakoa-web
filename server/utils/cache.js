// Centralized caching system for server and database data
import { getSettingsRecord } from '../repositories/settings.js';

// Cache storage
const cache = new Map();
const inFlightRequests = new Map();

// Default cache intervals (in seconds)
const DEFAULT_INTERVALS = {
  serverStatus: 30,    // Server status updates every 30 seconds
  leaderboard: 10,     // Database queries every 10 seconds
  playerSearch: 10,    // Player search cache
  seasonalLeaderboard: 10,
  databaseStatus: 5,   // Database status checks
  donors: 30,          // Donor data cache
  steamProfiles: 3600, // Steam profile data cache (1 hour)
  default: 30          // Default cache interval
};

// Get cache settings from admin settings
async function getCacheSettings() {
  try {
    const { settings } = await getSettingsRecord();
    
    if (settings.cache) {
      return {
        serverStatus: settings.cache.serverStatusInterval || DEFAULT_INTERVALS.serverStatus,
        leaderboard: settings.cache.leaderboardInterval || DEFAULT_INTERVALS.leaderboard,
        playerSearch: settings.cache.playerSearchInterval || DEFAULT_INTERVALS.playerSearch,
        seasonalLeaderboard: settings.cache.seasonalLeaderboardInterval || DEFAULT_INTERVALS.seasonalLeaderboard,
        databaseStatus: settings.cache.databaseStatusInterval || DEFAULT_INTERVALS.databaseStatus,
        steamProfiles: settings.cache.steamProfilesInterval || DEFAULT_INTERVALS.steamProfiles
      };
    }
  } catch (error) {
    console.warn('Failed to load cache settings, using defaults:', error.message);
  }
  
  return DEFAULT_INTERVALS;
}

// Cache entry structure
class CacheEntry {
  constructor(data, ttl) {
    this.data = data;
    this.timestamp = Date.now();
    this.ttl = ttl * 1000; // Convert seconds to milliseconds
    this.expiresAt = this.timestamp + this.ttl;
  }

  isExpired() {
    return Date.now() > this.expiresAt;
  }

  getRemainingTTL() {
    const remaining = this.expiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }
}

// Get cached data or execute function if cache is expired/missing
export async function getCachedData(key, fetchFunction, cacheType = 'default', forceRefresh = false) {
  const settings = await getCacheSettings();
  const ttl = settings[cacheType] || DEFAULT_INTERVALS[cacheType] || 30;

  // Check if we should force refresh
  if (forceRefresh) {
    cache.delete(key);
  }

  // Check if we have valid cached data
  const cached = cache.get(key);
  if (cached && !cached.isExpired()) {
    return {
      data: cached.data,
      cached: true,
      timestamp: cached.timestamp,
      ttl: cached.getRemainingTTL(),
      source: 'cache'
    };
  }

  if (!forceRefresh && inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  let request;
  request = (async () => {
    try {
      const freshData = await Promise.resolve().then(fetchFunction);
      const entry = new CacheEntry(freshData, ttl);
      cache.set(key, entry);

      return {
        data: freshData,
        cached: false,
        timestamp: entry.timestamp,
        ttl,
        source: 'fresh'
      };
    } catch (error) {
      if (cached) {
        return {
          data: cached.data,
          cached: true,
          timestamp: cached.timestamp,
          ttl: 0,
          source: 'expired_fallback',
          error: error instanceof Error ? error.message : 'Refresh failed'
        };
      }

      throw error;
    } finally {
      if (inFlightRequests.get(key) === request) {
        inFlightRequests.delete(key);
      }
    }
  })();

  inFlightRequests.set(key, request);
  return request;
}

// Clear specific cache entry
export function clearCache(key) {
  return cache.delete(key);
}

// Clear all cache entries
export function clearAllCache() {
  const size = cache.size;
  cache.clear();
  return size;
}

// Clear cache entries by pattern
export function clearCacheByPattern(pattern) {
  const regex = new RegExp(pattern);
  let cleared = 0;
  
  for (const [key] of cache) {
    if (regex.test(key)) {
      cache.delete(key);
      cleared++;
    }
  }
  
  return cleared;
}

// Get cache statistics
export function getCacheStats() {
  const stats = {
    totalEntries: cache.size,
    entries: [],
    memoryUsage: 0
  };

  for (const [key, entry] of cache) {
    const entryInfo = {
      key,
      timestamp: entry.timestamp,
      expiresAt: entry.expiresAt,
      ttlRemaining: entry.getRemainingTTL(),
      isExpired: entry.isExpired(),
      dataSize: JSON.stringify(entry.data).length
    };
    
    stats.entries.push(entryInfo);
    stats.memoryUsage += entryInfo.dataSize;
  }

  // Sort by expiration time
  stats.entries.sort((a, b) => a.expiresAt - b.expiresAt);

  return stats;
}

// Cleanup expired entries (can be called periodically)
export function cleanupExpiredCache() {
  let cleaned = 0;
  
  for (const [key, entry] of cache) {
    if (entry.isExpired()) {
      cache.delete(key);
      cleaned++;
    }
  }
  
  return cleaned;
}

// Generate cache key for database queries
export function generateDbCacheKey(query, params = [], additionalContext = '') {
  const paramString = params.length > 0 ? JSON.stringify(params) : '';
  const contextString = additionalContext ? `_${additionalContext}` : '';
  return `db_${Buffer.from(query + paramString + contextString).toString('base64').slice(0, 32)}`;
}

// Generate cache key for server status
export function generateServerCacheKey(serverId = 'all') {
  return `server_status_${serverId}`;
}

// Auto-cleanup interval (run every 5 minutes)
setInterval(() => {
  cleanupExpiredCache();
}, 5 * 60 * 1000);

export { DEFAULT_INTERVALS, cache, CacheEntry, inFlightRequests };
