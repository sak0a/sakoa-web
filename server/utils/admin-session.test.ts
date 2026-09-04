import { describe, expect, it } from 'vitest';
import {
  ADMIN_SESSION_MAX_AGE,
  constantTimeEqual,
  createAdminSession,
  verifyAdminSession
} from './admin-session.js';

const secret = 'a-secure-test-secret-with-at-least-32-characters';
const now = Date.UTC(2026, 8, 4, 12, 0, 0);

describe('admin sessions', () => {
  it('signs and verifies an unexpired session', () => {
    const session = createAdminSession(secret, now);

    expect(verifyAdminSession(session.token, secret, now)).toEqual(session.payload);
    expect(session.payload.csrfToken).toHaveLength(43);
  });

  it('rejects a forged signature or payload', () => {
    const session = createAdminSession(secret, now);
    const [payload, signature] = session.token.split('.');

    expect(verifyAdminSession(`${payload}.${signature}x`, secret, now)).toBeNull();
    expect(verifyAdminSession(`${payload}x.${signature}`, secret, now)).toBeNull();
    expect(verifyAdminSession(session.token, `${secret}-wrong`, now)).toBeNull();
  });

  it('rejects expired sessions', () => {
    const session = createAdminSession(secret, now);
    const afterExpiry = now + (ADMIN_SESSION_MAX_AGE + 1) * 1000;

    expect(verifyAdminSession(session.token, secret, afterExpiry)).toBeNull();
  });

  it('compares passwords without early length checks', () => {
    expect(constantTimeEqual('correct horse', 'correct horse')).toBe(true);
    expect(constantTimeEqual('correct horse', 'wrong')).toBe(false);
  });
});
