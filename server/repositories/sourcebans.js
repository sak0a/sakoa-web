import { createError } from 'h3';
import { executeQuery, withTransaction } from '../utils/database.js';
import { integer, invalid, reasonText, steamIdentity, parseStatus } from '../utils/tf2-validation.js';
import { sourceRcon } from '../utils/source-rcon.js';

export async function sourceServers() {
  return executeQuery('SELECT sid,ip,port,rcon FROM sb_servers WHERE enabled=1 ORDER BY sid');
}

export async function sourceServer(sid) {
  const [server] = await executeQuery('SELECT sid,ip,port,rcon FROM sb_servers WHERE sid=? AND enabled=1', [integer(sid)]);
  if (!server) throw createError({ statusCode: 404, statusMessage: 'SourceBans server not found' });
  return server;
}

export async function livePlayers(sid) {
  return parseStatus(await sourceRcon(await sourceServer(sid), 'status'));
}

async function adminId(steam64) {
  const identity = steamIdentity(steam64);
  const rows = await executeQuery('SELECT aid FROM sb_admins WHERE authid IN (?,?,?,?)', identity.variants);
  if (rows.length !== 1) throw createError({ statusCode: 403, statusMessage: 'Your Steam account must match exactly one SourceBans admin' });
  return rows[0].aid;
}

