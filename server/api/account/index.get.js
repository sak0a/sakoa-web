import { defineEventHandler, getQuery } from 'h3';
import { useRuntimeConfig } from '#imports';
import { requirePlayerSession } from '../../utils/player-auth.js';
import { readPlayerDonor, readPlayerPreferences, readPlayerStats } from '../../repositories/player-account.js';

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
    readPlayerPreferences(session.steamid), readPlayerStats(session.steamid, getQuery(event).season)
  ]);
  const section = (index, fallback = null) => results[index].status === 'fulfilled' ? results[index].value : fallback;
  return {
    identity: { steamid: session.steamid, steam64: session.steam64, ...section(0, { name: 'Steam player', avatar: null }) },
    donor: section(1), preferences: section(2), stats: section(3),
    unavailable: { profile: results[0].status === 'rejected', donor: results[1].status === 'rejected', preferences: results[2].status === 'rejected', stats: results[3].status === 'rejected' },
    colorWritesEnabled: config.playerColorWritesEnabled === true || config.playerColorWritesEnabled === 'true'
  };
});
