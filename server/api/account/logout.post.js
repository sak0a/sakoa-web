import { defineEventHandler } from 'h3';
import { requirePlayerSession, revokePlayerSession } from '../../utils/player-auth.js';
export default defineEventHandler(async event => {
  await requirePlayerSession(event, true);
  await revokePlayerSession(event);
  return { success: true };
});
