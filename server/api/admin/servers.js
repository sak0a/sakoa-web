import { adminSessionFingerprint } from '../../utils/admin-session.js';
import { clearCacheByPattern } from '../../utils/cache.js';
import { recordAdminAudit } from '../../repositories/audit.js';
import {
  createGameServer,
  deleteGameServer,
  listGameServers,
  updateGameServer
} from '../../repositories/game-servers.js';

async function audit(event, action, target, outcome, metadata = null) {
  try {
    await recordAdminAudit({
      actor: adminSessionFingerprint(event.context.adminSession),
      action,
      target,
      outcome,
      metadata
    });
  } catch (error) {
    console.error('Could not record server audit event', { action, message: error?.message });
  }
}

function resultError(result) {
  throw createError({
    statusCode: result.missing ? 404 : result.conflict ? 409 : 400,
    statusMessage: result.errors.join(', ')
  });
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event).toUpperCase();

  if (method === 'GET') {
    return { servers: await listGameServers({ includeDisabled: true }) };
  }

  if (method === 'POST') {
    const body = await readBody(event);
    const result = await createGameServer(
      body?.server,
      adminSessionFingerprint(event.context.adminSession)
    );
    if (!result.success) resultError(result);
    clearCacheByPattern('^server_status');
    await audit(event, 'server.create', result.data.id, 'success');
    setResponseStatus(event, 201);
    return { success: true, message: 'Server added successfully', server: result.data };
  }

  if (method === 'PUT') {
    const body = await readBody(event);
    const index = Number(body?.index);
    const servers = await listGameServers({ includeDisabled: true });
    if (!Number.isInteger(index) || index < 0 || !servers[index]) {
      throw createError({ statusCode: 404, statusMessage: 'Server not found' });
    }

    const result = await updateGameServer(
      servers[index].id,
      body?.server,
      adminSessionFingerprint(event.context.adminSession)
    );
    if (!result.success) resultError(result);
    clearCacheByPattern('^server_status');
    await audit(event, 'server.update', result.data.id, 'success');
    return { success: true, message: 'Server updated successfully', server: result.data };
  }

  if (method === 'DELETE') {
    const index = Number.parseInt(String(getQuery(event).index ?? ''), 10);
    const servers = await listGameServers({ includeDisabled: true });
    if (!Number.isInteger(index) || index < 0 || !servers[index]) {
      throw createError({ statusCode: 404, statusMessage: 'Server not found' });
    }

    const deleted = await deleteGameServer(servers[index].id);
    if (!deleted) throw createError({ statusCode: 404, statusMessage: 'Server not found' });
    clearCacheByPattern('^server_status');
    await audit(event, 'server.delete', servers[index].id, 'success');
    return { success: true, message: 'Server deleted successfully', deletedServer: servers[index] };
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
