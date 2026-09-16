import { createHash } from 'node:crypto';
import { createError } from 'h3';
import { executeQuery } from './database.js';
import { recordAdminAudit } from '../repositories/audit.js';

export async function runOperation(event, body, action, perform) {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(body?.operationId || '')) throw createError({ statusCode: 400, statusMessage: 'A UUID operation ID is required' });
  const actor = event.context.adminSession.steam64;
  const { operationId, ...payload } = body;
  const hash = createHash('sha256').update(JSON.stringify({ action, payload })).digest('hex');
  try {
    await executeQuery('INSERT INTO tf2_operations (id,actor_steam64,action,request_hash) VALUES (?,?,?,?)', [operationId, actor, action, hash]);
  } catch (error) {
    if (error.code !== 'ER_DUP_ENTRY') throw error;
    const [existing] = await executeQuery('SELECT actor_steam64, request_hash, status, result_json FROM tf2_operations WHERE id=?', [operationId]);
    if (existing.actor_steam64 !== actor || existing.request_hash !== hash) throw createError({ statusCode: 409, statusMessage: 'Operation ID was already used for another request' });
    if (existing.status === 'completed') return typeof existing.result_json === 'string' ? JSON.parse(existing.result_json) : existing.result_json;
    throw createError({ statusCode: 409, statusMessage: 'This operation was already attempted. Refresh and inspect its result before submitting another action.' });
  }
  // Record intent before any external mutation. Never log commands, config contents, or credentials.
  await recordAdminAudit({ actor, action: `tf2.${action}.requested`, target: String(payload.sid || payload.bid || ''), outcome: 'success' });
  try {
    const result = await perform();
    await executeQuery("UPDATE tf2_operations SET status='completed',result_json=? WHERE id=?", [JSON.stringify(result), operationId]);
    await recordAdminAudit({ actor, action: `tf2.${action}`, target: String(payload.sid || payload.bid || ''), outcome: result.partial ? 'failure' : 'success' });
    return result;
  } catch (error) {
    await executeQuery("UPDATE tf2_operations SET status='failed' WHERE id=?", [operationId]);
    await recordAdminAudit({ actor, action: `tf2.${action}`, target: String(payload.sid || payload.bid || ''), outcome: 'failure' });
    if (error.statusCode) throw error;
    throw createError({ statusCode: 502, statusMessage: 'Operation could not be confirmed. Refresh the current state before trying again.' });
  }
}
