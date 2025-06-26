import { executeQuery } from '../utils/database.js';
import { validateAndConvertSteamID } from '../utils/steamid.js';
import { getSeasonTableName, isValidSeason, getSeasonInfo, getCurrentSeason } from '../utils/seasons.js';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const steamidInput = query.steamid;
    const seasonNumber = parseInt(query.season) || getCurrentSeason();

    // Validate required parameters
    if (!steamidInput) {
      throw createError({
        statusCode: 400,
        statusMessage: 'SteamID parameter is required'
      });
    }

    // Validate and convert SteamID
    const steamidValidation = validateAndConvertSteamID(steamidInput);
    if (!steamidValidation.valid) {
      throw createError({
        statusCode: 400,
        statusMessage: steamidValidation.error
      });
    }

    // Convert to SteamID3 format for database search (since that's what the DB stores)
    let searchSteamID = steamidValidation.steamID64;

    // Convert SteamID64 to SteamID3 format for database search
    if (steamidValidation.steamID64) {
      const accountID = BigInt(steamidValidation.steamID64) - BigInt('76561197960265728');
      searchSteamID = `[U:1:${accountID}]`;
    }

    // Validate season number
    if (!isValidSeason(seasonNumber)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid season number: ${seasonNumber}`
      });
    }

    // Get the correct table name and season info
    const tableName = getSeasonTableName(seasonNumber);
    const seasonInfo = getSeasonInfo(seasonNumber);

    // Build the SQL query to find the player
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
      WHERE steamid = ?
      LIMIT 1
    `;

    console.log(`Searching for player: steamid=${searchSteamID}, season=${seasonNumber}, table=${tableName}`);

    const players = await executeQuery(sql, [searchSteamID]);

    if (players.length === 0) {
      return {
        success: false,
        error: `Player not found in ${seasonInfo.displayName}`,
        data: {
          player: null,
          season: seasonInfo,
          searchedSteamID: searchSteamID
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
        searchedSteamID: searchSteamID
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
