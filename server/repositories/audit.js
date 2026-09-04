import { executeQuery } from '../utils/database.js';

/**
 * @param {{
 *   actor: string,
 *   action: string,
 *   target?: string | null,
 *   outcome: 'success' | 'failure' | 'denied',
 *   metadata?: Record<string, unknown> | null
 * }} event
 */
export async function recordAdminAudit({ actor, action, target = null, outcome, metadata = null }) {
  const sanitizedMetadata = metadata ? JSON.stringify(metadata) : null;

  await executeQuery(
    `INSERT INTO admin_audit_events
      (actor_fingerprint, action, target, outcome, metadata)
     VALUES (?, ?, ?, ?, ?)`,
    [actor, action, target, outcome, sanitizedMetadata]
  );
}

export async function getRecentAdminAudit(limit = 20) {
  const safeLimit = Math.min(Math.max(Number.parseInt(String(limit), 10) || 20, 1), 100);
  return executeQuery(
    `SELECT id, actor_fingerprint, action, target, outcome, metadata, created_at
     FROM admin_audit_events
     ORDER BY created_at DESC
     LIMIT ?`,
    [safeLimit]
  );
}
