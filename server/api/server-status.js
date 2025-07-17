import { GameDig } from 'gamedig';
import fs from 'fs';
import path from 'path';
import { getCachedData, generateServerCacheKey, cache, CacheEntry } from '../utils/cache.js';
import { queryServerInBackground } from '../utils/background-worker.js';

// Get the absolute path to the project root directory
// In production, we need to go up from .output/server to the root
const projectRoot = process.cwd().includes('.output/server')
  ? path.join(process.cwd(), '../../')
  : process.cwd();
const serversFilePath = path.join(projectRoot, 'server/data/servers.json');

// Helper function to read servers data
async function getServersData() {
  try {
    const data = await fs.promises.readFile(serversFilePath, 'utf8');
    const serversData = JSON.parse(data);
    return serversData.servers || [];
  } catch (error) {
    console.error('Error reading servers data:', error);
    console.error('Attempted to read from:', serversFilePath);

    // Fallback to hardcoded servers if file doesn't exist
    return [
      {
        id: 'main',
        name: "𝘴𝘢𝘬𝘢 Dodgeball Server",
        host: '45.81.234.145',
        port: 27015,
        location: '🇩🇪 Frankfurt',
        connectUrl: 'steam://connect/45.81.234.145:27015',
        comingSoon: false
      },
      {
        id: 'advanced',
        name: "𝘴𝘢𝘬𝘢 Dodgeball Server - Advanced",
        host: '37.114.54.74',
        port: 27015,
        location: '🇩🇪 Frankfurt',
        connectUrl: 'steam://connect/37.114.54.74:27015',
        comingSoon: true
      }
    ];
  }
}

// Legacy queryServer function - now uses background worker
async function queryServer(server) {
  try {
    return await queryServerInBackground(server, {
      timeout: 5000,
      maxAttempts: 2,
      silent: true // Reduce console spam
    });
  } catch (error) {
    // Return offline status for any errors
    return {
      id: server.id,
      status: 'offline',
      name: server.name,
      map: 'Unknown',
      maxplayers: 24,
      players: [],
      location: server.location,
      connectUrl: server.connectUrl,
      comingSoon: server.comingSoon || false,
      error: `Server is offline or unreachable: ${error.message}`
    };
  }
}

// Async function to query server and update cache (runs in background)
async function queryServerAsync(server, cacheKey) {
  try {
    // Use background worker for async queries too
    const result = await queryServerInBackground(server, {
      timeout: 5000,
      maxAttempts: 2,
      silent: true // No console spam
    });

    // Get cache settings for TTL
    const settings = await getCacheSettings();
    const ttl = settings.serverStatus || 30;

    // Store result in cache
    const entry = new CacheEntry(result, ttl);
    cache.set(cacheKey, entry);

    // Only log status changes or errors
    if (result.status === 'offline' && result.error) {
      console.warn(`Server ${server.id} is offline: ${result.error}`);
    }
  } catch (error) {
    // Store offline status in cache
    const offlineResult = {
      id: server.id,
      status: 'offline',
      name: server.name,
      map: 'Unknown',
      maxplayers: 24,
      players: [],
      location: server.location,
      connectUrl: server.connectUrl,
      comingSoon: server.comingSoon || false,
      error: error.message || 'Failed to query server'
    };

    const settings = await getCacheSettings();
    const ttl = settings.serverStatus || 30;
    const entry = new CacheEntry(offlineResult, ttl);
    cache.set(cacheKey, entry);

    console.error(`Background query failed for server ${server.id}:`, error.message);
  }
}

// Import getCacheSettings function
async function getCacheSettings() {
  try {
    const projectRoot = process.cwd().includes('.output/server')
      ? path.join(process.cwd(), '../../')
      : process.cwd();
    const settingsFilePath = path.join(projectRoot, 'server/data/settings.json');

    const data = await fs.promises.readFile(settingsFilePath, 'utf8');
    const settings = JSON.parse(data);

    if (settings.cache) {
      return {
        serverStatus: settings.cache.serverStatusInterval || 30
      };
    }
  } catch (error) {
    console.warn('Failed to load cache settings, using defaults:', error.message);
  }

  return { serverStatus: 30 };
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const forceRefresh = query.force === 'true';
  const serverId = query.serverId; // Optional: query specific server

  try {
    // Get servers from file
    const servers = await getServersData();

    // If specific server requested, handle it individually
    if (serverId) {
      const server = servers.find(s => s.id === serverId);
      if (!server) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Server not found'
        });
      }

      const cacheKey = generateServerCacheKey(serverId);
      const result = await getCachedData(
        cacheKey,
        () => queryServer(server),
        'serverStatus',
        forceRefresh
      );

      return {
        server: result.data,
        cache: {
          cached: result.cached,
          timestamp: result.timestamp,
          ttl: result.ttl,
          source: result.source
        }
      };
    }

    // Handle all servers - return cached data immediately, start fresh queries for expired entries
    const serverResults = [];

    for (const server of servers) {
      const cacheKey = generateServerCacheKey(server.id);

      try {
        // First, check if we have valid cached data
        const cached = cache.get(cacheKey);

        if (cached && !cached.isExpired() && !forceRefresh) {
          // Return cached data immediately
          serverResults.push({
            ...cached.data,
            cache: {
              cached: true,
              timestamp: cached.timestamp,
              ttl: cached.getRemainingTTL(),
              source: 'cache'
            }
          });
        } else {
          // No valid cache - start async query but return checking status immediately
          const checkingStatus = {
            id: server.id,
            status: 'checking',
            name: server.name,
            map: 'Unknown',
            maxplayers: 24,
            players: [],
            location: server.location,
            connectUrl: server.connectUrl,
            comingSoon: server.comingSoon || false,
            cache: {
              cached: false,
              timestamp: Date.now(),
              ttl: 0,
              source: 'checking'
            }
          };

          serverResults.push(checkingStatus);

          // Start async query (don't await - let it run in background)
          queryServerAsync(server, cacheKey);
        }
      } catch (error) {
        console.error(`Failed to get status for server ${server.id}:`, error);

        // Return offline status for failed servers
        serverResults.push({
          id: server.id,
          status: 'offline',
          name: server.name,
          map: 'Unknown',
          maxplayers: 24,
          players: [],
          location: server.location,
          connectUrl: server.connectUrl,
          comingSoon: server.comingSoon || false,
          error: 'Failed to query server status',
          cache: {
            cached: false,
            timestamp: Date.now(),
            ttl: 0,
            source: 'error'
          }
        });
      }
    }

    return {
      servers: serverResults
    };

  } catch (error) {
    console.error('Unexpected error in server status API:', error);

    // Get servers from file for fallback
    const servers = await getServersData();

    return {
      servers: servers.map(server => ({
        id: server.id,
        status: 'offline',
        name: server.name,
        map: 'Unknown',
        maxplayers: 24,
        players: [],
        location: server.location,
        connectUrl: server.connectUrl,
        comingSoon: server.comingSoon || false,
        error: 'Failed to query server status',
        cache: {
          cached: false,
          timestamp: Date.now(),
          ttl: 0,
          source: 'error_fallback'
        }
      }))
    };
  }
});
