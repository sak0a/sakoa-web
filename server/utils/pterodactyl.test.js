import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fileRevision, pteroRequest, writeConfig, restoreConfig } from './pterodactyl.js';
const mocks = vi.hoisted(() => ({ runtime: {}, connection: { execute: vi.fn(), release: vi.fn() } }));
vi.mock('#imports', () => ({ useRuntimeConfig: () => mocks.runtime }));
vi.mock('./database.js', () => ({ getDbConnection: async () => ({ getConnection: async () => mocks.connection }) }));

beforeEach(() => {
  mocks.runtime = { pterodactylUrl: 'https://panel.example.test', pterodactylApiKey: 'private-token', tf2ServerMap: '{"2":"29fcc8a6"}' };
  mocks.connection.execute.mockReset().mockResolvedValue([[{ acquired: 1 }]]);
  mocks.connection.release.mockReset();
  vi.stubGlobal('fetch', vi.fn());
});
describe('Pterodactyl integration', () => {
  it('does not let a request choose an unmapped server', async () => {
    await expect(pteroRequest({}, 4, '/resources')).rejects.toMatchObject({ statusCode: 503 });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('keeps credentials in the upstream header and rejects redirects', async () => {
    fetch.mockResolvedValue(new Response('{"attributes":{"current_state":"running"}}'));
    await pteroRequest({}, 2, '/resources');
    const [url, options] = fetch.mock.calls[0];
    expect(String(url)).toBe('https://panel.example.test/api/client/servers/29fcc8a6/resources');
    expect(options.redirect).toBe('error');
    expect(options.headers.Authorization).toBe('Bearer private-token');
  });
  it('rejects stale revisions without creating a backup or writing', async () => {
    fetch.mockResolvedValue(new Response('changed'));
    await expect(writeConfig({}, { sid: 2, path: '/tf/cfg/server.cfg', content: 'new', revision: fileRevision('old'), operationId: '12345678-1234-1234-1234-123456789abc' })).rejects.toMatchObject({ statusCode: 409 });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mocks.connection.release).toHaveBeenCalled();
  });
  it('verifies the backup before overwriting, then verifies the new content', async () => {
    for (const body of ['old', '', 'old', 'old', '', 'new']) fetch.mockResolvedValueOnce(new Response(body));
    const result = await writeConfig({}, { sid: 2, path: '/tf/cfg/server.cfg', content: 'new', revision: fileRevision('old'), operationId: '12345678-1234-1234-1234-123456789abc' });
    expect(result.saved).toBe(true);
    expect(result.backup).toContain('/tf/cfg/.saka-backup-');
    expect(fetch.mock.calls[1][1].body).toBe('old');
    expect(fetch.mock.calls[4][1].body).toBe('new');
  });
  it('preserves recovery information if the final write is ambiguous', async () => {
    for (const body of ['old', '', 'old', 'old']) fetch.mockResolvedValueOnce(new Response(body));
    fetch.mockRejectedValueOnce(new Error('timeout'));
    const result = await writeConfig({}, { sid: 2, path: '/tf/cfg/server.cfg', content: 'new', revision: fileRevision('old'), operationId: '12345678-1234-1234-1234-123456789abc' });
    expect(result).toMatchObject({ saved: false, partial: true });
    expect(result.backup).toContain('server.cfg');
  });
  it('rejects a backup from a different file', async () => {
    await expect(restoreConfig({}, { sid: 2, path: '/tf/cfg/server.cfg', backup: '/tf/cfg/.saka-backup-12345678-1234-1234-1234-123456789abc-other.cfg' })).rejects.toMatchObject({ statusCode: 400 });
    expect(fetch).not.toHaveBeenCalled();
  });
});
