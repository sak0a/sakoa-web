import { defineEventHandler, getQuery, getMethod, readBody, createError } from 'h3';
/* eslint-disable no-control-regex -- Console commands must be a single line without NUL bytes. */
import { pteroRequest, readConfig, writeConfig, restoreConfig } from '../../../utils/pterodactyl.js';
import { configPath, integer, invalid } from '../../../utils/tf2-validation.js';
import { runOperation } from '../../../utils/tf2-operations.js';
import { sourceServer } from '../../../repositories/sourcebans.js';

export default defineEventHandler(async event => {
  if (getMethod(event) === 'GET') {
    const query = getQuery(event), sid = integer(query.sid);
    await sourceServer(sid);
    if (query.view === 'file') return readConfig(event, sid, query.path);
    if (query.view === 'files') {
      const directory = configPath(query.directory || '/tf/cfg', true);
      const response = await pteroRequest(event, sid, '/files/list', { query: { directory } });
      return { directory, files: response.data.map(f => ({ ...f.attributes, isDirectory: !f.attributes.is_file })).filter(f => !f.name.startsWith('.') && (f.isDirectory || /\.(cfg|txt|ini|json)$/i.test(f.name))) };
    }
    if (query.view === 'backups') return pteroRequest(event, sid, '/backups');
    if (query.view === 'status') return pteroRequest(event, sid, '/resources');
    throw invalid('Unknown server view');
  }
  if (getMethod(event) !== 'POST') throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
  const body = await readBody(event);
  const sid = integer(body?.sid);
  await sourceServer(sid);
  if (!['command', 'power', 'backup', 'save', 'restore'].includes(body.action)) throw invalid('Unknown operation');
  return runOperation(event, body, body.action, async () => {
    if (body.action === 'save') return writeConfig(event, body);
    if (body.action === 'restore') return restoreConfig(event, body);
    if (body.action === 'command') {
      if (typeof body.command !== 'string' || !body.command.trim() || body.command.length > 1000 || /[\x00-\x1f]/.test(body.command)) throw invalid('Enter a single console command up to 1000 characters');
      await pteroRequest(event, sid, '/command', { method: 'POST', body: { command: body.command } });
      return { sent: true, message: 'Pterodactyl accepted the command. Check the server console for its result.' };
    }
    if (body.action === 'power') {
      if (!['start', 'stop', 'restart'].includes(body.signal) || body.confirm !== String(sid)) throw invalid('Confirm the server ID and power action');
      await pteroRequest(event, sid, '/power', { method: 'POST', body: { signal: body.signal } });
      return { sent: true, message: `${body.signal} requested; refresh to check server state` };
    }
    const backup = await pteroRequest(event, sid, '/backups', { method: 'POST', body: { name: `Control room ${new Date().toISOString()}`, is_locked: false } });
    return { sent: true, backup: backup.attributes?.uuid, message: 'Backup requested. Completion appears in the backup list.' };
  });
});
