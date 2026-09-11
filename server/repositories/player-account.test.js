import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readPlayerAdmin, donorStatus, preferenceVersion, savePlayerPreferences, readPlayerStats, validatePlayerPreferences } from './player-account.js';
import { executeQuery, withTransaction } from '../utils/database.js';
vi.mock('../utils/database.js', () => ({ executeQuery: vi.fn(), withTransaction: vi.fn() }));
vi.mock('../utils/seasons.js', () => ({ getCurrentSeason: async () => 3, getSeasonTableName: async season => season === 3 ? 'sakaStats' : `sakaStats_s${season}`, getSeasonInfo: async () => ({ displayName: 'Current season' }) }));
const row = { tag: 'VIP', nameColor: '{#aabbcc}', chatColor: '--n', useGroupTag: 0, useGroupNameColor: 0, useGroupChatColor: 1, webRevision: 2 };
const valid = () => ({ ...row, useGroupTag: false, useGroupNameColor: false, useGroupChatColor: true, version: preferenceVersion(row), webRevision: undefined });
function payload() { const value = valid(); delete value.webRevision; return value; }

describe('private account data', () => {
  beforeEach(() => vi.clearAllMocks());
  it('requires active status even for permanent or publicly visible donors', () => {
    expect(donorStatus({ is_active: 0, expiry_date: 0, show_on_website: 1 }, 100).active).toBe(false);
    expect(donorStatus({ is_active: 1, expiry_date: 0, show_on_website: 0 }, 100)).toMatchObject({ active: true, permanent: true });
    expect(donorStatus({ is_active: 1, expiry_date: 99 }, 100).state).toBe('expired');
    expect(donorStatus({ is_active: 1, expiry_date: 100 }, 100).active).toBe(true);
    expect(donorStatus({ is_active: 1, expiry_date: -1 }, 100).active).toBe(false);
    expect(donorStatus(null).active).toBe(false);
  });
  it('rejects identity, expiry, group ownership and control-code injection', () => {
    for (const extra of [{ steamid: '[U:1:2]' }, { expiry_date: 0 }, { groupName: 'admin' }, { tag: 'x\ny' }, { tag: '{red}admin' }, { tag: '🔥'.repeat(8) }, { useGroupTag: 1 }, { nameColor: '{#aaa}' }]) {
      expect(() => validatePlayerPreferences({ ...payload(), ...extra })).toThrow();
    }
  });
  it('locks authorization and preferences, writes only the authenticated player, and advances the revision', async () => {
    const execute = vi.fn().mockResolvedValueOnce([[{ is_active: 1, expiry_date: 0 }]]).mockResolvedValueOnce([[row]]).mockResolvedValueOnce([{ affectedRows: 1 }]);
    vi.mocked(withTransaction).mockImplementation(fn => fn({ execute }));
    expect(await savePlayerPreferences('[U:1:1]', payload())).toEqual({ success: true, revision: 3 });
    expect(execute.mock.calls[0][0]).toContain('FOR UPDATE');
    expect(execute.mock.calls[2][0]).toContain('webRevision = webRevision + 1');
    expect(execute.mock.calls[2][1].slice(-2)).toEqual(['[U:1:1]', 2]);
  });
  it('denies a donor revoked after loading the page', async () => {
    const execute = vi.fn().mockResolvedValueOnce([[{ is_active: 0, expiry_date: 0 }]]).mockResolvedValueOnce([[]]);
    vi.mocked(withTransaction).mockImplementation(fn => fn({ execute }));
    await expect(savePlayerPreferences('[U:1:1]', payload())).rejects.toMatchObject({ statusCode: 403 });
    expect(execute).toHaveBeenCalledTimes(2);
  });
  it('recognizes only Steam-linked generic or root admin flags, including inherited flags', async () => {
    for (const [record, expected] of [[{ srv_flags: 'z' }, true], [{ group_flags: 'b' }, true], [{ srv_flags: 'ao' }, false], [{ srv_flags: null }, false]]) {
      vi.mocked(executeQuery).mockResolvedValue([record]);
      expect(await readPlayerAdmin('[U:1:1]')).toBe(expected);
    }
    expect(executeQuery.mock.lastCall[1]).toEqual(['[U:1:1]', 'STEAM_0:1:0', 'STEAM_1:1:0', '76561197960265729']);
    expect(executeQuery.mock.lastCall[0]).toContain('a.authid IN');
    expect(await readPlayerAdmin('Rocket')).toBe(false);
  });
  it('allows a non-donor admin to save only their own preferences', async () => {
    const execute = vi.fn().mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ srv_flags: 'z' }]])
      .mockResolvedValueOnce([[row]]).mockResolvedValueOnce([{ affectedRows: 1 }]);
    vi.mocked(withTransaction).mockImplementation(fn => fn({ execute }));
    expect(await savePlayerPreferences('[U:1:1]', payload())).toEqual({ success: true, revision: 3 });
    expect(execute.mock.calls[1][0]).toContain('FOR UPDATE');
    expect(execute.mock.calls[3][1].slice(-2)).toEqual(['[U:1:1]', 2]);
  });
  it('denies an admin whose permission was removed after opening the panel', async () => {
    const execute = vi.fn().mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ srv_flags: '', group_flags: '' }]]);
    vi.mocked(withTransaction).mockImplementation(fn => fn({ execute }));
    await expect(savePlayerPreferences('[U:1:1]', payload())).rejects.toMatchObject({ statusCode: 403 });
    expect(execute).toHaveBeenCalledTimes(2);
  });
  it('rejects stale website and in-game edits without issuing an UPDATE', async () => {
    for (const changed of [{ ...row, webRevision: 3 }, { ...row, tag: 'Changed in game' }]) {
      const execute = vi.fn().mockResolvedValueOnce([[{ is_active: 1, expiry_date: 0 }]]).mockResolvedValueOnce([[changed]]);
      vi.mocked(withTransaction).mockImplementation(fn => fn({ execute }));
      await expect(savePlayerPreferences('[U:1:1]', payload())).rejects.toMatchObject({ statusCode: 409 });
      expect(execute).toHaveBeenCalledTimes(2);
    }
  });
  it('uses exact session identity for stats, with no player-name fallback', async () => {
    vi.mocked(executeQuery).mockResolvedValue([]);
    expect(await readPlayerStats('[U:1:1]', 2)).toMatchObject({ player: null, season: 2 });
    expect(executeQuery.mock.calls[0][0]).toContain('FROM sakaStats_s2 p WHERE p.steamid = ?');
    expect(executeQuery.mock.calls[0][1]).toEqual(['[U:1:1]']);
    await expect(readPlayerStats('[U:1:1]', '2; DROP TABLE sakaStats')).rejects.toMatchObject({ statusCode: 400 });
  });
});
