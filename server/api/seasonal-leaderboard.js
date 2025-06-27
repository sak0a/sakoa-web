import { executeQuery } from '../utils/database.js';
import { getSeasonTableName, isValidSeason, getSeasonInfo } from '../utils/seasons.js';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const seasonNumber = parseInt(query.season) || null;
    const sortBy = query.sortBy || 'points';
    const order = query.order || 'desc';
    const limit = Math.min(parseInt(query.limit) || 50, 50); // Max 50 players

    // If no season specified, use current season
    let targetSeason = seasonNumber;
    if (!targetSeason) {
      // Import getCurrentSeason here to avoid circular dependency issues
      const { getCurrentSeason } = await import('../utils/seasons.js');
      targetSeason = await getCurrentSeason();
    }

    // Validate season number
    if (!(await isValidSeason(targetSeason))) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid season number: ${targetSeason}`
      });
    }

    // Validate sortBy parameter
    const validSortFields = ['topspeed', 'points', 'playtime', 'kills', 'deaths'];
    if (!validSortFields.includes(sortBy)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid sort field. Must be one of: ${validSortFields.join(', ')}`
      });
    }

    // Validate order parameter
    if (!['asc', 'desc'].includes(order.toLowerCase())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid order. Must be "asc" or "desc"'
      });
    }

    // Get the correct table name for the season
    const tableName = await getSeasonTableName(targetSeason);
    const seasonInfo = await getSeasonInfo(targetSeason);

    // Build the SQL query
    const sql = `
      SELECT
        steamid,
        name,
        kills,
        deaths,
        CASE
          WHEN deaths = 0 THEN kills
          ELSE ROUND(kills / deaths, 2)
        END as kd_ratio,
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

    console.log(`Executing seasonal leaderboard query: season=${targetSeason}, table=${tableName}, sortBy=${sortBy}, order=${order}, limit=${limit}`);

    const players = await executeQuery(sql, [limit]);

    // Add ranking to each player
    const rankedPlayers = players.map((player, index) => ({
      ...player,
      rank: index + 1,
      // Format playtime to hours
      playtimeHours: Math.round(player.playtime / 3600 * 100) / 100,
      // Convert timestamps to readable dates
      lastLoginDate: player.lastLogin ? new Date(player.lastLogin * 1000).toLocaleDateString() : 'Never',
      firstLoginDate: player.firstLogin ? new Date(player.firstLogin * 1000).toLocaleDateString() : 'Unknown'
    }));

    return {
      success: true,
      data: {
        players: rankedPlayers,
        season: seasonInfo,
        sortBy,
        order,
        total: rankedPlayers.length
      }
    };

  } catch (error) {
    console.error('Seasonal leaderboard error:', error);

    // Return mock data for development/fallback
    const mockPlayers = [
      {
        rank: 1,
        steamid: '76561198000000001',
        name: 'saka',
        kills: 1250,
        deaths: 180,
        kd_ratio: 6.94,
        playtime: 432000, // 120 hours
        playtimeHours: 120,
        points: 15420,
        topspeed: 3200,
        deflections: 890,
        lastLoginDate: '2024-01-15',
        firstLoginDate: '2023-06-01'
      },
      {
        rank: 2,
        steamid: '76561198000000002',
        name: 'ProPlayer123',
        kills: 980,
        deaths: 220,
        kd_ratio: 4.45,
        playtime: 324000, // 90 hours
        playtimeHours: 90,
        points: 12800,
        topspeed: 2950,
        deflections: 720,
        lastLoginDate: '2024-01-14',
        firstLoginDate: '2023-08-15'
      }
    ];

    return {
      success: false,
      error: error.message || 'Database connection failed',
      data: {
        players: mockPlayers,
        season: {
          seasonNumber: 1,
          name: 'Season 1',
          displayName: 'Season 1 (Current)',
          isCurrent: true,
          tableName: 'sakaStats'
        },
        sortBy: 'points',
        order: 'desc',
        total: mockPlayers.length
      }
    };
  }
});
