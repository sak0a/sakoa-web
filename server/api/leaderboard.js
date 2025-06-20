import { executeQuery } from '../utils/database.js';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const sortBy = query.sortBy || 'points';
    const order = query.order || 'desc';
    const limit = Math.min(parseInt(query.limit) || 50, 50); // Max 50 players

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
      FROM sakaStats
      WHERE name IS NOT NULL
        AND name != ''
        AND ${sortBy} > 0
      ORDER BY ${sortBy} ${order.toUpperCase()}
      LIMIT ?
    `;

    console.log(`Executing leaderboard query: sortBy=${sortBy}, order=${order}, limit=${limit}`);

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

    console.log(`Leaderboard query successful: ${rankedPlayers.length} players found`);

    return {
      success: true,
      data: {
        players: rankedPlayers,
        sortBy,
        order,
        total: rankedPlayers.length
      }
    };

  } catch (error) {
    console.error('Leaderboard API error:', error);

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
      },
      {
        rank: 3,
        steamid: '76561198000000003',
        name: 'DodgeballMaster',
        kills: 850,
        deaths: 190,
        kd_ratio: 4.47,
        playtime: 288000, // 80 hours
        playtimeHours: 80,
        points: 11200,
        topspeed: 2800,
        deflections: 650,
        lastLoginDate: '2024-01-13',
        firstLoginDate: '2023-09-01'
      },
      {
        rank: 4,
        steamid: '76561198000000004',
        name: 'RocketMaster',
        kills: 720,
        deaths: 160,
        kd_ratio: 4.5,
        playtime: 216000, // 60 hours
        playtimeHours: 60,
        points: 9800,
        topspeed: 2650,
        deflections: 580,
        lastLoginDate: '2024-01-12',
        firstLoginDate: '2023-10-01'
      },
      {
        rank: 5,
        steamid: '76561198000000005',
        name: 'SpeedDemon',
        kills: 680,
        deaths: 140,
        kd_ratio: 4.86,
        playtime: 180000, // 50 hours
        playtimeHours: 50,
        points: 8900,
        topspeed: 2500,
        deflections: 520,
        lastLoginDate: '2024-01-11',
        firstLoginDate: '2023-11-15'
      },
      {
        rank: 6,
        steamid: '76561198000000006',
        name: 'DeflectKing',
        kills: 620,
        deaths: 130,
        kd_ratio: 4.77,
        playtime: 162000, // 45 hours
        playtimeHours: 45,
        points: 8200,
        topspeed: 2400,
        deflections: 480,
        lastLoginDate: '2024-01-10',
        firstLoginDate: '2023-12-01'
      },
      {
        rank: 7,
        steamid: '76561198000000007',
        name: 'AirborneAce',
        kills: 580,
        deaths: 125,
        kd_ratio: 4.64,
        playtime: 144000, // 40 hours
        playtimeHours: 40,
        points: 7800,
        topspeed: 2350,
        deflections: 450,
        lastLoginDate: '2024-01-09',
        firstLoginDate: '2023-12-15'
      },
      {
        rank: 8,
        steamid: '76561198000000008',
        name: 'QuickReflexes',
        kills: 540,
        deaths: 120,
        kd_ratio: 4.5,
        playtime: 126000, // 35 hours
        playtimeHours: 35,
        points: 7400,
        topspeed: 2300,
        deflections: 420,
        lastLoginDate: '2024-01-08',
        firstLoginDate: '2024-01-01'
      },
      {
        rank: 9,
        steamid: '76561198000000009',
        name: 'PrecisionPlayer',
        kills: 500,
        deaths: 115,
        kd_ratio: 4.35,
        playtime: 108000, // 30 hours
        playtimeHours: 30,
        points: 7000,
        topspeed: 2250,
        deflections: 390,
        lastLoginDate: '2024-01-07',
        firstLoginDate: '2024-01-02'
      },
      {
        rank: 10,
        steamid: '76561198000000010',
        name: 'SteadyShooter',
        kills: 460,
        deaths: 110,
        kd_ratio: 4.18,
        playtime: 90000, // 25 hours
        playtimeHours: 25,
        points: 6600,
        topspeed: 2200,
        deflections: 360,
        lastLoginDate: '2024-01-06',
        firstLoginDate: '2024-01-03'
      },
      {
        rank: 11,
        steamid: '76561198000000011',
        name: 'ConsistentPlayer',
        kills: 420,
        deaths: 105,
        kd_ratio: 4.0,
        playtime: 72000, // 20 hours
        playtimeHours: 20,
        points: 6200,
        topspeed: 2150,
        deflections: 330,
        lastLoginDate: '2024-01-05',
        firstLoginDate: '2024-01-04'
      },
      {
        rank: 12,
        steamid: '76561198000000012',
        name: 'NewcomerPro',
        kills: 380,
        deaths: 100,
        kd_ratio: 3.8,
        playtime: 54000, // 15 hours
        playtimeHours: 15,
        points: 5800,
        topspeed: 2100,
        deflections: 300,
        lastLoginDate: '2024-01-04',
        firstLoginDate: '2024-01-05'
      }
    ];

    // Sort mock data based on requested sort field
    const sortBy = getQuery(event).sortBy || 'points';
    const order = getQuery(event).order || 'desc';

    mockPlayers.sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return order === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Re-rank after sorting
    mockPlayers.forEach((player, index) => {
      player.rank = index + 1;
    });

    return {
      success: false,
      error: error.message,
      data: {
        players: mockPlayers,
        sortBy,
        order,
        total: mockPlayers.length
      }
    };
  }
});
