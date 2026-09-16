import { createError, getMethod, getRequestURL, setResponseHeader } from 'h3';
import {
  assertSameOriginRequest,
  isMutation,
  requireAdminSession,
  requireCsrfToken
} from '../utils/admin-auth.js';

export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname;
  if (!pathname.startsWith('/api/admin/')) return;

  setResponseHeader(event, 'Cache-Control', 'no-store');
  const method = getMethod(event).toUpperCase();
  const isAuthRoute = pathname === '/api/admin/auth';

  if (isMutation(method)) assertSameOriginRequest(event);

  // Login and status checks are the only unauthenticated admin operations.
  if (isAuthRoute && (method === 'POST' || method === 'GET')) return;

  const session = requireAdminSession(event);
  event.context.adminSession = session;
  if ((pathname === '/api/admin/tf2' || pathname.startsWith('/api/admin/tf2/')) && !session.steam64) {
    throw createError({ statusCode: 403, statusMessage: 'Sign in with your configured owner Steam account to manage TF2 servers' });
  }
  if (isMutation(method)) requireCsrfToken(event, session);
});
