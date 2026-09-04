import { describe, expect, it, vi } from 'vitest';
import { validateGameServer } from './game-servers.js';

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
