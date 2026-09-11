import { createError, defineEventHandler, readBody } from 'h3';
import { useRuntimeConfig } from '#imports';
import { requirePlayerSession } from '../../utils/player-auth.js';
import { savePlayerPreferences } from '../../repositories/player-account.js';
export default defineEventHandler(async event => {
  const session = await requirePlayerSession(event, true);
  const enabled = useRuntimeConfig(event).playerColorWritesEnabled;
  if (enabled !== true && enabled !== 'true') throw createError({ statusCode: 503, statusMessage: 'Website color changes are not enabled yet' });
  return savePlayerPreferences(session.steamid, await readBody(event));
});
