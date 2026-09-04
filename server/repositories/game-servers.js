import { executeQuery, withTransaction } from '../utils/database.js';
import { isIP } from 'node:net';

function isValidHost(host) {
  if (isIP(host)) return true;
  if (host.length > 253 || host.endsWith('.')) return false;
  return host.split('.').every((label) => (
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)
  ));
}

function mapServer(row) {
  return {
    id: row.id,
    name: row.display_name,
    host: row.host,
    port: Number(row.port),
    location: row.location,
    connectUrl: row.connect_url,
    enabled: Boolean(row.enabled),
    comingSoon: Boolean(row.coming_soon),
    displayOrder: Number(row.display_order),
    discordPublishEnabled: Boolean(row.discord_publish_enabled)
  };
}

export function validateGameServer(input) {
  const errors = [];
  const id = typeof input?.id === 'string' ? input.id.trim() : '';
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  const host = typeof input?.host === 'string' ? input.host.trim() : '';
  const location = typeof input?.location === 'string' ? input.location.trim() : '';
  const connectUrl = typeof input?.connectUrl === 'string' ? input.connectUrl.trim() : '';
  const port = input?.port;

  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(id)) errors.push('Server ID is invalid');
  if (!name || name.length > 160) errors.push('Server name is required and must be at most 160 characters');
  if (!host || !isValidHost(host)) errors.push('Server host is invalid');
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push('Server port must be between 1 and 65535');
  if (location.length > 160) errors.push('Location must be at most 160 characters');
  const connectHost = isIP(host) === 6 ? `[${host}]` : host;
  if (connectUrl !== `steam://connect/${connectHost}:${port}` || connectUrl.length > 512) {
    errors.push('Connect URL must match the configured host and port');
  }
  for (const field of ['enabled', 'comingSoon', 'discordPublishEnabled']) {
    if (input?.[field] !== undefined && typeof input[field] !== 'boolean') {
      errors.push(`${field} must be a boolean`);
    }
  }
  if (
    input?.displayOrder !== undefined
    && (!Number.isInteger(input.displayOrder) || input.displayOrder < 0 || input.displayOrder > 1_000_000)
  ) {
    errors.push('Display order must be an integer between 0 and 1000000');
  }

  if (errors.length > 0) return { success: false, errors };

  return {
    success: true,
    data: {
      id,
      name,
      host,
      port,
      location,
      connectUrl,
      enabled: input.enabled !== false,
      comingSoon: Boolean(input.comingSoon),
      displayOrder: Number.isInteger(input.displayOrder) && input.displayOrder >= 0
        ? input.displayOrder
        : 0,
      discordPublishEnabled: input.discordPublishEnabled !== false
    }
  };
}

export async function listGameServers({ includeDisabled = false } = {}) {
  const rows = await executeQuery(
    `SELECT id, display_name, host, port, location, connect_url,
            enabled, coming_soon, display_order, discord_publish_enabled
     FROM game_servers
     ${includeDisabled ? '' : 'WHERE enabled = TRUE'}
     ORDER BY display_order ASC, id ASC`
  );
  return rows.map(mapServer);
}

export async function createGameServer(input, updatedBy) {
  const validation = validateGameServer(input);
  if (!validation.success) return validation;
  const server = validation.data;

  try {
    await executeQuery(
      `INSERT INTO game_servers
        (id, display_name, host, port, location, connect_url, enabled,
         coming_soon, display_order, discord_publish_enabled, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        server.id,
        server.name,
        server.host,
        server.port,
        server.location,
        server.connectUrl,
        server.enabled,
        server.comingSoon,
        server.displayOrder,
        server.discordPublishEnabled,
        updatedBy
      ]
    );
    return { success: true, data: server };
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return { success: false, conflict: true, errors: ['Server ID already exists'] };
    }
    throw error;
  }
}

export async function updateGameServer(currentId, input, updatedBy) {
  const validation = validateGameServer(input);
  if (!validation.success) return validation;
  const server = validation.data;

  try {
    const result = await withTransaction(async (connection) => {
      const [existing] = await connection.execute(
        'SELECT id FROM game_servers WHERE id = ? FOR UPDATE',
        [currentId]
      );
      if (!existing[0]) return { missing: true };

      await connection.execute(
        `UPDATE game_servers
         SET id = ?, display_name = ?, host = ?, port = ?, location = ?,
             connect_url = ?, enabled = ?, coming_soon = ?, display_order = ?,
             discord_publish_enabled = ?, updated_by = ?
         WHERE id = ?`,
        [
          server.id,
          server.name,
          server.host,
          server.port,
          server.location,
          server.connectUrl,
          server.enabled,
          server.comingSoon,
          server.displayOrder,
          server.discordPublishEnabled,
          updatedBy,
          currentId
        ]
      );
      return { missing: false };
    });

    if (result.missing) return { success: false, missing: true, errors: ['Server not found'] };
    return { success: true, data: server };
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return { success: false, conflict: true, errors: ['Server ID already exists'] };
    }
    throw error;
  }
}

export async function deleteGameServer(id) {
  const result = await executeQuery('DELETE FROM game_servers WHERE id = ?', [id]);
  return result.affectedRows === 1;
}
