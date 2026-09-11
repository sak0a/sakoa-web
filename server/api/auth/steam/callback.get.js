import { defineEventHandler, getCookie, getRequestURL, deleteCookie, sendRedirect } from 'h3';
import { executeQuery } from '../../../utils/database.js';
import { LOGIN_COOKIE, hashToken, validToken, playerOrigin, playerCookieOptions, privateResponse, issuePlayerSession } from '../../../utils/player-auth.js';
import { verifySteamAssertion } from '../../../utils/steam-openid.js';

export default defineEventHandler(async event => {
  privateResponse(event);
  const origin = playerOrigin(event);
  const params = getRequestURL(event).searchParams;
  const state = params.get('state');
  const cookie = getCookie(event, LOGIN_COOKIE);
  deleteCookie(event, LOGIN_COOKIE, playerCookieOptions(event, 0));
  try {
    if (!validToken(state) || cookie !== state || params.getAll('state').length !== 1) throw new Error('Invalid login state');
    // Atomic consume binds verification to one browser attempt, across all web instances.
    const consumed = await executeQuery('DELETE FROM player_login_states WHERE token_hash = ? AND expires_at > ?', [hashToken(state), Math.floor(Date.now() / 1000)]);
    if (consumed.affectedRows !== 1) throw new Error('Expired or reused login state');
    if (params.get('openid.mode') === 'cancel') return sendRedirect(event, '/?account=cancelled', 302);
    const steam64 = await verifySteamAssertion(params, `${origin}/api/auth/steam/callback?state=${state}`);
    await issuePlayerSession(event, steam64);
    return sendRedirect(event, '/?account=open', 302);
  } catch {
    // Never echo signed assertions, session tokens, or upstream errors into the URL/log.
    return sendRedirect(event, '/?account=login-failed', 302);
  }
});
