import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPunishment, enforcePunishment, kickPlayer } from './sourcebans.js';
const mocks = vi.hoisted(() => ({ query: vi.fn(), execute: vi.fn(), commit: vi.fn(), rcon: vi.fn() }));
vi.mock('../utils/database.js', () => ({ executeQuery: mocks.query, withTransaction: callback => callback({ execute: mocks.execute, commit: mocks.commit }) }));
vi.mock('../utils/source-rcon.js', () => ({ sourceRcon: mocks.rcon }));
const server = { sid: 2, ip: '127.0.0.1', port: 27015, rcon: 'secret' };
const body = { kind: 'silence', steamId: '[U:1:12345]', name: 'Player', reason: 'Spam', minutes: 10 };
const status = '# 19 "Player" [U:1:12345] 10:00 30 0 active 127.0.0.1:123';
beforeEach(() => { for (const mock of Object.values(mocks)) mock.mockReset(); mocks.commit.mockResolvedValue(); });
describe('SourceBans moderation persistence and enforcement', () => {
  it('stores silence as two records in seconds and targets SourceComms with Steam3', async () => {
    mocks.query.mockResolvedValueOnce([{ aid: 1 }]).mockResolvedValueOnce([server]);
    mocks.execute.mockResolvedValueOnce([[{ acquired: 1 }]]).mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 4 }]).mockResolvedValueOnce([{ insertId: 5 }]).mockResolvedValueOnce([[]]);
    mocks.rcon.mockResolvedValueOnce(status).mockResolvedValueOnce('');
    const result = await createPunishment(body, '76561198117084164');
    expect(result).toMatchObject({ saved: true, ids: [4, 5], partial: false });
    expect(mocks.execute.mock.calls[2][1]).toEqual([1, 'STEAM_0:1:6172', 'Player', 600, 600, 'Spam', 1]);
    expect(mocks.execute.mock.calls[3][1][0]).toBe(2);
    expect(mocks.rcon.mock.calls[1][1]).toBe('sc_fw_block 3 600 [U:1:12345]');
  });
  it('returns saved plus partial when live enforcement fails after commit', async () => {
    mocks.query.mockResolvedValueOnce([{ aid: 1 }]).mockResolvedValueOnce([server]);
    mocks.execute.mockResolvedValueOnce([[{ acquired: 1 }]]).mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ insertId: 9 }]).mockResolvedValueOnce([[]]);
    mocks.rcon.mockRejectedValue(new Error('timeout'));
    expect(await createPunishment({ ...body, kind: 'ban' }, '76561198117084164')).toMatchObject({ saved: true, ids: [9], partial: true });
    expect(mocks.commit).toHaveBeenCalled();
  });
  it('refuses duplicate active punishment without sending commands', async () => {
    mocks.query.mockResolvedValueOnce([{ aid: 1 }]);
    mocks.execute.mockResolvedValueOnce([[{ acquired: 1 }]]).mockResolvedValueOnce([[{ bid: 1 }]]).mockResolvedValueOnce([[]]);
    await expect(createPunishment(body, '76561198117084164')).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.rcon).not.toHaveBeenCalled();
  });
  it('rechecks identity and never kicks a reused display name', async () => {
    mocks.query.mockResolvedValueOnce([server]); mocks.rcon.mockResolvedValue('# 19 "Player" [U:1:999] 10:00 30 0 active 127.0.0.1:123');
    await expect(kickPlayer({ sid: 2, steamId: '[U:1:12345]', reason: 'Spam' })).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.rcon).toHaveBeenCalledTimes(1);
  });
  it('reports offline players without issuing a command', async () => {
    mocks.rcon.mockResolvedValue('hostname: empty');
    const result = await enforcePunishment({ steam64: '76561198117084164' }, 'ban', 0, [server]);
    expect(result).toEqual([{ sid: 2, status: 'not-connected' }]);
    expect(mocks.rcon).toHaveBeenCalledTimes(1);
  });
});
