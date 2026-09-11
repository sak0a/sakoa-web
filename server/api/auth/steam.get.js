import { defineEventHandler, sendRedirect, setCookie, createError } from 'h3';
import { executeQuery } from '../../utils/database.js';
import { LOGIN_COOKIE, hashToken, randomToken, playerOrigin, playerCookieOptions, privateResponse } from '../../utils/player-auth.js';
import { steamLoginUrl } from '../../utils/steam-openid.js';

export default defineEventHandler(async event => {
  privateResponse(event);
  const origin = playerOrigin(event);
  const now = Math.floor(Date.now() / 1000);
  // Do not trust client-supplied forwarding headers for this abuse bound.
  const address = hashToken(event.node.req.socket.remoteAddress || 'unknown');
  await executeQuery('DELETE FROM player_login_states WHERE expires_at <= ? LIMIT 1000', [now]);
  const rows = await executeQuery('SELECT COUNT(*) AS attempts FROM player_login_states WHERE address_hash = ? AND expires_at > ?', [address, now]);
  if (Number(rows[0]?.attempts) >= 40) throw createError({ statusCode: 429, statusMessage: 'Too many sign-in attempts. Try again in ten minutes.' });
  const state = randomToken();
  await executeQuery('INSERT INTO player_login_states (token_hash, address_hash, expires_at) VALUES (?, ?, ?)', [hashToken(state), address, now + 600]);
  setCookie(event, LOGIN_COOKIE, state, playerCookieOptions(event, 600));
  return sendRedirect(event, steamLoginUrl(`${origin}/api/auth/steam/callback?state=${state}`, origin), 302);
});
