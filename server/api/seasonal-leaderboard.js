import { executeQuery } from '../utils/database.js';
import {
  getCurrentSeason,
  getSeasonInfo,
  getSeasonTableName,
  isValidSeason
} from '../utils/seasons.js';
import { generateDbCacheKey, getCachedData } from '../utils/cache.js';

const SORT_FIELDS = new Set(['topspeed', 'points', 'playtime', 'kills', 'deaths']);
const SORT_ORDERS = new Set(['asc', 'desc']);

function formatPlayer(player, index) {
  return {
    ...player,
    rank: index + 1,
    playtimeHours: Math.round((player.playtime / 3600) * 100) / 100,
    lastLoginDate: player.lastLogin
      ? new Date(player.lastLogin * 1000).toLocaleDateString('de-DE')
      : 'Never',
    firstLoginDate: player.firstLogin
      ? new Date(player.firstLogin * 1000).toLocaleDateString('de-DE')
      : 'Unknown'
  };
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const parsedSeason = Number.parseInt(String(query.season || ''), 10);
  const targetSeason = Number.isFinite(parsedSeason) ? parsedSeason : await getCurrentSeason();
  const sortBy = String(query.sortBy || 'points');
  const order = String(query.order || 'desc').toLowerCase();
  const requestedLimit = Number.parseInt(String(query.limit || '50'), 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 50)
    : 50;

  if (!(await isValidSeason(targetSeason))) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid season number: ${targetSeason}`
    });
  }

  if (!SORT_FIELDS.has(sortBy)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid sort field. Must be one of: ${[...SORT_FIELDS].join(', ')}`
    });
  }

  if (!SORT_ORDERS.has(order)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid order. Must be "asc" or "desc"'
    });
  }

  const tableName = await getSeasonTableName(targetSeason);
  const season = await getSeasonInfo(targetSeason);
  const sql = `
    SELECT
      steamid,
      name,
      kills,
      deaths,
      CASE WHEN deaths = 0 THEN kills ELSE ROUND(kills / deaths, 2) END AS kd_ratio,
      lastLogout,
      firstLogin,
      lastLogin,
      playtime,
      points,
      topspeed,
      deflections
    FROM ${tableName}
    WHERE name IS NOT NULL
      AND name != ''
      AND ${sortBy} > 0
    ORDER BY ${sortBy} ${order.toUpperCase()}
    LIMIT ?
  `;
  const cacheKey = generateDbCacheKey(
    sql,
    [limit],
    `season_${targetSeason}_${sortBy}_${order}_${limit}`
  );

  try {
    const result = await getCachedData(
      cacheKey,
      async () => {
        const players = await executeQuery(sql, [limit]);
        const rankedPlayers = players.map(formatPlayer);

        return {
          players: rankedPlayers,
          season,
          sortBy,
          order,
          total: rankedPlayers.length
        };
      },
      'seasonalLeaderboard'
    );

    return {
      success: true,
      data: result.data,
      cache: {
        cached: result.cached,
        stale: result.source === 'expired_fallback',
        timestamp: result.timestamp,
        ttl: result.ttl,
        source: result.source
      }
    };
  } catch (error) {
    console.error('Seasonal leaderboard query failed', {
      code: error?.code,
      message: error?.message,
      season: targetSeason
    });

    throw createError({
      statusCode: 503,
      statusMessage: 'Seasonal leaderboard data is temporarily unavailable'
    });
  }
});
