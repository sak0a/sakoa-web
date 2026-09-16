import { defineEventHandler } from 'h3';
import { sourceServers } from '../../../repositories/sourcebans.js';
import { pteroSettings } from '../../../utils/pterodactyl.js';
import { executeQuery } from '../../../utils/database.js';

export default defineEventHandler(async event => {
  const servers = await sourceServers();
  const { map, url, key } = pteroSettings(event);
  const operations = await executeQuery('SELECT id,actor_steam64,action,status,result_json,created_at FROM tf2_operations ORDER BY created_at DESC LIMIT 30');
  return { servers: servers.map(({ rcon, ...s }) => ({ ...s, hasRcon: Boolean(rcon), hasPterodactyl: Boolean(url && key && map[String(s.sid)]) })), operations };
});