export async function listPunishments(query) {
  const table = query.kind === 'comms' ? 'sb_comms' : 'sb_bans';
  const page = integer(query.page || 1, 1, 10000);
  const search = String(query.search || '').trim().slice(0, 100);
  const params = [];
  let where = '1=1';
  if (search) {
    let identity;
    try { identity = steamIdentity(search); } catch { /* A name search is also supported. */ }
    if (identity) { where += ' AND p.authid IN (?,?,?,?)'; params.push(...identity.variants); }
    else { where += ' AND (p.name LIKE ? OR p.reason LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  }
  if (query.active === 'true') where += " AND p.RemoveType IS NULL AND p.RemovedBy IS NULL AND (p.length=0 OR p.ends>UNIX_TIMESTAMP())";
  const [{ total }] = await executeQuery(`SELECT COUNT(*) AS total FROM ${table} p WHERE ${where}`, params);
  const rows = await executeQuery(`SELECT p.bid,p.type,p.authid,p.name,p.created,p.ends,p.length,p.reason,p.aid,p.sid,p.RemoveType,p.RemovedBy,p.RemovedOn,p.ureason,a.user AS admin,
    (p.RemoveType IS NULL AND p.RemovedBy IS NULL AND (p.length=0 OR p.ends>UNIX_TIMESTAMP())) AS active
    FROM ${table} p LEFT JOIN sb_admins a ON a.aid=p.aid WHERE ${where} ORDER BY p.bid DESC LIMIT 30 OFFSET ${(page - 1) * 30}`, params);
  return { rows, total: Number(total), page };
}

export async function enforcePunishment(identity, kind, seconds, servers = null) {
  const targets = servers || await sourceServers();
  return Promise.all(targets.map(async server => {
    try {
      const players = parseStatus(await sourceRcon(server, 'status'));
      const player = players.find(p => p.steam64 === identity.steam64);
      if (!player) return { sid: server.sid, status: 'not-connected' };
      const command = kind === 'ban' ? `kickid ${player.userId} "Banned. See sbpp.sakoa.xyz"`
        : `sc_fw_block ${kind === 'mute' ? 1 : kind === 'gag' ? 2 : 3} ${seconds} ${identity.steam3}`;
      const output = await sourceRcon(server, command);
      if (/unknown command|not found|error/i.test(output)) throw new Error();
      return { sid: server.sid, status: 'sent' };
    } catch {
      return { sid: server.sid, status: 'unconfirmed', message: 'Record saved; live delivery is unconfirmed. Reconcile after checking the server.' };
    }
  }));
}

export async function createPunishment(body, actor) {
  if (!['ban', 'mute', 'gag', 'silence'].includes(body.kind)) throw invalid('Choose ban, mute, gag, or silence');
  const identity = steamIdentity(body.steamId);
  const reason = reasonText(body.reason);
  const minutes = integer(body.minutes, 0, 525600);
  const seconds = minutes * 60;
  const name = String(body.name || identity.steam2).trim().slice(0, 128);
  const aid = await adminId(actor);
  const table = body.kind === 'ban' ? 'sb_bans' : 'sb_comms';
  const types = body.kind === 'ban' ? [0] : body.kind === 'silence' ? [1, 2] : [body.kind === 'mute' ? 1 : 2];
  const ids = await withTransaction(async connection => {
    // Serialize panel creates by Steam identity. Native SourceBans also rejects active duplicates.
    const lock = `tf2:${identity.steam64}`;
    const [[row]] = await connection.execute('SELECT GET_LOCK(?,5) AS acquired', [lock]);
    if (!row.acquired) throw createError({ statusCode: 409, statusMessage: 'Another moderation action is in progress' });
    try {
      const [existing] = await connection.execute(`SELECT bid FROM ${table} WHERE authid IN (?,?,?,?) AND type IN (${types.map(() => '?').join(',')}) AND RemovedBy IS NULL AND RemoveType IS NULL AND (length=0 OR ends>UNIX_TIMESTAMP()) FOR UPDATE`, [...identity.variants, ...types]);
      if (existing.length) throw createError({ statusCode: 409, statusMessage: 'An active punishment already exists. Review it before adding another.' });
      const inserted = [];
      for (const type of types) {
        const [result] = await connection.execute(`INSERT INTO ${table} (created,type,authid,name,ends,length,reason,aid,adminIp) VALUES (UNIX_TIMESTAMP(),?,?,?,UNIX_TIMESTAMP()+?,?,?,?,'')`, [type, identity.steam2, name, seconds, seconds, reason, aid]);
        inserted.push(result.insertId);
      }
      // Commit before releasing the named lock so another panel request sees the rows.
      await connection.commit();
      return inserted;
    } finally { await connection.execute('SELECT RELEASE_LOCK(?)', [lock]); }
  });
  let deliveries;
  try { deliveries = await enforcePunishment(identity, body.kind, seconds); }
  catch { deliveries = [{ status: 'unconfirmed', message: 'Saved; could not load live servers' }]; }
  return { saved: true, ids, deliveries, partial: deliveries.some(d => d.status === 'unconfirmed') };
}

async function deliverCurrentRecord(row, table) {
  const identity = steamIdentity(row.authid);
  const active = await executeQuery(`SELECT *,UNIX_TIMESTAMP() AS now FROM ${table} WHERE authid IN (?,?,?,?) AND type=? AND RemovedBy IS NULL AND RemoveType IS NULL AND (length=0 OR ends>UNIX_TIMESTAMP()) ORDER BY (length=0) DESC,ends DESC LIMIT 1`, [...identity.variants, row.type]);
  if (active.length) {
    const current = active[0];
    return enforcePunishment(identity, table === 'sb_bans' ? 'ban' : Number(row.type) === 1 ? 'mute' : 'gag', current.length ? current.ends - current.now : 0);
  }
  return Promise.all((await sourceServers()).map(async server => {
    try {
      for (const authid of identity.variants.slice(0, 2)) {
        const cmd = table === 'sb_bans' ? `removeid ${authid}` : `${Number(row.type) === 1 ? 'sc_fw_unmute' : 'sc_fw_ungag'} ${authid}`;
        const response = await sourceRcon(server, cmd);
        if (/unknown command/i.test(response)) throw new Error();
      }
      return { sid: server.sid, status: 'sent' };
    } catch { return { sid: server.sid, status: 'unconfirmed' }; }
  }));
}

export async function revokePunishment(body, actor) {
  const table = body.kind === 'comms' ? 'sb_comms' : body.kind === 'bans' ? 'sb_bans' : null;
  if (!table) throw invalid('Invalid punishment type');
  const bid = integer(body.bid), reason = reasonText(body.reason), aid = await adminId(actor);
  const row = await withTransaction(async connection => {
    const [[punishment]] = await connection.execute(`SELECT * FROM ${table} WHERE bid=? FOR UPDATE`, [bid]);
    if (!punishment) throw createError({ statusCode: 404, statusMessage: 'Punishment not found' });
    if (punishment.type === 1 && table === 'sb_bans') throw invalid('Manage legacy IP bans in SourceBans');
    if (punishment.RemovedBy !== null || punishment.RemoveType !== null) throw createError({ statusCode: 409, statusMessage: 'Punishment has already been removed' });
    steamIdentity(punishment.authid);
    await connection.execute(`UPDATE ${table} SET RemovedBy=?,RemoveType='U',RemovedOn=UNIX_TIMESTAMP(),ureason=? WHERE bid=?`, [aid, reason, bid]);
    return punishment;
  });
  let deliveries;
  try { deliveries = await deliverCurrentRecord(row, table); }
  catch { deliveries = [{ status: 'unconfirmed', message: 'Revoked in the database; live removal still needs checking' }]; }
  return { saved: true, deliveries, partial: deliveries.some(d => d.status === 'unconfirmed') };
}

export async function reconcilePunishment(body) {
  const table = body.kind === 'comms' ? 'sb_comms' : body.kind === 'bans' ? 'sb_bans' : null;
  if (!table) throw invalid('Invalid punishment type');
  const [row] = await executeQuery(`SELECT *,UNIX_TIMESTAMP() AS now FROM ${table} WHERE bid=?`, [integer(body.bid)]);
  if (!row) throw invalid('Punishment not found');
  if (table === 'sb_bans' && Number(row.type) !== 0) throw invalid('Manage IP bans in SourceBans');
  const deliveries = await deliverCurrentRecord(row, table);
  return { saved: true, deliveries, partial: deliveries.some(d => d.status === 'unconfirmed') };
}

export async function kickPlayer(body) {
  const server = await sourceServer(body.sid), identity = steamIdentity(body.steamId);
  const reason = reasonText(body.reason);
  // Reject command delimiters instead of relying on Source's inconsistent escaping rules.
  if (/[;"\\]/.test(reason)) throw invalid('Kick reasons cannot contain quotes, semicolons, or backslashes');
  const player = parseStatus(await sourceRcon(server, 'status')).find(p => p.steam64 === identity.steam64);
  if (!player) throw createError({ statusCode: 409, statusMessage: 'Player is no longer connected' });
  await sourceRcon(server, `kickid ${player.userId} "${reason}"`);
  return { sent: true, message: 'Kick command sent' };
}
