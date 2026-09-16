import { defineEventHandler, getQuery, getMethod, readBody, createError } from 'h3';
import { listPunishments, createPunishment, revokePunishment, reconcilePunishment, kickPlayer, livePlayers } from '../../../repositories/sourcebans.js';
import { runOperation } from '../../../utils/tf2-operations.js';

export default defineEventHandler(async event => {
  if (getMethod(event) === 'GET') {
    const query = getQuery(event);
    return query.view === 'players' ? { players: await livePlayers(query.sid) } : listPunishments(query);
  }
  if (getMethod(event) !== 'POST') throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
  const body = await readBody(event);
  const handlers = { create: createPunishment, revoke: revokePunishment, reconcile: reconcilePunishment, kick: kickPlayer };
  if (!Object.hasOwn(handlers, body?.action)) throw createError({ statusCode: 400, statusMessage: 'Unknown moderation action' });
  return runOperation(event, body, body.action, () => handlers[body.action](body, event.context.adminSession.steam64));
});
