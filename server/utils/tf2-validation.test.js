import { describe, it, expect } from 'vitest';
import { configPath, steamIdentity, parseStatus, reasonText } from './tf2-validation.js';
import { isOwnerSteamId } from './owner-access.js';

describe('TF2 identity and access boundaries', () => {
  it('normalizes all supported formats to the same account', () => {
    const expected = steamIdentity('[U:1:12345]');
    for (const format of expected.variants) expect(steamIdentity(format)).toEqual(expected);
    for (const bad of ['BOT', 'STEAM_0:2:22', '[U:1:4294967296]', '76561197960265728', 'foo;quit']) expect(() => steamIdentity(bad)).toThrow();
  });
  it('requires an exact allowlisted Steam identity', () => {
    const owner = steamIdentity('[U:1:12345]').steam64;
    expect(isOwnerSteamId(owner, `${owner},76561198000000000`)).toBe(true);
    expect(isOwnerSteamId(owner, '')).toBe(false);
    expect(isOwnerSteamId(owner, `${owner}0`)).toBe(false);
    expect(isOwnerSteamId(null, owner)).toBe(false);
  });
  it('limits config paths and rejects traversal and hidden backups', () => {
    expect(configPath('/tf/cfg/server.cfg')).toBe('/tf/cfg/server.cfg');
    expect(configPath('/tf/addons/sourcemod/configs', true)).toBeTruthy();
    for (const path of ['/tf/cfg/../../server.cfg', '/tf/cfg2/server.cfg', '/tf/cfg/.saka-backup-test.cfg', '/tf/cfg/test.smx', '/tf/cfg/a\\b.cfg', '/tf/cfg/a\n.cfg']) expect(() => configPath(path)).toThrow();
  });
  it('parses verified players without returning their IP addresses', () => {
    const players = parseStatus('# userid name uniqueid connected ping loss state adr\n# 17 "a \\"quoted\\" name" [U:1:12345] 01:12 34 0 active 10.0.0.1:2345\n# 18 "Bot" BOT active');
    expect(players).toHaveLength(1);
    expect(players[0]).toMatchObject({ userId: 17, ping: 34, steam3: '[U:1:12345]' });
    expect(JSON.stringify(players)).not.toContain('10.0.0.1');
  });
  it('rejects blank or multiline moderation reasons', () => {
    for (const reason of ['', ' ', 'hello\nquit', 'a'.repeat(161)]) expect(() => reasonText(reason)).toThrow();
  });
});
