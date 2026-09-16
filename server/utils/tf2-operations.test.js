import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runOperation } from './tf2-operations.js';
const mocks = vi.hoisted(() => ({ query: vi.fn(), audit: vi.fn() }));
vi.mock('./database.js', () => ({ executeQuery: mocks.query }));
vi.mock('../repositories/audit.js', () => ({ recordAdminAudit: mocks.audit }));
const event = { context: { adminSession: { steam64: '76561198000000000' } } };
const body = { operationId: '12345678-1234-1234-1234-123456789abc', sid: 2, command: 'status' };
beforeEach(() => { mocks.query.mockReset().mockResolvedValue({}); mocks.audit.mockReset().mockResolvedValue({}); });
describe('durable TF2 operation tracking', () => {
  it('records intent before the external action and omits payload secrets from audit', async () => {
    const perform = vi.fn(async () => {
      expect(mocks.audit).toHaveBeenCalledTimes(1);
      return { sent: true };
    });
    await expect(runOperation(event, body, 'command', perform)).resolves.toEqual({ sent: true });
    expect(JSON.stringify(mocks.audit.mock.calls)).not.toContain('status');
  });
  it('does not execute an action when intent cannot be recorded', async () => {
    mocks.audit.mockRejectedValueOnce(new Error('database unavailable'));
    const perform = vi.fn();
    await expect(runOperation(event, body, 'command', perform)).rejects.toThrow();
    expect(perform).not.toHaveBeenCalled();
  });
  it('refuses to replay an incomplete duplicate request', async () => {
    mocks.query.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' }).mockResolvedValueOnce([{ actor_steam64: 'someone-else', request_hash: 'x', status: 'started' }]);
    const perform = vi.fn();
    await expect(runOperation(event, body, 'command', perform)).rejects.toMatchObject({ statusCode: 409 });
    expect(perform).not.toHaveBeenCalled();
  });
});
