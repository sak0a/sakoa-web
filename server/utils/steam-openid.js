export const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';
export const OPENID_NS = 'http://specs.openid.net/auth/2.0';

export function steam64ToSteam3(value) {
  if (typeof value !== 'string' || !/^\d{17}$/.test(value)) return null;
  const account = BigInt(value) - BigInt('76561197960265728');
  return account > BigInt(0) && account <= BigInt('4294967295') ? `[U:1:${account}]` : null;
}

export function steamLoginUrl(returnTo, origin) {
  const url = new URL(STEAM_OPENID_ENDPOINT);
  const identifier = 'http://specs.openid.net/auth/2.0/identifier_select';
  url.search = new URLSearchParams({
    'openid.ns': OPENID_NS, 'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo, 'openid.realm': origin,
    'openid.identity': identifier, 'openid.claimed_id': identifier
  }).toString();
  return url.href;
}

export async function verifySteamAssertion(params, returnTo, request = fetch, now = Date.now()) {
  for (const key of params.keys()) {
    if (params.getAll(key).length !== 1) throw new Error('Duplicate assertion field');
  }
  const read = key => params.get(`openid.${key}`);
  const signed = new Set((read('signed') || '').split(','));
  const required = ['op_endpoint', 'claimed_id', 'identity', 'return_to', 'response_nonce', 'assoc_handle'];
  const claimed = read('claimed_id');
  const match = claimed?.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/);
  const nonce = read('response_nonce') || '';
  const timestamp = Date.parse(nonce.slice(0, 20));
  if (read('ns') !== OPENID_NS || read('mode') !== 'id_res'
    || read('op_endpoint') !== STEAM_OPENID_ENDPOINT || read('return_to') !== returnTo
    || !match || !steam64ToSteam3(match[1]) || read('identity') !== claimed
    || !required.every(key => signed.has(key) && read(key)) || !read('sig')
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z.+$/.test(nonce)
    || !Number.isFinite(timestamp) || now - timestamp > 300_000 || timestamp > now + 60_000) {
    throw new Error('Invalid Steam assertion');
  }
  const body = new URLSearchParams();
  for (const [key, value] of params) if (key.startsWith('openid.')) body.set(key, value);
  body.set('openid.mode', 'check_authentication');
  const response = await request(STEAM_OPENID_ENDPOINT, {
    method: 'POST', body, redirect: 'error', signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error('Steam verification unavailable');
  const result = await response.text();
  const lines = result.split(/\r?\n/);
  if (lines.filter(line => line === 'is_valid:true').length !== 1
    || lines.some(line => line.startsWith('is_valid:') && line !== 'is_valid:true')) {
    throw new Error('Steam rejected assertion');
  }
  return match[1];
}
