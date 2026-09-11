import { defineEventHandler, getQuery } from 'h3';
import { useRuntimeConfig } from '#imports';
import { requirePlayerSession } from '../../utils/player-auth.js';
import { readPlayerAdmin, readPlayerDonor, readPlayerPreferences, readPlayerStats } from '../../repositories/player-account.js';

async function profile(steam64, apiKey) {
  if (!apiKey) return { name: 'Steam player', avatar: null };
  const url = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/');
  url.search = new URLSearchParams({ key: apiKey, steamids: steam64 }).toString();
  const result = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: 'error' });
  if (!result.ok) throw new Error('Profile unavailable');
  const body = await result.json();
  const user = body.response?.players?.find(player => player.steamid === steam64);
  const avatar = typeof user?.avatarmedium === 'string' && /^https:\/\/avatars\.(steamstatic\.com|akamai\.steamstatic\.com|cloudflare\.steamstatic\.com)\//.test(user.avatarmedium) ? user.avatarmedium : null;
  return { name: user?.personaname || 'Steam player', avatar };
}

export default defineEventHandler(async event => {
  const session = await requirePlayerSession(event);
  const config = useRuntimeConfig(event);
  const results = await Promise.allSettled([
    profile(session.steam64, config.steamApiKey), readPlayerDonor(session.steamid),
    readPlayerStats(session.steamid, getQuery(event).season), readPlayerAdmin(session.steamid)
  ]);
  const section = (index, fallback = null) => results[index].status === 'fulfilled' ? results[index].value : fallback;
  const admin = section(3, false);
  const canStyle = Boolean(section(1)?.active || admin);
  let preferences = null;
  let preferencesUnavailable = false;
  if (canStyle) {
    try { preferences = await readPlayerPreferences(session.steamid); }
    catch { preferencesUnavailable = true; }
  }
  return {
    access: { admin, canStyle },
    identity: { steamid: session.steamid, steam64: session.steam64, ...section(0, { name: 'Steam player', avatar: null }) },
    donor: section(1), preferences, stats: section(2),
    unavailable: { profile: results[0].status === 'rejected', donor: results[1].status === 'rejected', preferences: preferencesUnavailable, stats: results[2].status === 'rejected', admin: results[3].status === 'rejected' },
    colorWritesEnabled: config.playerColorWritesEnabled === true || config.playerColorWritesEnabled === 'true'
  };
});
