import { createHash } from 'node:crypto';
import {
  createError,
  deleteCookie,
  getCookie,
  getHeader,
  getRequestURL,
  setCookie
} from 'h3';
import { useRuntimeConfig } from '#imports';
import {
  ADMIN_SESSION_MAX_AGE,
  constantTimeEqual,
  verifyAdminSession
} from './admin-session.js';

export const ADMIN_SESSION_COOKIE = 'admin-session';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
let warnedAboutDevelopmentSecret = false;

export function getAdminSessionSecret(event) {
  const config = useRuntimeConfig(event);
  const configuredSecret = process.env.ADMIN_SESSION_SECRET || config.adminSessionSecret;

  if (typeof configuredSecret === 'string' && configuredSecret.length >= 32) {
    return configuredSecret;
  }

  // Keep local development usable during migration, but never derive a production
  // signing key from the login password.
  if (process.env.NODE_ENV !== 'production' && config.adminPassword) {
    if (!warnedAboutDevelopmentSecret) {
      console.warn('ADMIN_SESSION_SECRET is not configured; deriving a development-only session key.');
      warnedAboutDevelopmentSecret = true;
    }
    return createHash('sha256')
      .update(`development-admin-session:${config.adminPassword}`)
      .digest('hex');
  }

  throw createError({
    statusCode: 503,
    statusMessage: 'Admin sessions are not configured'
  });
}

export function readAdminSession(event) {
  const token = getCookie(event, ADMIN_SESSION_COOKIE);
  if (!token) return null;

  const session = verifyAdminSession(token, getAdminSessionSecret(event));
  if (!session) clearAdminSession(event);
  return session;
}

export function setAdminSession(event, token) {
  setCookie(event, ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: '/'
  });
}

export function clearAdminSession(event) {
  deleteCookie(event, ADMIN_SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
}

export function requireAdminSession(event) {
  const session = readAdminSession(event);
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Admin authentication required' });
  }
  return session;
}

export function isMutation(method) {
  return !SAFE_METHODS.has(String(method || '').toUpperCase());
}

export function getExpectedOrigin(event) {
  const configuredSiteUrl = useRuntimeConfig(event).public?.siteUrl;
  if (configuredSiteUrl) {
    try {
      return new URL(configuredSiteUrl).origin;
    } catch {
      throw createError({
        statusCode: 503,
        statusMessage: 'PUBLIC_SITE_URL is not a valid absolute URL'
      });
    }
  }

  const forwardedProto = getHeader(event, 'x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = getHeader(event, 'x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || getHeader(event, 'host');
  const protocol = forwardedProto || getRequestURL(event).protocol.replace(':', '');

  if (!host || !protocol) return null;
  return `${protocol}://${host}`;
}

export function assertSameOriginRequest(event) {
  const expectedOrigin = getExpectedOrigin(event);
  const suppliedOrigin = getHeader(event, 'origin');
  const referer = getHeader(event, 'referer');

  let requestOrigin = suppliedOrigin;
  if (!requestOrigin && referer) {
    try {
      requestOrigin = new URL(referer).origin;
    } catch {
      requestOrigin = null;
    }
  }

  if (!expectedOrigin || !requestOrigin || requestOrigin !== expectedOrigin) {
    throw createError({ statusCode: 403, statusMessage: 'Cross-origin admin request rejected' });
  }
}

export function requireCsrfToken(event, session) {
  const suppliedToken = getHeader(event, 'x-csrf-token');
  if (!suppliedToken || !constantTimeEqual(suppliedToken, session.csrfToken)) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid CSRF token' });
  }
}
