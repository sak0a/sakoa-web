import { GameDig } from 'gamedig';
import fs from 'fs';
import path from 'path';
import { getCachedData, generateServerCacheKey, cache, CacheEntry } from '../utils/cache.js';

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

async function queryServer(server) {
  console.log(`Attempting to query TF2 server at ${server.host}:${server.port}`);

  // Query all servers normally, but mark coming soon servers

  try {
    // Try multiple game types with fast timeout for responsiveness
    const queryOptions = [
      { type: 'teamfortress2', host: server.host, port: server.port, maxAttempts: 2, socketTimeout: 3000, attemptTimeout: 5000 },
    ];

    let lastError = null;

    for (const options of queryOptions) {
      try {
        console.log(`Trying query with type: ${options.type}`);
        const state = await GameDig.query(options);

        console.log('Server query successful:', {
          name: state.name,
          map: state.map,
          players: state.players?.length || 0
        });

        return {
          id: server.id,
          status: 'online',
          name: state.name || server.name,
          map: state.map || 'Unknown',
          maxplayers: state.maxplayers || 24,
          players: (state.players || []).map(player => ({
            name: player.name || 'Unknown Player',
            score: player.raw?.score || 0,
            time: player.raw?.time || 0
          })),
          location: server.location,
          connectUrl: server.connectUrl,
          comingSoon: server.comingSoon || false
        };
      } catch (queryError) {
        console.warn(`Query failed with type ${options.type}:`, queryError.message);
        lastError = queryError;
        continue;
      }
    }

    // All query attempts failed, return offline status
    console.error('All server query attempts failed:', {
      message: lastError?.message || 'Unknown error',
      code: lastError?.code,
      host: server.host,
      port: server.port
    });

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
      error: `Server is offline or unreachable: ${lastError?.message || 'Connection failed'}`
    };

  } catch (error) {
    console.error('Unexpected error in server status query:', {
      message: error.message,
      code: error.code,
      host: server.host,
      port: server.port
    });

    // Return offline status for any unexpected errors
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
    console.log(`Starting async query for server ${server.id}...`);

    const result = await queryServer(server);

    // Get cache settings for TTL
    const settings = await getCacheSettings();
    const ttl = settings.serverStatus || 30;

    // Store result in cache
    const entry = new CacheEntry(result, ttl);
    cache.set(cacheKey, entry);

    console.log(`Async query completed for server ${server.id}: ${result.status}`);
  } catch (error) {
    console.error(`Async query failed for server ${server.id}:`, error);

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
