import { defineEventHandler } from 'h3';
import { readPlayerSession, playerOrigin } from '../../utils/player-auth.js';
export default defineEventHandler(async event => {
  let loginAvailable = true;
  try { playerOrigin(event); } catch { loginAvailable = false; }
  const session = await readPlayerSession(event);
  return { authenticated: Boolean(session), loginAvailable, ...session };
});
