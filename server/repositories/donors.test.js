import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeQuery, withTransaction } from '../utils/database.js';
import { createDonor, listDonors, validateDonorInput } from './donors.js';

vi.mock('../utils/database.js', () => ({
  executeQuery: vi.fn(),
  withTransaction: vi.fn()
}));

const validDonor = {
  steamid: 'STEAM_0:1:19867636',
  display_name: 'Player One',
  tier: 'Supporter',
  show_on_website: true,
  expiry_date: 0,
  donations: [{ amount: 12.5, date: '2026-09-04', notes: 'Monthly support' }]
};

describe('donor input validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('normalizes Steam2 IDs and trims persisted text', () => {
    const result = validateDonorInput({
      ...validDonor,
      display_name: '  Player One  ',
      tier: '  Supporter '
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        steamid: '[U:1:39735273]',
        displayName: 'Player One',
        tier: 'Supporter',
        showOnWebsite: true
      }
    });
  });

  it('rejects malformed calendar dates and unsupported precision', () => {
    const result = validateDonorInput({
      ...validDonor,
      donations: [{ amount: 1.999, date: '2026-02-30' }]
    });

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.stringContaining('two decimal places'),
      expect.stringContaining('valid YYYY-MM-DD')
    ]));
  });

  it('rejects malformed IDs, implicit booleans, and empty histories', () => {
    const result = validateDonorInput({
      ...validDonor,
      steamid: '[U:1:not-a-number]',
      show_on_website: 'true',
      donations: []
    });

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(3);
  });

  it('does not coerce database-bound numbers from strings', () => {
    const result = validateDonorInput({
      ...validDonor,
      expiry_date: '0',
      donations: [{ amount: '12.50', date: '2026-09-04' }]
    });

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.stringContaining('Expiry date'),
      expect.stringContaining('amount')
    ]));
  });

  it('loads all donors and their histories in two queries', async () => {
    vi.mocked(executeQuery)
      .mockResolvedValueOnce([
        {
          steamid: '[U:1:1]',
          display_name: 'One',
          tier: 'Supporter',
          show_on_website: 1,
          expiry_date: 0,
          added_date: 1,
          added_by: 'admin'
        },
        {
          steamid: '[U:1:2]',
          display_name: 'Two',
          tier: 'Supporter',
          show_on_website: 0,
          expiry_date: 0,
          added_date: 1,
          added_by: 'admin'
        }
      ])
      .mockResolvedValueOnce([
        {
          steamid: '[U:1:1]',
          amount: '4.50',
          donation_date: '2026-09-04',
          added_date: 1,
          added_by: 'admin',
          notes: null
        }
      ]);

    const result = await listDonors();

    expect(executeQuery).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ steamid: '[U:1:1]', total_amount: 4.5, donation_count: 1 });
    expect(result[1]).toMatchObject({ steamid: '[U:1:2]', total_amount: 0, donation_count: 0 });
  });

  it('creates the donor and donation history through one transaction connection', async () => {
    const connection = {
      execute: vi.fn()
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([[
          {
            steamid: '[U:1:39735273]',
            display_name: 'Player One',
            tier: 'Supporter',
            show_on_website: 1,
            expiry_date: 0,
            added_date: 1,
            added_by: 'actor'
          }
        ], []])
        .mockResolvedValueOnce([[
          {
            steamid: '[U:1:39735273]',
            amount: '12.50',
            donation_date: '2026-09-04',
            added_date: 1,
            added_by: 'actor',
            notes: 'Monthly support'
          }
        ], []])
    };
    vi.mocked(withTransaction).mockImplementation((callback) => callback(connection));

    const result = await createDonor(validDonor, 'actor');

    expect(withTransaction).toHaveBeenCalledOnce();
    expect(connection.execute).toHaveBeenCalledTimes(4);
    expect(result).toMatchObject({
      success: true,
      data: { steamid: '[U:1:39735273]', total_amount: 12.5 }
    });
  });
});
