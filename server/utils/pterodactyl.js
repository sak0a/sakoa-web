import { createHash } from 'node:crypto';
import { posix } from 'node:path';
import { createError } from 'h3';
import { useRuntimeConfig } from '#imports';
import { getDbConnection } from './database.js';
import { configPath, integer, invalid } from './tf2-validation.js';

export const fileRevision = text => createHash('sha256').update(text).digest('hex');

export function pteroSettings(event) {
  const config = useRuntimeConfig(event);
  let map;
  try {
    map = typeof config.tf2ServerMap === 'string' ? JSON.parse(config.tf2ServerMap || '{}') : config.tf2ServerMap || {};
    if (typeof map !== 'object' || map === null || Array.isArray(map)) throw new Error();
  } catch { throw createError({ statusCode: 503, statusMessage: 'TF2_SERVER_MAP must be a JSON object' }); }
  return { url: config.pterodactylUrl, key: config.pterodactylApiKey, map };
}

export async function pteroRequest(event, sid, endpoint, options = {}) {
  const { url, key, map } = pteroSettings(event);
  const identifier = map[String(integer(sid))];
  if (!url || !key || typeof identifier !== 'string' || !/^[a-f0-9-]{8,36}$/.test(identifier)) {
    throw createError({ statusCode: 503, statusMessage: 'Configure the Pterodactyl URL, Client API key, and server mapping in Coolify' });
  }
  let base;
  try { base = new URL(url); } catch { throw createError({ statusCode: 503, statusMessage: 'Invalid Pterodactyl URL' }); }
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw createError({ statusCode: 503, statusMessage: 'Pterodactyl needs an HTTPS URL without credentials' });
  const target = new URL(`${base.pathname.replace(/\/$/, '')}/api/client/servers/${identifier}${endpoint}`, base.origin);
  for (const [k, v] of Object.entries(options.query || {})) target.searchParams.set(k, String(v));
  let response;
  try {
    response = await fetch(target, {
      method: options.method || 'GET', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json', 'Content-Type': options.text ? 'text/plain' : 'application/json' },
      body: options.body === undefined ? undefined : options.text ? options.body : JSON.stringify(options.body)
    });
  } catch { throw createError({ statusCode: 502, statusMessage: 'Pterodactyl did not confirm the request. Check server state before retrying.' }); }
  if (!response.ok) throw createError({ statusCode: response.status === 404 ? 404 : 502, statusMessage: `Pterodactyl rejected the request (HTTP ${response.status})` });
  const reader = response.body?.getReader();
  let bytes = 0; const chunks = [];
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 1024 * 1024) { await reader.cancel(); throw invalid('Response exceeds the 1 MB editor limit'); }
      chunks.push(Buffer.from(value));
    }
  }
  const content = Buffer.concat(chunks).toString('utf8');
  if (options.textResponse) return content;
  return content ? JSON.parse(content) : {};
}

export async function readConfig(event, sid, path) {
  path = configPath(path);
  const content = await pteroRequest(event, sid, '/files/contents', { query: { file: path }, textResponse: true });
  if (Buffer.byteLength(content) > 256000) throw invalid('This file exceeds the 256 KB config editor limit');
  if (content.includes('\0')) throw invalid('Binary files cannot be edited');
  return { path, content, revision: fileRevision(content) };
}

export async function writeConfig(event, body) {
  const path = configPath(body.path), sid = integer(body.sid);
  if (typeof body.content !== 'string' || Buffer.byteLength(body.content) > 256000 || body.content.includes('\0')) throw invalid('Config must be text up to 256 KB');
  if (!/^[a-f0-9]{64}$/.test(body.revision || '')) throw invalid('Read the file before saving it');
  const connection = await (await getDbConnection()).getConnection();
  const lock = `cfg:${sid}:${fileRevision(path).slice(0, 40)}`;
  try {
    const [[row]] = await connection.execute('SELECT GET_LOCK(?,5) AS acquired', [lock]);
    if (!row.acquired) throw createError({ statusCode: 409, statusMessage: 'Another config save is in progress' });
    const current = await readConfig(event, sid, path);
    if (current.revision !== body.revision) throw createError({ statusCode: 409, statusMessage: 'File changed since you opened it. Reload and review those changes first.' });
    const backup = `${posix.dirname(path)}/.saka-backup-${body.operationId}-${posix.basename(path)}`;
    await pteroRequest(event, sid, '/files/write', { method: 'POST', query: { file: backup }, body: current.content, text: true });
    const savedBackup = await pteroRequest(event, sid, '/files/contents', { query: { file: backup }, textResponse: true });
    if (fileRevision(savedBackup) !== current.revision) throw createError({ statusCode: 502, statusMessage: 'Backup verification failed; original file was not changed' });
    // Narrow the race with edits made outside this panel. Pterodactyl has no conditional-write API.
    if ((await readConfig(event, sid, path)).revision !== current.revision) throw createError({ statusCode: 409, statusMessage: 'File changed during backup; original file was not overwritten' });
    try {
      await pteroRequest(event, sid, '/files/write', { method: 'POST', query: { file: path }, body: body.content, text: true });
      const verified = await readConfig(event, sid, path);
      if (verified.revision !== fileRevision(body.content)) throw new Error();
      return { saved: true, sid, path, backup, revision: verified.revision, message: 'Saved with backup. Configuration has not been executed.' };
    } catch { return { saved: false, partial: true, sid, path, backup, message: 'Write could not be verified. Reload the file; the original is preserved in the backup.' }; }
  } finally {
    await connection.execute('SELECT RELEASE_LOCK(?)', [lock]).catch(() => {});
    connection.release();
  }
}

export async function restoreConfig(event, body) {
  const path = configPath(body.path);
  const prefix = `${posix.dirname(path)}/.saka-backup-`;
  if (typeof body.backup !== 'string' || !body.backup.startsWith(prefix)
    || !new RegExp(`^[a-f0-9-]{36}-`).test(body.backup.slice(prefix.length))
    || body.backup.slice(prefix.length + 37) !== posix.basename(path)) throw invalid('Backup does not belong to this file');
  const content = await pteroRequest(event, body.sid, '/files/contents', { query: { file: body.backup }, textResponse: true });
  return writeConfig(event, { ...body, path, content });
}
