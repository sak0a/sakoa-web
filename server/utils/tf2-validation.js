import { createError } from 'h3';
/* eslint-disable no-control-regex -- Reject control characters in user-supplied commands and paths. */

export const invalid = message => createError({ statusCode: 400, statusMessage: message });

export function steamIdentity(value) {
  const text = String(value || '').trim();
  let account;
  const s2 = /^STEAM_[01]:([01]):(\d{1,10})$/.exec(text);
  const s3 = /^\[U:1:(\d{1,10})\]$/.exec(text);
  if (s2) account = BigInt(s2[2]) * 2n + BigInt(s2[1]);
  else if (s3) account = BigInt(s3[1]);
  else if (/^\d{17}$/.test(text)) account = BigInt(text) - 76561197960265728n;
  if (!account || account < 1n || account > 4294967295n) throw invalid('Enter a valid Steam2, Steam3, or SteamID64');
  const suffix = `${account % 2n}:${account / 2n}`;
  return { steam64: String(76561197960265728n + account), steam2: `STEAM_0:${suffix}`, steam3: `[U:1:${account}]`, variants: [`STEAM_0:${suffix}`, `STEAM_1:${suffix}`, `[U:1:${account}]`, String(76561197960265728n + account)] };
}

export function integer(value, min = 1, max = 2147483647) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) throw invalid('Invalid number');
  return n;
}

export function reasonText(value) {
  const text = String(value || '').trim();
  if (!text || text.length > 160 || /[\x00-\x1f\x7f]/.test(text)) throw invalid('A reason of 1–160 characters is required');
  return text;
}

export function configPath(value, directory = false) {
  const path = String(value || '');
  if (path.length > 240 || !/^\/tf\/(cfg|addons\/sourcemod\/configs)(\/|$)/.test(path)
    || path.split('/').some(part => part === '..' || part === '.' || part.startsWith('.saka-backup-'))
    || /[\\\x00-\x1f?#]/.test(path) || path.includes('//')) throw invalid('Choose a path within the TF2 config directories');
  if (!directory && !/\.(cfg|txt|ini|json)$/i.test(path)) throw invalid('Only text configuration files can be edited');
  return path;
}

export function parseStatus(output) {
  const players = [];
  for (const line of String(output).split('\n')) {
    const match = /^#\s*(\d+)\s+"(.*)"\s+(\[U:1:\d+\]|STEAM_[01]:[01]:\d+)\s+(\S+)\s+(\d+)\s+\d+\s+(\S+)/.exec(line.trim());
    if (!match) continue;
    try { players.push({ userId: Number(match[1]), name: match[2], ...steamIdentity(match[3]), connected: match[4], ping: Number(match[5]), state: match[6] }); } catch { /* Ignore unverified identities and bots. */ }
  }
  return players.map(({ variants, ...player }) => player);
}
