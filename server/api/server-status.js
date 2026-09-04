import { listGameServers } from '../repositories/game-servers.js';
import { queryServerInBackground } from '../utils/background-worker.js';
import { generateServerCacheKey, getCachedData } from '../utils/cache.js';

function cacheMetadata(result) {
  return {
    cached: result.cached,
    stale: result.source === 'expired_fallback',
    timestamp: result.timestamp,
    ttl: result.ttl,
    source: result.source
  };
}

function comingSoonStatus(server) {
  return {
    id: server.id,
    status: 'coming-soon',
    name: server.name,
    map: 'Not available yet',
    maxplayers: 0,
    players: [],
    location: server.location,
    connectUrl: server.connectUrl,
    comingSoon: true,
    queryTime: Date.now()
  };
}

async function getServerStatus(server) {
  if (server.comingSoon) {
    return {
      ...comingSoonStatus(server),
      cache: {
        cached: true,
        stale: false,
        timestamp: Date.now(),
        ttl: 0,
        source: 'configuration'
      }
    };
  }

  const result = await getCachedData(
    generateServerCacheKey(server.id),
    () => queryServerInBackground(server, {
      timeout: 5_000,
      maxAttempts: 2,
      silent: true
    }),
    'serverStatus'
  );

  return { ...result.data, cache: cacheMetadata(result) };
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const serverId = query.serverId ? String(query.serverId) : null;

  try {
    const servers = await listGameServers();

    if (serverId) {
      const server = servers.find((candidate) => candidate.id === serverId);
      if (!server) throw createError({ statusCode: 404, statusMessage: 'Server not found' });
      const status = await getServerStatus(server);
      return { server: status, cache: status.cache };
    }

    const statuses = await Promise.all(
      servers.map((server) => getServerStatus(server))
    );
    return { servers: statuses };
  } catch (error) {
    if (error?.statusCode) throw error;

    console.error('Server status is unavailable', {
      code: error?.code,
      message: error?.message
    });
    throw createError({
      statusCode: 503,
      statusMessage: 'Server status is temporarily unavailable'
    });
  }
});
