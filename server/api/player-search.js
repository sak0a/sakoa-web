import { executeQuery } from '../utils/database.js';
import { validateAndConvertSteamID } from '../utils/steamid.js';
import { getSeasonTableName, isValidSeason, getSeasonInfo, getCurrentSeason } from '../utils/seasons.js';
import { getCachedData, generateDbCacheKey } from '../utils/cache.js';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const steamidInput = query.steamid;
    const seasonNumber = parseInt(query.season) || await getCurrentSeason();

    // Validate required parameters
    if (!steamidInput) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Please enter a player name or SteamID'
      });
    }

    // Validate season number
    if (!(await isValidSeason(seasonNumber))) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid season number: ${seasonNumber}`
      });
    }

    // Get the correct table name and season info
    const tableName = await getSeasonTableName(seasonNumber);
    const seasonInfo = await getSeasonInfo(seasonNumber);

    const selectCols = `
      steamid, name, kills, deaths,
      CASE WHEN deaths = 0 THEN kills ELSE ROUND(kills / deaths, 2) END as kd_ratio,
      lastLogout, firstLogin, lastLogin, playtime, points, topspeed, deflections
    `;

    // Try SteamID first, fall back to name search
    const steamidValidation = validateAndConvertSteamID(steamidInput);
    let players;

    if (steamidValidation.valid) {
      const searchSteamID = steamidValidation.steamId;
      console.log(`Searching by steamid: ${searchSteamID}, season=${seasonNumber}`);
      players = await executeQuery(
        `SELECT ${selectCols} FROM ${tableName} WHERE steamid = ? LIMIT 1`,
        [searchSteamID]
      );
    }

    // If no SteamID match (or invalid format), search by name
    if (!players || players.length === 0) {
      const searchName = steamidInput.trim();
      console.log(`Searching by name: "${searchName}", season=${seasonNumber}`);
      players = await executeQuery(
        `SELECT ${selectCols} FROM ${tableName} WHERE name LIKE ? ORDER BY points DESC LIMIT 1`,
        [`%${searchName}%`]
      );
    }

    if (players.length === 0) {
      return {
        success: false,
        error: `Player not found in ${seasonInfo.displayName}`,
        data: {
          player: null,
          season: seasonInfo,
          searchedSteamID: steamidInput
        }
      };
    }

    const player = players[0];

    // Get player's rank by counting players with better stats
    // We'll use points as the default ranking metric
    const rankSql = `
      SELECT COUNT(*) + 1 as rank
      FROM ${tableName}
      WHERE points > ?
        AND name IS NOT NULL
        AND name != ''
        AND points > 0
    `;

    const rankResult = await executeQuery(rankSql, [player.points]);
    const rank = rankResult[0]?.rank || 1;

    // Format the player data
    const formattedPlayer = {
      ...player,
      rank,
      playtimeHours: Math.round(player.playtime / 3600 * 100) / 100,
      lastLoginDate: player.lastLogin ? new Date(player.lastLogin * 1000).toLocaleDateString() : 'Never',
      firstLoginDate: player.firstLogin ? new Date(player.firstLogin * 1000).toLocaleDateString() : 'Unknown',
      lastLogoutDate: player.lastLogout ? new Date(player.lastLogout * 1000).toLocaleDateString() : 'Never'
    };

    return {
      success: true,
      data: {
        player: formattedPlayer,
        season: seasonInfo,
        searchedSteamID: player.steamid
      }
    };

  } catch (error) {
    console.error('Player search error:', error);

    // Handle specific error cases
    if (error.statusCode) {
      throw error; // Re-throw HTTP errors
    }

    return {
      success: false,
      error: 'Database connection failed or player search error',
      data: {
        player: null,
        season: null,
        searchedSteamID: null
      }
    };
  }
});
