import { describe, expect, it, vi } from 'vitest';
import { OPENID_NS, STEAM_OPENID_ENDPOINT, steam64ToSteam3, steamLoginUrl, verifySteamAssertion } from './steam-openid.js';

const now = Date.parse('2026-09-11T12:00:00Z');
const returnTo = 'https://example.com/api/auth/steam/callback?state=abc';
function assertion() {
  return new URLSearchParams({
    'openid.ns': OPENID_NS, 'openid.mode': 'id_res', 'openid.op_endpoint': STEAM_OPENID_ENDPOINT,
    'openid.claimed_id': 'https://steamcommunity.com/openid/id/76561197960265729',
    'openid.identity': 'https://steamcommunity.com/openid/id/76561197960265729',
    'openid.return_to': returnTo, 'openid.response_nonce': '2026-09-11T12:00:00Zunique',
    'openid.assoc_handle': 'association', 'openid.sig': 'signature',
    'openid.signed': 'op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle'
  });
}
describe('Steam authentication contract', () => {
  it('constructs Steam-hosted login with an exact return URL', () => {
    const url = new URL(steamLoginUrl(returnTo, 'https://example.com'));
    expect(url.origin).toBe('https://steamcommunity.com');
    expect(url.searchParams.get('openid.return_to')).toBe(returnTo);
    expect(url.searchParams.get('openid.realm')).toBe('https://example.com');
  });
  it('converts only valid individual Steam64 IDs without floating-point rounding', () => {
    expect(steam64ToSteam3('76561197960265729')).toBe('[U:1:1]');
    expect(steam64ToSteam3('76561202255233023')).toBe('[U:1:4294967295]');
    for (const value of ['76561197960265728', '76561202255233024', '1', '76561197960265729x', Number('76561197960265729')]) expect(steam64ToSteam3(value)).toBeNull();
  });
  it('asks the fixed Steam endpoint to validate the signed assertion', async () => {
    const request = vi.fn().mockResolvedValue(new Response('ns:' + OPENID_NS + '\nis_valid:true\n'));
    expect(await verifySteamAssertion(assertion(), returnTo, request, now)).toBe('76561197960265729');
    expect(request.mock.calls[0][0]).toBe(STEAM_OPENID_ENDPOINT);
    expect(request.mock.calls[0][1].body.get('openid.mode')).toBe('check_authentication');
    expect(request.mock.calls[0][1].redirect).toBe('error');
  });
  it.each([
    ['openid.op_endpoint', 'https://attacker.test/openid'],
    ['openid.return_to', 'https://example.com/api/auth/steam/callback?state=other'],
    ['openid.identity', 'https://steamcommunity.com/openid/id/76561197960265730'],
    ['openid.claimed_id', 'https://steamcommunity.com.attacker.test/openid/id/76561197960265729'],
    ['openid.signed', 'claimed_id,identity'],
    ['openid.response_nonce', '2026-09-11T11:54:00Zold'],
    ['openid.response_nonce', '2026-09-11T12:05:00Zfuture'],
    ['openid.response_nonce', 'invalid'],
    ['openid.mode', 'cancel'],
    ['openid.ns', 'invalid']
  ])('rejects modified %s before making a request', async (key, value) => {
    const params = assertion(); params.set(key, value);
    const request = vi.fn();
    await expect(verifySteamAssertion(params, returnTo, request, now)).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });
  it('rejects duplicate fields and a negative Steam verification', async () => {
    const params = assertion(); params.append('openid.identity', params.get('openid.identity'));
    await expect(verifySteamAssertion(params, returnTo, vi.fn(), now)).rejects.toThrow('Duplicate');
    await expect(verifySteamAssertion(assertion(), returnTo, async () => new Response('is_valid:false\n'), now)).rejects.toThrow('rejected');
    await expect(verifySteamAssertion(assertion(), returnTo, async () => new Response('', { status: 503 }), now)).rejects.toThrow('unavailable');
  });
});
