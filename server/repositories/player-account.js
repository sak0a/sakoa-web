import { createHash } from 'node:crypto';
import { createError } from 'h3';
import { executeQuery, withTransaction } from '../utils/database.js';
import { getCurrentSeason, getSeasonTableName, getSeasonInfo } from '../utils/seasons.js';

const fields = ['tag', 'nameColor', 'chatColor', 'useGroupTag', 'useGroupNameColor', 'useGroupChatColor'];

export function donorStatus(row, now = Math.floor(Date.now() / 1000)) {
  const expiry = row?.expiry_date == null ? 0 : Number(row.expiry_date);
  const active = row && Number(row.is_active) === 1 && Number.isFinite(expiry) && expiry >= 0 && (expiry === 0 || expiry >= now);
  return {
    active: Boolean(active), exists: Boolean(row), tier: row?.tier || 'Donator',
    expiresAt: expiry || null, permanent: Boolean(active && expiry === 0),
    state: active ? 'active' : row && expiry > 0 && expiry < now ? 'expired' : row ? 'inactive' : 'none'
  };
}

export function preferenceVersion(row) {
  return createHash('sha256').update(JSON.stringify([Number(row.webRevision), ...fields.map(key => row[key])])).digest('hex');
}

export function validatePlayerPreferences(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || Object.keys(input).some(key => ![...fields, 'version'].includes(key))) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported preference fields' });
  }
  if (typeof input.version !== 'string' || !/^[a-f0-9]{64}$/.test(input.version)) throw createError({ statusCode: 400, statusMessage: 'Refresh your settings before saving' });
  // Plain tags cannot inject Source color/control codes or multiline chat content.
  if (typeof input.tag !== 'string' || Buffer.byteLength(input.tag, 'utf8') > 31
    || /[\p{C}{}]/u.test(input.tag)) throw createError({ statusCode: 400, statusMessage: 'Use a short tag (31 UTF-8 bytes), without control characters or color codes' });
  for (const key of ['nameColor', 'chatColor']) {
    if (typeof input[key] !== 'string' || !/^(--n|\{#[a-fA-F0-9]{6}\}|\{[a-z]{1,24}\})$/.test(input[key])) {
      throw createError({ statusCode: 400, statusMessage: 'Choose a valid six-digit color or the default color' });
    }
  }
  for (const key of ['useGroupTag', 'useGroupNameColor', 'useGroupChatColor']) {
    if (typeof input[key] !== 'boolean') throw createError({ statusCode: 400, statusMessage: 'Group defaults must be on or off' });
  }
  return { ...input, tag: input.tag.trim() || '--n' };
}

function mapPreferences(row) {
  if (!row) return null;
  return {
    tag: row.tag === '--n' ? '' : row.tag || '', nameColor: row.nameColor || '--n', chatColor: row.chatColor || '--n',
    useGroupTag: Boolean(row.useGroupTag), useGroupNameColor: Boolean(row.useGroupNameColor), useGroupChatColor: Boolean(row.useGroupChatColor),
    version: preferenceVersion(row), revision: Number(row.webRevision),
    group: { tag: row.groupTag || '--n', nameColor: row.groupNameColor || '--n', chatColor: row.groupChatColor || '--n' }
  };
}

export async function readPlayerDonor(steamid) {
  const rows = await executeQuery('SELECT is_active, expiry_date, tier FROM sakaDonate_users WHERE steamid = ? LIMIT 1', [steamid]);
  return donorStatus(rows[0]);
}

// SourceBans stores Steam-linked server flags separately from website roles.
// Generic admin (b) and root (z), including inherited flags, permit personal styling only.
export async function readPlayerAdmin(steamid, connection = null) {
  const match = /^\[U:1:(\d+)\]$/.exec(steamid);
  if (!match || BigInt(match[1]) > 4294967295n) return false;
  const id = BigInt(match[1]);
  const steam2 = `${id % 2n}:${id / 2n}`;
  const identities = [steamid, `STEAM_0:${steam2}`, `STEAM_1:${steam2}`, String(76561197960265728n + id)];
  const sql = `SELECT a.srv_flags, g.flags AS group_flags
    FROM sb_admins a LEFT JOIN sb_srvgroups g ON g.name = a.srv_group
    WHERE a.authid IN (?, ?, ?, ?)${connection ? ' FOR UPDATE' : ''}`;
  const rows = connection ? (await connection.execute(sql, identities))[0] : await executeQuery(sql, identities);
  return rows.some(row => /[bz]/.test(`${row.srv_flags || ''}${row.group_flags || ''}`));
}

export async function readPlayerPreferences(steamid) {
  const rows = await executeQuery(`SELECT c.tag, c.nameColor, c.chatColor, c.useGroupTag, c.useGroupNameColor, c.useGroupChatColor, c.webRevision,
    g.tag AS groupTag, g.nameColor AS groupNameColor, g.chatColor AS groupChatColor
    FROM sakaColors_Clients c LEFT JOIN sakaColors_Groups g ON g.groupName = c.groupName WHERE c.steamid = ? LIMIT 1`, [steamid]);
  return mapPreferences(rows[0]);
}

export async function savePlayerPreferences(steamid, raw) {
  const input = validatePlayerPreferences(raw);
  return withTransaction(async connection => {
    const [donors] = await connection.execute('SELECT is_active, expiry_date, tier FROM sakaDonate_users WHERE steamid = ? LIMIT 1 FOR UPDATE', [steamid]);
    if (!donorStatus(donors[0]).active && !await readPlayerAdmin(steamid, connection)) {
      throw createError({ statusCode: 403, statusMessage: 'Active donator benefits or admin access are required to change chat styling' });
    }
    const [rows] = await connection.execute('SELECT tag, nameColor, chatColor, useGroupTag, useGroupNameColor, useGroupChatColor, webRevision FROM sakaColors_Clients WHERE steamid = ? LIMIT 1 FOR UPDATE', [steamid]);
    const row = rows[0];
    if (!row) throw createError({ statusCode: 409, statusMessage: 'Join the game server once to create your color profile' });
    if (preferenceVersion(row) !== input.version) throw createError({ statusCode: 409, statusMessage: 'Settings changed in-game or in another tab. Reload them before saving.' });
    for (const key of ['nameColor', 'chatColor']) {
      if (/^\{[a-z]+\}$/.test(input[key]) && input[key] !== row[key]) {
        throw createError({ statusCode: 400, statusMessage: 'Choose a color with the color picker' });
      }
    }
    if (Number(row.webRevision) >= 2147483647) throw createError({ statusCode: 503, statusMessage: 'Color settings need administrator maintenance' });
    const [updated] = await connection.execute(`UPDATE sakaColors_Clients SET tag = ?, nameColor = ?, chatColor = ?, useGroupTag = ?, useGroupNameColor = ?, useGroupChatColor = ?, webRevision = webRevision + 1 WHERE steamid = ? AND webRevision = ?`,
      [input.tag, input.nameColor, input.chatColor, input.useGroupTag, input.useGroupNameColor, input.useGroupChatColor, steamid, row.webRevision]);
    if (updated.affectedRows !== 1) throw createError({ statusCode: 409, statusMessage: 'Settings changed. Reload and try again.' });
    return { success: true, revision: Number(row.webRevision) + 1 };
  });
}

export async function readPlayerStats(steamid, requestedSeason) {
  const current = await getCurrentSeason();
  const season = requestedSeason === undefined ? current : Number(requestedSeason);
  if (!Number.isSafeInteger(season) || season < 1 || season > current) throw createError({ statusCode: 400, statusMessage: 'Invalid season' });
  const table = await getSeasonTableName(season);
  const [info, rows] = await Promise.all([
    getSeasonInfo(season),
    executeQuery(`SELECT p.name, p.kills, p.deaths, p.playtime, p.points, p.topspeed, p.deflections,
      (SELECT COUNT(*) + 1 FROM ${table} r WHERE r.points > p.points AND r.name IS NOT NULL AND r.name != '' AND r.points > 0) AS rank
      FROM ${table} p WHERE p.steamid = ? LIMIT 1`, [steamid])
  ]);
  return { season, currentSeason: current, seasonName: info.displayName, player: rows[0] || null };
}
