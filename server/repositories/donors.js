import { executeQuery, withTransaction } from '../utils/database.js';
import { isValidSteamId, normalizeToSteam3 } from '../utils/steamid.js';

const MAX_DONATIONS_PER_DONOR = 100;
const MAX_DONATION_AMOUNT = 99_999_999.99;

function formatDate(value) {
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  return null;
}

function validCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateDonorInput(input) {
  const errors = [];
  const rawSteamId = typeof input?.steamid === 'string' ? input.steamid.trim() : '';
  const steamid = isValidSteamId(rawSteamId) ? normalizeToSteam3(rawSteamId) : null;
  const displayName = typeof input?.display_name === 'string' ? input.display_name.trim() : '';
  const tier = typeof input?.tier === 'string' ? input.tier.trim() : '';
  const expiryDate = input?.expiry_date ?? 0;
  const donations = Array.isArray(input?.donations) ? input.donations : null;

  if (!steamid) errors.push('Invalid Steam ID format. Use [U:1:XXXXXXX] or STEAM_0:X:XXXXXXX format');
  if (!displayName || displayName.length > 64) errors.push('Display name is required and must be at most 64 characters');
  if (!tier || tier.length > 32) errors.push('Tier is required and must be at most 32 characters');
  if (typeof input?.show_on_website !== 'boolean') errors.push('Website visibility must be a boolean');
  if (!Number.isSafeInteger(expiryDate) || expiryDate < 0 || expiryDate > 2_147_483_647) {
    errors.push('Expiry date must be a valid Unix timestamp through 2038');
  }
  if (!donations || donations.length === 0 || donations.length > MAX_DONATIONS_PER_DONOR) {
    errors.push(`Between 1 and ${MAX_DONATIONS_PER_DONOR} donations are required`);
  }

  const normalizedDonations = [];
  for (const [index, donation] of (donations || []).entries()) {
    const amount = donation?.amount;
    const date = typeof donation?.date === 'string' ? donation.date : '';
    const notes = typeof donation?.notes === 'string' ? donation.notes.trim() : '';

    if (
      !Number.isFinite(amount)
      || amount <= 0
      || amount > MAX_DONATION_AMOUNT
      || Math.abs((amount * 100) - Math.round(amount * 100)) > 1e-8
    ) {
      errors.push(`Donation ${index + 1}: amount must be positive with at most two decimal places`);
    }
    if (!validCalendarDate(date)) errors.push(`Donation ${index + 1}: date must be a valid YYYY-MM-DD date`);
    if (notes.length > 2000) errors.push(`Donation ${index + 1}: notes must be at most 2000 characters`);
    if (donation?.notes != null && typeof donation.notes !== 'string') {
      errors.push(`Donation ${index + 1}: notes must be text`);
    }

    normalizedDonations.push({ amount, date, notes });
  }

  if (errors.length > 0) return { success: false, errors };
  return {
    success: true,
    data: {
      steamid,
      displayName,
      tier,
      showOnWebsite: input.show_on_website === true,
      expiryDate,
      donations: normalizedDonations
    }
  };
}

function mapDonation(row) {
  return {
    amount: Number(row.amount),
    date: formatDate(row.donation_date),
    added_date: Number(row.added_date || 0),
    added_by: row.added_by,
    notes: row.notes || ''
  };
}

function mapDonors(userRows, donationRows) {
  const donationsBySteamId = new Map();
  for (const row of donationRows) {
    const donations = donationsBySteamId.get(row.steamid) || [];
    donations.push(mapDonation(row));
    donationsBySteamId.set(row.steamid, donations);
  }

  return userRows.map((row) => {
    const donations = donationsBySteamId.get(row.steamid) || [];
    return {
      steamid: row.steamid,
      display_name: row.display_name,
      tier: row.tier,
      show_on_website: Boolean(row.show_on_website),
      expiry_date: Number(row.expiry_date || 0),
      added_date: Number(row.added_date || 0),
      added_by: row.added_by,
      donations,
      total_amount: donations.reduce((total, donation) => total + donation.amount, 0),
      donation_count: donations.length
    };
  });
}

const USER_COLUMNS = `steamid, display_name, tier, show_on_website,
  expiry_date, added_date, added_by`;
const DONATION_COLUMNS = `steamid, amount, donation_date, added_date, added_by, notes`;

async function queryDonors(executor, steamid = null) {
  const where = steamid ? ' WHERE steamid = ?' : '';
  const params = steamid ? [steamid] : [];
  const usersResult = await executor(`SELECT ${USER_COLUMNS} FROM sakaDonate_users${where}`, params);
  const donationsResult = await executor(
    `SELECT ${DONATION_COLUMNS} FROM sakaDonate_donations${where}
     ORDER BY donation_date DESC, id DESC`,
    params
  );
  const donors = mapDonors(usersResult, donationsResult);
  donors.sort((left, right) => right.total_amount - left.total_amount || left.display_name.localeCompare(right.display_name));
  return donors;
}

