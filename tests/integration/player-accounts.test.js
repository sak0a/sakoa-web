import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import mysql from 'mysql2/promise';
import { createApp, createRouter, toNodeListener } from 'h3';
import { testRuntimeConfig } from '../support/nuxt-imports.js';
import login from '../../server/api/auth/steam.get.js';
import callback from '../../server/api/auth/steam/callback.get.js';
import sessionHandler from '../../server/api/account/session.get.js';
import logout from '../../server/api/account/logout.post.js';
import preferences from '../../server/api/account/preferences.put.js';
import { readPlayerPreferences, savePlayerPreferences } from '../../server/repositories/player-account.js';
import { OPENID_NS, STEAM_OPENID_ENDPOINT } from '../../server/utils/steam-openid.js';

const database = vi.hoisted(() => ({ pool: null }));
vi.mock('../../server/utils/database.js', () => ({
  executeQuery: async (sql, params = []) => (await database.pool.execute(sql, params))[0],
  withTransaction: async callback => {
    const connection = await database.pool.getConnection();
    try { await connection.beginTransaction(); const result = await callback(connection); await connection.commit(); return result; }
    catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  }
}));

// Opt-in only: always targets a disposable, loopback-only database with fixed test credentials.
describe.skipIf(!process.env.ACCOUNT_TEST_DB_PORT)('account HTTP and MySQL integration', () => {
  let server;
  let base;
  const localFetch = globalThis.fetch;
  const query = async (sql, values = []) => (await database.pool.execute(sql, values))[0];
  beforeAll(async () => {
    database.pool = mysql.createPool({ host: '127.0.0.1', port: Number(process.env.ACCOUNT_TEST_DB_PORT), user: 'root', password: 'local-account-tests', database: 'account_tests', multipleStatements: true, connectionLimit: 4 });
    await database.pool.query(await readFile(new URL('../../database/migrations/003_player_accounts.sql', import.meta.url), 'utf8'));
    await database.pool.query(`CREATE TABLE IF NOT EXISTS sakaDonate_users (steamid VARCHAR(64) PRIMARY KEY, is_active BOOLEAN, expiry_date BIGINT, tier VARCHAR(32)) ENGINE=InnoDB;
      CREATE TABLE IF NOT EXISTS sakaColors_Groups (groupName VARCHAR(32) PRIMARY KEY, tag VARCHAR(64), nameColor VARCHAR(32), chatColor VARCHAR(32)) ENGINE=InnoDB;
      CREATE TABLE IF NOT EXISTS sakaColors_Clients (steamid VARCHAR(64) PRIMARY KEY, groupName VARCHAR(32), tag VARCHAR(64), nameColor VARCHAR(32), chatColor VARCHAR(32), useGroupTag INT, useGroupNameColor INT, useGroupChatColor INT, webRevision INT NOT NULL DEFAULT 0) ENGINE=InnoDB;`);
    const app = createApp();
    const router = createRouter().get('/api/auth/steam', login).get('/api/auth/steam/callback', callback)
      .get('/api/account/session', sessionHandler).post('/api/account/logout', logout).put('/api/account/preferences', preferences);
    app.use(router);
    server = createServer(toNodeListener(app));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
    testRuntimeConfig.public.siteUrl = base;
  });
  beforeEach(async () => {
    for (const table of ['player_login_states', 'player_sessions', 'sakaColors_Clients', 'sakaDonate_users']) await query(`DELETE FROM ${table}`);
    for (const id of ['[U:1:1]', '[U:1:2]']) {
      await query('INSERT INTO sakaDonate_users VALUES (?, 1, 0, ?)', [id, 'Premium']);
      await query('INSERT INTO sakaColors_Clients VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0)', [id, 'default', 'VIP', '{#aabbcc}', '--n']);
    }
    testRuntimeConfig.playerColorWritesEnabled = true;
    vi.stubGlobal('fetch', async (url, options) => {
      if (url === STEAM_OPENID_ENDPOINT) return new Response(`ns:${OPENID_NS}\nis_valid:true\n`);
      return localFetch(url, options);
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  afterAll(async () => { await new Promise(resolve => server?.close(resolve)); await database.pool?.end(); });
  function cookie(response, name) { return response.headers.getSetCookie().find(value => value.startsWith(name + '='))?.split(';')[0]; }
  async function begin() {
    const response = await localFetch(base + '/api/auth/steam', { redirect: 'manual' });
    expect(response.status).toBe(302);
    const redirect = new URL(response.headers.get('location'));
    return { returnTo: redirect.searchParams.get('openid.return_to'), cookie: cookie(response, 'saka-steam-login') };
  }
  async function finish(attempt, extra = {}) {
    const url = new URL(attempt.returnTo);
    const fields = {
      'openid.ns': OPENID_NS, 'openid.mode': 'id_res', 'openid.op_endpoint': STEAM_OPENID_ENDPOINT,
      'openid.identity': 'https://steamcommunity.com/openid/id/76561197960265729',
      'openid.claimed_id': 'https://steamcommunity.com/openid/id/76561197960265729',
      'openid.return_to': attempt.returnTo, 'openid.response_nonce': new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') + 'unique',
      'openid.assoc_handle': 'handle', 'openid.sig': 'signature',
      'openid.signed': 'op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle', ...extra
    };
    for (const [key, value] of Object.entries(fields)) url.searchParams.set(key, value);
    return localFetch(url, { headers: { cookie: attempt.cookie }, redirect: 'manual' });
  }
  async function signedIn() {
    const response = await finish(await begin());
    expect(response.headers.get('location')).toBe('/?account=open');
    const credentials = cookie(response, 'saka-player');
    const info = await localFetch(base + '/api/account/session', { headers: { cookie: credentials } });
    expect(info.headers.get('cache-control')).toContain('no-store');
    return { credentials, session: await info.json() };
  }
  async function body() {
    const value = await readPlayerPreferences('[U:1:1]');
    const { group, revision, ...input } = value;
    return { ...input, tag: 'WEB' };
  }
  it('creates a revocable HttpOnly session and atomically rejects callback replay', async () => {
    const attempt = await begin();
    const response = await finish(attempt);
    expect(response.headers.get('location')).toBe('/?account=open');
    expect(response.headers.getSetCookie().join(';')).toContain('HttpOnly');
    expect(response.headers.getSetCookie().join(';')).toContain('SameSite=Lax');
    expect((await finish(attempt)).headers.get('location')).toBe('/?account=login-failed');
    const rows = await query('SELECT * FROM player_sessions');
    expect(rows).toHaveLength(1);
    expect(rows[0].token_hash).not.toBe(cookie(response, 'saka-player').split('=')[1]);
  });
  it('rejects an assertion from another browser, expired state, and cancellation', async () => {
    const attempt = await begin();
    expect((await finish({ ...attempt, cookie: 'saka-steam-login=' + 'f'.repeat(64) })).headers.get('location')).toBe('/?account=login-failed');
    await query('UPDATE player_login_states SET expires_at = 1');
    expect((await finish(attempt)).headers.get('location')).toBe('/?account=login-failed');
    expect((await finish(await begin(), { 'openid.mode': 'cancel' })).headers.get('location')).toBe('/?account=cancelled');
    expect(await query('SELECT * FROM player_sessions')).toHaveLength(0);
  });
  it('protects writes with origin and CSRF, binds identity, and revokes logout', async () => {
    const { credentials, session } = await signedIn();
    const data = await body();
    const request = headers => localFetch(base + '/api/account/preferences', { method: 'PUT', headers: { cookie: credentials, 'content-type': 'application/json', ...headers }, body: JSON.stringify(data) });
    expect((await request({ origin: base })).status).toBe(403);
    expect((await request({ origin: 'https://attacker.test', 'x-csrf-token': session.csrfToken })).status).toBe(403);
    expect((await request({ origin: base, 'x-csrf-token': session.csrfToken })).status).toBe(200);
    expect((await query('SELECT tag FROM sakaColors_Clients WHERE steamid = ?', ['[U:1:2]']))[0].tag).toBe('VIP');
    const signedOut = await localFetch(base + '/api/account/logout', { method: 'POST', headers: { cookie: credentials, origin: base, 'x-csrf-token': session.csrfToken } });
    expect(signedOut.status).toBe(200);
    expect((await request({ origin: base, 'x-csrf-token': session.csrfToken })).status).toBe(401);
  });
  it('fails closed when sessions expire, benefits are revoked, or plugin writes are disabled', async () => {
    const { credentials, session } = await signedIn();
    const request = () => localFetch(base + '/api/account/preferences', { method: 'PUT', headers: { cookie: credentials, origin: base, 'x-csrf-token': session.csrfToken, 'content-type': 'application/json' }, body: JSON.stringify({}) });
    testRuntimeConfig.playerColorWritesEnabled = false;
    expect((await request()).status).toBe(503);
    testRuntimeConfig.playerColorWritesEnabled = true;
    await query('UPDATE sakaDonate_users SET is_active = 0');
    await expect(savePlayerPreferences('[U:1:1]', await body())).rejects.toMatchObject({ statusCode: 403 });
    await query('UPDATE player_sessions SET expires_at = 1');
    expect((await request()).status).toBe(401);
  });
  it('serializes concurrent web saves and prevents stale game snapshots overwriting a newer revision', async () => {
    const input = await body();
    const results = await Promise.allSettled([savePlayerPreferences('[U:1:1]', input), savePlayerPreferences('[U:1:1]', { ...input, tag: 'OTHER' })]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')[0].reason.statusCode).toBe(409);
    const stale = await query('UPDATE sakaColors_Clients SET tag = ? WHERE steamid = ? AND webRevision = ?', ['OLD GAME CACHE', '[U:1:1]', 0]);
    expect(stale.affectedRows).toBe(0);
    const current = await readPlayerPreferences('[U:1:1]');
    expect(current.revision).toBe(1);
    expect(current.tag).not.toBe('OLD GAME CACHE');
    const fresh = await query('UPDATE sakaColors_Clients SET tag = ? WHERE steamid = ? AND webRevision = ?', ['NEW GAME EDIT', '[U:1:1]', 1]);
    expect(fresh.affectedRows).toBe(1);
    expect((await readPlayerPreferences('[U:1:1]')).tag).toBe('NEW GAME EDIT');
  });
});
