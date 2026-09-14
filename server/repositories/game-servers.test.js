import { describe, expect, it, vi } from 'vitest';
import { updateGameServer, validateGameServer } from './game-servers.js';
import { withTransaction } from '../utils/database.js';

vi.mock('../utils/database.js', () => ({
  executeQuery: vi.fn(),
  withTransaction: vi.fn()
}));


const validServer = {
  id: 'arena-eu',
  name: 'Arena Europe',
  host: 'tf2.example.com',
  port: 27015,
  location: 'Frankfurt',
  connectUrl: 'steam://connect/tf2.example.com:27015',
  enabled: true,
  comingSoon: false,
  displayOrder: 1,
  discordPublishEnabled: true
};

describe('game server validation', () => {
  it('normalizes text and preserves explicit flags', () => {
    expect(validateGameServer({ ...validServer, name: ' Arena Europe ' })).toEqual({
      success: true,
      data: validServer
    });
  });

  it('rejects unsafe identifiers, hosts, ports, and connect URLs', () => {
    const result = validateGameServer({
      ...validServer,
      id: '../arena',
      host: 'https://tf2.example.com/a',
      port: 70000,
      connectUrl: 'https://tf2.example.com',
      enabled: 'true'
    });

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(5);
  });

  it('accepts IPv6 servers with bracketed connect URLs', () => {
    const result = validateGameServer({
      ...validServer,
      id: 'arena-ipv6',
      host: '2001:db8::1',
      connectUrl: 'steam://connect/[2001:db8::1]:27015'
    });
    expect(result.success).toBe(true);
  });
});

describe('server ID updates', () => {
  it('moves the message mapping and queued publish jobs in the server transaction', async () => {
    const execute = vi.fn().mockResolvedValue([{}]);
    execute.mockResolvedValueOnce([[{ id: 'old-id' }]]);
    withTransaction.mockImplementationOnce(callback => callback({ execute }));
    expect(await updateGameServer('old-id', validServer, 'admin')).toEqual({ success: true, data: validServer });
    expect(execute).toHaveBeenCalledWith(
      'UPDATE discord_status_messages SET server_id = ? WHERE server_id = ?',
      ['arena-eu', 'old-id']
    );
    expect(execute).toHaveBeenCalledWith(expect.stringContaining("JSON_SET(payload, '$.serverId', ?)"), ['arena-eu', 'old-id']);
  });

  it('reports duplicate IDs without accepting the rename', async () => {
    withTransaction.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
    expect(await updateGameServer('old-id', validServer, 'admin')).toMatchObject({ success: false, conflict: true });
  });
});
