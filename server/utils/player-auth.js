import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createError, getCookie, getHeader, setCookie, deleteCookie, setResponseHeader } from 'h3';
import { useRuntimeConfig } from '#imports';
import { executeQuery } from './database.js';
import { steam64ToSteam3 } from './steam-openid.js';

export const PLAYER_COOKIE = 'saka-player';
export const LOGIN_COOKIE = 'saka-steam-login';
export const SESSION_SECONDS = 60 * 60 * 24 * 7;
export const randomToken = () => randomBytes(32).toString('hex');
export const hashToken = token => createHash('sha256').update(token).digest('hex');
export const validToken = token => typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);

export function playerOrigin(event) {
  const raw = useRuntimeConfig(event).public.siteUrl || process.env.PUBLIC_SITE_URL;
  try {
    const url = new URL(raw);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error();
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error();
    return url.origin;
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Steam login needs a configured site URL' });
  }
}

export function privateResponse(event) {
  setResponseHeader(event, 'Cache-Control', 'private, no-store');
  setResponseHeader(event, 'Vary', 'Cookie');
  setResponseHeader(event, 'Referrer-Policy', 'no-referrer');
}

export function playerCookieOptions(event, maxAge) {
  return { httpOnly: true, secure: playerOrigin(event).startsWith('https:'), sameSite: 'lax', path: '/', maxAge };
}

export async function readPlayerSession(event) {
  privateResponse(event);
  const token = getCookie(event, PLAYER_COOKIE);
  if (!validToken(token)) return null;
  const rows = await executeQuery('SELECT steam64, csrf_token, expires_at FROM player_sessions WHERE token_hash = ? AND expires_at > ?', [hashToken(token), Math.floor(Date.now() / 1000)]);
  const row = rows[0];
  const steamid = row && steam64ToSteam3(row.steam64);
  if (!steamid) return null;
  return { steam64: row.steam64, steamid, csrfToken: row.csrf_token, expiresAt: Number(row.expires_at) };
}

export async function requirePlayerSession(event, mutation = false) {
  const session = await readPlayerSession(event);
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Sign in through Steam to continue' });
  if (mutation) {
    const csrf = getHeader(event, 'x-csrf-token');
    if (getHeader(event, 'origin') !== playerOrigin(event) || !validToken(csrf)
      || !timingSafeEqual(Buffer.from(csrf), Buffer.from(session.csrfToken))) {
      throw createError({ statusCode: 403, statusMessage: 'Please refresh your account and try again' });
    }
  }
  return session;
}

export async function issuePlayerSession(event, steam64) {
  const token = randomToken();
  const old = getCookie(event, PLAYER_COOKIE);
  if (validToken(old)) await executeQuery('DELETE FROM player_sessions WHERE token_hash = ?', [hashToken(old)]);
  await executeQuery('DELETE FROM player_sessions WHERE expires_at <= ? LIMIT 1000', [Math.floor(Date.now() / 1000)]);
  await executeQuery('INSERT INTO player_sessions (token_hash, steam64, csrf_token, expires_at) VALUES (?, ?, ?, ?)',
    [hashToken(token), steam64, randomToken(), Math.floor(Date.now() / 1000) + SESSION_SECONDS]);
  setCookie(event, PLAYER_COOKIE, token, playerCookieOptions(event, SESSION_SECONDS));
}

export async function revokePlayerSession(event) {
  const token = getCookie(event, PLAYER_COOKIE);
  if (validToken(token)) await executeQuery('DELETE FROM player_sessions WHERE token_hash = ?', [hashToken(token)]);
  deleteCookie(event, PLAYER_COOKIE, playerCookieOptions(event, 0));
}
