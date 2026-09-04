import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, mergeSettings, publicSettings } from './settings.js';

vi.mock('../utils/database.js', () => ({
  executeQuery: vi.fn(),
  withTransaction: vi.fn()
}));

describe('application settings', () => {
  it('merges one section without dropping unrelated settings', () => {
    const result = mergeSettings(DEFAULT_SETTINGS, {
      maintenance: { enabled: true }
    });

    expect(result.maintenance.enabled).toBe(true);
    expect(result.maintenance.title).toBe(DEFAULT_SETTINGS.maintenance.title);
    expect(result.donations).toEqual(DEFAULT_SETTINGS.donations);
  });

  it('accepts valid month-end dates and rejects impossible dates', () => {
    expect(() => mergeSettings(DEFAULT_SETTINGS, {
      seasons: { startYear: 2028, startMonth: 2, startDay: 29 }
    })).not.toThrow();
    expect(() => mergeSettings(DEFAULT_SETTINGS, {
      seasons: { startYear: 2027, startMonth: 2, startDay: 29 }
    })).toThrow('valid calendar date');
  });

  it('rejects non-Discord invite URLs and exposes only public fields', () => {
    expect(() => mergeSettings(DEFAULT_SETTINGS, {
      discord: { inviteUrl: 'https://example.com/invite' }
    })).toThrow('HTTPS Discord URL');

    const result = publicSettings(DEFAULT_SETTINGS);
    expect(result).not.toHaveProperty('logging');
    expect(result.cache).toEqual({
      serverStatusInterval: DEFAULT_SETTINGS.cache.serverStatusInterval
    });
  });
});
