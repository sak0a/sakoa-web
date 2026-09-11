import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from './index.get.js';
import { readPlayerAdmin, readPlayerDonor, readPlayerPreferences, readPlayerStats } from '../../repositories/player-account.js';
vi.mock('h3', () => ({ defineEventHandler: handler => handler, getQuery: () => ({}) }));
vi.mock('#imports', () => ({ useRuntimeConfig: () => ({ playerColorWritesEnabled: true }) }));
vi.mock('../../utils/player-auth.js', () => ({ requirePlayerSession: async () => ({ steamid: '[U:1:1]', steam64: '76561197960265729' }) }));
vi.mock('../../repositories/player-account.js', () => ({ readPlayerAdmin: vi.fn(), readPlayerDonor: vi.fn(), readPlayerPreferences: vi.fn(), readPlayerStats: vi.fn() }));
describe('account section permissions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    readPlayerAdmin.mockResolvedValue(false);
    readPlayerDonor.mockResolvedValue({ active: false });
    readPlayerStats.mockResolvedValue({ player: { points: 123 } });
    readPlayerPreferences.mockResolvedValue({ tag: 'VIP' });
  });
  it('does not load or return preferences for regular players', async () => {
    const response = await handler({});
    expect(response.access).toEqual({ admin: false, canStyle: false });
    expect(response.preferences).toBeNull();
    expect(readPlayerPreferences).not.toHaveBeenCalled();
    expect(response.stats.player.points).toBe(123);
  });
  it('permits admins without a donation and active donors without admin access', async () => {
    for (const admin of [true, false]) {
      readPlayerAdmin.mockResolvedValue(admin);
      readPlayerDonor.mockResolvedValue({ active: !admin });
      expect(await handler({})).toMatchObject({ access: { admin, canStyle: true }, preferences: { tag: 'VIP' } });
    }
  });
  it('fails closed on unavailable permissions while keeping stats usable', async () => {
    readPlayerAdmin.mockRejectedValue(new Error('Database unavailable'));
    readPlayerDonor.mockRejectedValue(new Error('Database unavailable'));
    expect(await handler({})).toMatchObject({ access: { admin: false, canStyle: false }, preferences: null, unavailable: { admin: true, donor: true } });
    expect(readPlayerPreferences).not.toHaveBeenCalled();
  });
});
