import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;
const SESSION_VERSION = 1;

function encode(value) {
  return Buffer.from(value).toString('base64url');
}

function decode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function digest(value) {
  return createHash('sha256').update(String(value)).digest();
}

export function constantTimeEqual(left, right) {
  return timingSafeEqual(digest(left), digest(right));
}

export function signAdminSession(payload, secret) {
  const encodedPayload = encode(JSON.stringify(payload));
  const signature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function createAdminSession(secret, now = Date.now(), csrfToken = randomBytes(32).toString('base64url')) {
  const issuedAt = Math.floor(now / 1000);
  const payload = {
    version: SESSION_VERSION,
    issuedAt,
    expiresAt: issuedAt + ADMIN_SESSION_MAX_AGE,
    csrfToken
  };

  return { payload, token: signAdminSession(payload, secret) };
}

export function verifyAdminSession(token, secret, now = Date.now()) {
  if (typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  const [encodedPayload, suppliedSignature] = parts;
  const expectedSignature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  if (!constantTimeEqual(suppliedSignature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(decode(encodedPayload));
    const nowSeconds = Math.floor(now / 1000);

    if (
      payload.version !== SESSION_VERSION ||
      !Number.isInteger(payload.issuedAt) ||
      !Number.isInteger(payload.expiresAt) ||
      typeof payload.csrfToken !== 'string' ||
      payload.csrfToken.length < 32 ||
      payload.issuedAt > nowSeconds + 60 ||
      payload.expiresAt <= nowSeconds ||
      payload.expiresAt - payload.issuedAt > ADMIN_SESSION_MAX_AGE
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function adminSessionFingerprint(session) {
  return createHash('sha256')
    .update(`${session.version}:${session.issuedAt}:${session.csrfToken}`)
    .digest('hex')
    .slice(0, 24);
}
