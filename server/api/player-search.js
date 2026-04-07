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
    let isNameSearch = false;

    if (steamidValidation.valid) {
      const searchSteamID = steamidValidation.steamId;
      players = await executeQuery(
        `SELECT ${selectCols} FROM ${tableName} WHERE steamid = ? LIMIT 1`,
        [searchSteamID]
      );
    }

    // If no SteamID match (or invalid format), search by name — return up to 10
    if (!players || players.length === 0) {
      const searchName = steamidInput.trim();
      isNameSearch = true;
      players = await executeQuery(
        `SELECT ${selectCols} FROM ${tableName} WHERE name LIKE ? AND name IS NOT NULL AND name != '' ORDER BY points DESC LIMIT 10`,
        [`%${searchName}%`]
      );
    }

    if (players.length === 0) {
      return {
        success: false,
        error: `Player not found in ${seasonInfo.displayName}`,
        data: {
          player: null,
          players: [],
          season: seasonInfo
        }
      };
    }

    // Helper to format a player row
    const formatPlayer = async (p) => {
      const rankResult = await executeQuery(
        `SELECT COUNT(*) + 1 as \`rank\` FROM ${tableName} WHERE points > ? AND name IS NOT NULL AND name != '' AND points > 0`,
        [p.points]
      );
      return {
        ...p,
        rank: rankResult[0]?.rank || 1,
        playtimeHours: Math.round(p.playtime / 3600 * 100) / 100,
        lastLoginDate: p.lastLogin ? new Date(p.lastLogin * 1000).toLocaleDateString('de-DE') : 'Never',
        firstLoginDate: p.firstLogin ? new Date(p.firstLogin * 1000).toLocaleDateString('de-DE') : 'Unknown',
        lastLogoutDate: p.lastLogout ? new Date(p.lastLogout * 1000).toLocaleDateString('de-DE') : 'Never'
      };
    };

    // For name search with multiple results, return the list for the user to pick
    if (isNameSearch && players.length > 1) {
      const formatted = await Promise.all(players.map(formatPlayer));
      return {
        success: true,
        data: {
          player: null,
          players: formatted,
          season: seasonInfo,
          multiple: true
        }
      };
    }

    // Single result (exact steamid or single name match)
    const formattedPlayer = await formatPlayer(players[0]);

    return {
      success: true,
      data: {
        player: formattedPlayer,
        players: [],
        season: seasonInfo,
        searchedSteamID: formattedPlayer.steamid
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