function connectionExecutor(connection) {
  return async (query, params) => {
    const [rows] = await connection.execute(query, params);
    return rows;
  };
}

export function listDonors() {
  return queryDonors(executeQuery);
}

export async function getDonor(steamid) {
  const normalized = isValidSteamId(steamid) ? normalizeToSteam3(steamid) : null;
  if (!normalized) return null;
  const donors = await queryDonors(executeQuery, normalized);
  return donors[0] || null;
}

async function insertDonations(connection, steamid, donations, addedAt, actor) {
  const placeholders = donations.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
  const values = donations.flatMap((donation) => [
    steamid,
    donation.amount,
    donation.date,
    addedAt,
    actor,
    donation.notes || null
  ]);
  await connection.execute(
    `INSERT INTO sakaDonate_donations
      (steamid, amount, donation_date, added_date, added_by, notes)
     VALUES ${placeholders}`,
    values
  );
}

export async function createDonor(input, actor = 'admin-web') {
  const validation = validateDonorInput(input);
  if (!validation.success) return validation;
  const donor = validation.data;

  try {
    const data = await withTransaction(async (connection) => {
      const addedAt = Math.floor(Date.now() / 1000);
      await connection.execute(
        `INSERT INTO sakaDonate_users
          (steamid, display_name, tier, show_on_website, expiry_date, added_date, added_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          donor.steamid,
          donor.displayName,
          donor.tier,
          donor.showOnWebsite,
          donor.expiryDate,
          addedAt,
          actor
        ]
      );
      await insertDonations(connection, donor.steamid, donor.donations, addedAt, actor);
      return (await queryDonors(connectionExecutor(connection), donor.steamid))[0];
    });
    return { success: true, data };
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return { success: false, conflict: true, errors: ['Donor with this Steam ID already exists'] };
    }
    throw error;
  }
}

export async function updateDonor(currentSteamId, input, actor = 'admin-web') {
  const validation = validateDonorInput(input);
  if (!validation.success) return validation;
  const donor = validation.data;
  const normalizedCurrentId = isValidSteamId(currentSteamId) ? normalizeToSteam3(currentSteamId) : null;

  if (!normalizedCurrentId || donor.steamid !== normalizedCurrentId) {
    return { success: false, errors: ['Steam ID cannot be changed'] };
  }

  const result = await withTransaction(async (connection) => {
    const [existing] = await connection.execute(
      'SELECT steamid FROM sakaDonate_users WHERE steamid = ? FOR UPDATE',
      [normalizedCurrentId]
    );
    if (!existing[0]) return { missing: true };

    await connection.execute(
      `UPDATE sakaDonate_users
       SET display_name = ?, tier = ?, show_on_website = ?, expiry_date = ?
       WHERE steamid = ?`,
      [
        donor.displayName,
        donor.tier,
        donor.showOnWebsite,
        donor.expiryDate,
        normalizedCurrentId
      ]
    );
    await connection.execute('DELETE FROM sakaDonate_donations WHERE steamid = ?', [normalizedCurrentId]);
    await insertDonations(
      connection,
      normalizedCurrentId,
      donor.donations,
      Math.floor(Date.now() / 1000),
      actor
    );
    return {
      missing: false,
      data: (await queryDonors(connectionExecutor(connection), normalizedCurrentId))[0]
    };
  });

  if (result.missing) return { success: false, missing: true, errors: ['Donor not found'] };
  return { success: true, data: result.data };
}

export async function deleteDonor(steamid) {
  const normalized = isValidSteamId(steamid) ? normalizeToSteam3(steamid) : null;
  if (!normalized) return { success: false, errors: ['Invalid Steam ID'] };

  const result = await withTransaction(async (connection) => {
    const executor = connectionExecutor(connection);
    const [existing] = await connection.execute(
      'SELECT steamid FROM sakaDonate_users WHERE steamid = ? FOR UPDATE',
      [normalized]
    );
    if (!existing[0]) return { missing: true };

    const deletedDonor = (await queryDonors(executor, normalized))[0];
    await connection.execute('DELETE FROM sakaDonate_donations WHERE steamid = ?', [normalized]);
    await connection.execute('DELETE FROM sakaDonate_users WHERE steamid = ?', [normalized]);
    return { missing: false, data: deletedDonor };
  });

  if (result.missing) return { success: false, missing: true, errors: ['Donor not found'] };
  return { success: true, data: result.data };
}
