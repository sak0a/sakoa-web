import { executeQuery } from '../utils/database.js';
import { validateAndConvertSteamID } from '../utils/steamid.js';
import { getSeasonTableName, isValidSeason, getSeasonInfo, getCurrentSeason } from '../utils/seasons.js';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const steamidInput = typeof query.steamid === 'string' ? query.steamid.trim() : '';
    const parsedSeason = Number.parseInt(String(query.season || ''), 10);
    const seasonNumber = Number.isFinite(parsedSeason) ? parsedSeason : await getCurrentSeason();

    // Validate required parameters
    if (!steamidInput || steamidInput.length > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Enter a player name or SteamID using at most 100 characters'
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
      p.steamid, p.name, p.kills, p.deaths,
      CASE WHEN p.deaths = 0 THEN p.kills ELSE ROUND(p.kills / p.deaths, 2) END as kd_ratio,
      p.lastLogout, p.firstLogin, p.lastLogin, p.playtime, p.points, p.topspeed, p.deflections,
      (
        SELECT COUNT(*) + 1
        FROM ${tableName} ranked
        WHERE ranked.points > p.points
          AND ranked.name IS NOT NULL
          AND ranked.name != ''
          AND ranked.points > 0
      ) AS player_rank
    `;

    // Try SteamID first, fall back to name search
    const steamidValidation = validateAndConvertSteamID(steamidInput);
    let players;
    let isNameSearch = false;

    if (steamidValidation.valid) {
      const searchSteamID = steamidValidation.steamId;
      players = await executeQuery(
        `SELECT ${selectCols} FROM ${tableName} p WHERE p.steamid = ? LIMIT 1`,
        [searchSteamID]
      );
    }

    // If no SteamID match (or invalid format), search by name — return up to 10
    if (!players || players.length === 0) {
      const searchName = steamidInput;
      isNameSearch = true;
      players = await executeQuery(
        `SELECT ${selectCols} FROM ${tableName} p WHERE p.name LIKE ? AND p.name IS NOT NULL AND p.name != '' ORDER BY p.points DESC LIMIT 10`,
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
    const formatPlayer = (p) => {
      return {
        ...p,
        rank: Number(p.player_rank) || 1,
        playtimeHours: Math.round(p.playtime / 3600 * 100) / 100,
        lastLoginDate: p.lastLogin ? new Date(p.lastLogin * 1000).toLocaleDateString('de-DE') : 'Never',
        firstLoginDate: p.firstLogin ? new Date(p.firstLogin * 1000).toLocaleDateString('de-DE') : 'Unknown',
        lastLogoutDate: p.lastLogout ? new Date(p.lastLogout * 1000).toLocaleDateString('de-DE') : 'Never'
      };
    };

    // For name search with multiple results, return the list for the user to pick
    if (isNameSearch && players.length > 1) {
      const formatted = players.map(formatPlayer);
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
    const formattedPlayer = formatPlayer(players[0]);

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

    throw createError({
      statusCode: 503,
      statusMessage: 'Player search is temporarily unavailable'
    });
  }
});
