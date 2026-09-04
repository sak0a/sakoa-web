import { createError, getHeader, getMethod, readBody, setResponseHeader } from 'h3';
import { useRuntimeConfig } from '#imports';
import {
  clearAdminSession,
  getAdminSessionSecret,
  readAdminSession,
  setAdminSession
} from '../../utils/admin-auth.js';
import { constantTimeEqual, createAdminSession } from '../../utils/admin-session.js';

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const loginAttempts = new Map();

function getClientAddress(event) {
  return getHeader(event, 'cf-connecting-ip')
    || getHeader(event, 'x-real-ip')
    || getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    || event.node.req.socket.remoteAddress
    || 'unknown';
}

function getAttemptState(key, now = Date.now()) {
  const state = loginAttempts.get(key);
  if (!state || now - state.startedAt >= ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(key);
    return null;
  }
  return state;
}

function enforceLoginRateLimit(event) {
  const state = getAttemptState(getClientAddress(event));
  if (!state || state.failures < MAX_ATTEMPTS) return;

  const retryAfter = Math.max(1, Math.ceil((ATTEMPT_WINDOW_MS - (Date.now() - state.startedAt)) / 1000));
  setResponseHeader(event, 'Retry-After', String(retryAfter));
  throw createError({
    statusCode: 429,
    statusMessage: 'Too many login attempts. Please try again later.'
  });
}

function recordLoginFailure(event) {
  const key = getClientAddress(event);
  const now = Date.now();

  if (loginAttempts.size >= 1000) {
    for (const [address, attempt] of loginAttempts) {
      if (now - attempt.startedAt >= ATTEMPT_WINDOW_MS) loginAttempts.delete(address);
    }
    if (loginAttempts.size >= 1000) loginAttempts.delete(loginAttempts.keys().next().value);
  }

  const state = getAttemptState(key, now) || { failures: 0, startedAt: now };
  state.failures += 1;
  loginAttempts.set(key, state);
}

function clearLoginFailures(event) {
  loginAttempts.delete(getClientAddress(event));
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event).toUpperCase();
  const config = useRuntimeConfig(event);

  if (method === 'POST') {
    enforceLoginRateLimit(event);
    const body = await readBody(event);
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!password) {
      throw createError({ statusCode: 400, statusMessage: 'Password is required' });
    }
    if (!config.adminPassword) {
      throw createError({ statusCode: 503, statusMessage: 'Admin login is not configured' });
    }
    if (!constantTimeEqual(password, config.adminPassword)) {
      recordLoginFailure(event);
      throw createError({ statusCode: 401, statusMessage: 'Invalid password' });
    }

    clearLoginFailures(event);
    const session = createAdminSession(getAdminSessionSecret(event));
    setAdminSession(event, session.token);
    return {
      success: true,
      authenticated: true,
      csrfToken: session.payload.csrfToken,
      expiresAt: session.payload.expiresAt
    };
  }

  if (method === 'GET') {
    const session = readAdminSession(event);
    return {
      authenticated: Boolean(session),
      csrfToken: session?.csrfToken || null,
      expiresAt: session?.expiresAt || null
    };
  }

  if (method === 'PATCH') {
    const currentSession = event.context.adminSession;
    const session = createAdminSession(
      getAdminSessionSecret(event),
      Date.now(),
      currentSession.csrfToken
    );
    setAdminSession(event, session.token);
    return {
      success: true,
      authenticated: true,
      csrfToken: session.payload.csrfToken,
      expiresAt: session.payload.expiresAt
    };
  }

  if (method === 'DELETE') {
    clearAdminSession(event);
    return { success: true, authenticated: false };
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
