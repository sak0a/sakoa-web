import { getSteamProfile, getSteamAvatar, getSteamProfileUrl, getSteamApiKey } from '../utils/steam-api.js';
import { validateAndConvertSteamID } from '../utils/steamid.js';

/**
 * API endpoint to fetch Steam profile data including avatar
 * GET /api/steam-profile?steamid=<steamid>&size=<avatar_size>
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { steamid, size = 'medium' } = query;

    // Validate required parameters
    if (!steamid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Steam ID is required'
      });
    }

    // Validate and normalize Steam ID
    const steamidValidation = validateAndConvertSteamID(steamid);
    if (!steamidValidation.valid) {
      throw createError({
        statusCode: 400,
        statusMessage: steamidValidation.error
      });
    }

    const normalizedSteamId = steamidValidation.steamId;
    const apiKey = getSteamApiKey();

    // Fetch Steam profile data
    const profile = await getSteamProfile(normalizedSteamId, apiKey);
    
    if (!profile) {
      // Return a fallback response instead of an error
      return {
        success: true,
        data: {
          steamid: normalizedSteamId,
          avatar: null,
          avatarmedium: null,
          avatarfull: null,
          personaname: 'Steam User',
          profileurl: getSteamProfileUrl(normalizedSteamId),
          fallback: true,
          error: 'Profile data not available'
        },
        cached: false,
        source: 'fallback'
      };
    }

    // Get specific avatar size if requested
    let avatarUrl = null;
    if (size && ['small', 'medium', 'full'].includes(size)) {
      avatarUrl = await getSteamAvatar(normalizedSteamId, size, apiKey);
    }

    return {
      success: true,
      data: {
        steamid: profile.steamid,
        personaname: profile.personaname || 'Steam User',
        profileurl: profile.profileurl || getSteamProfileUrl(normalizedSteamId),
        avatar: profile.avatar,
        avatarmedium: profile.avatarmedium || profile.avatar,
        avatarfull: profile.avatarfull || profile.avatar,
        requestedAvatar: avatarUrl,
        personastate: profile.personastate,
        communityvisibilitystate: profile.communityvisibilitystate,
        profilestate: profile.profilestate,
        lastlogoff: profile.lastlogoff,
        commentpermission: profile.commentpermission,
        realname: profile.realname,
        primaryclanid: profile.primaryclanid,
        timecreated: profile.timecreated,
        gameid: profile.gameid,
        gameserverip: profile.gameserverip,
        gameextrainfo: profile.gameextrainfo,
        cityid: profile.cityid,
        loccountrycode: profile.loccountrycode,
        locstatecode: profile.locstatecode,
        loccityid: profile.loccityid,
        fallback: profile.fallback || false
      },
      cached: true,
      timestamp: new Date().toISOString(),
      source: apiKey ? 'steam_api' : 'fallback'
    };

  } catch (error) {
    console.error('Steam profile API error:', error);

    // Return error response
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch Steam profile data'
    });
  }
});
