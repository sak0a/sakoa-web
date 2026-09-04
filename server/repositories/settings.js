import { executeQuery, withTransaction } from '../utils/database.js';

export const DEFAULT_SETTINGS = Object.freeze({
  maintenance: {
    enabled: false,
    title: 'Maintenance mode',
    message: 'We are performing maintenance. Please check back soon.',
    estimatedTime: ''
  },
  seasons: {
    startYear: 2025,
    startMonth: 6,
    startDay: 17
  },
  discord: {
    inviteUrl: 'https://discord.gg/JuxYYVEkzc'
  },
  donations: {
    paypalEnabled: true,
    revolutEnabled: false,
    buyMeACoffeeEnabled: true
  },
  heroStats: {
    uptime: '24/7',
    activePlayers: 0,
    monthlyDonations: 0,
    monthlyGoal: 30,
    autoUpdateDonations: false,
    autoUpdatePlayers: false
  },
  cache: {
    serverStatusInterval: 30,
    leaderboardInterval: 30,
    playerSearchInterval: 30,
    seasonalLeaderboardInterval: 30,
    databaseStatusInterval: 10,
    steamProfilesInterval: 1200
  }
});

const ALLOWED_SECTIONS = new Set(Object.keys(DEFAULT_SETTINGS));

function cloneDefaults() {
  return structuredClone(DEFAULT_SETTINGS);
}

function parsePayload(value) {
  if (!value) {
    return cloneDefaults();
  }

  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  return mergeSettings(cloneDefaults(), parsed);
}

function assertString(value, field, { allowEmpty = false, max = 500 } = {}) {
  if (typeof value !== 'string' || (!allowEmpty && value.trim() === '') || value.length > max) {
    throw new TypeError(`${field} must be a valid string`);
  }
  return value.trim();
}

function assertBoolean(value, field) {
  if (typeof value !== 'boolean') {
    throw new TypeError(`${field} must be a boolean`);
  }
  return value;
}

function assertInteger(value, field, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new TypeError(`${field} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function assertNumber(value, field, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new TypeError(`${field} must be a number between ${min} and ${max}`);
  }
  return value;
}

function validateSection(section, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError(`${section} must be an object`);
  }

  switch (section) {
    case 'maintenance':
      return {
        enabled: assertBoolean(input.enabled, 'maintenance.enabled'),
        title: assertString(input.title, 'maintenance.title', { max: 120 }),
        message: assertString(input.message, 'maintenance.message', { max: 1000 }),
        estimatedTime: assertString(input.estimatedTime ?? '', 'maintenance.estimatedTime', {
          allowEmpty: true,
          max: 120
        })
      };
    case 'seasons': {
      const startYear = assertInteger(input.startYear, 'seasons.startYear', 2020, 2200);
      const startMonth = assertInteger(input.startMonth, 'seasons.startMonth', 1, 12);
      const startDay = assertInteger(input.startDay, 'seasons.startDay', 1, 31);
      const date = new Date(Date.UTC(startYear, startMonth - 1, startDay));
      if (
        date.getUTCFullYear() !== startYear
        || date.getUTCMonth() !== startMonth - 1
        || date.getUTCDate() !== startDay
      ) {
        throw new TypeError('seasons start date must be a valid calendar date');
      }
      return { startYear, startMonth, startDay };
    }
    case 'discord': {
      const inviteUrl = assertString(input.inviteUrl, 'discord.inviteUrl', { max: 255 });
      const url = new URL(inviteUrl);
      if (url.protocol !== 'https:' || !['discord.gg', 'discord.com'].includes(url.hostname)) {
        throw new TypeError('discord.inviteUrl must be an HTTPS Discord URL');
      }
      return { inviteUrl: url.toString() };
    }
    case 'donations':
      return {
        paypalEnabled: assertBoolean(input.paypalEnabled, 'donations.paypalEnabled'),
        revolutEnabled: assertBoolean(input.revolutEnabled, 'donations.revolutEnabled'),
        buyMeACoffeeEnabled: assertBoolean(
          input.buyMeACoffeeEnabled,
          'donations.buyMeACoffeeEnabled'
        )
      };
    case 'heroStats':
      return {
        uptime: assertString(input.uptime, 'heroStats.uptime', { max: 32 }),
        activePlayers: assertInteger(input.activePlayers, 'heroStats.activePlayers', 0, 1_000_000),
        monthlyDonations: assertNumber(
          input.monthlyDonations,
          'heroStats.monthlyDonations',
          0,
          1_000_000
        ),
        monthlyGoal: assertNumber(input.monthlyGoal, 'heroStats.monthlyGoal', 1, 1_000_000),
        autoUpdateDonations: assertBoolean(
          input.autoUpdateDonations,
          'heroStats.autoUpdateDonations'
        ),
        autoUpdatePlayers: assertBoolean(input.autoUpdatePlayers, 'heroStats.autoUpdatePlayers')
      };
    case 'cache':
      return {
        serverStatusInterval: assertInteger(input.serverStatusInterval, 'cache.serverStatusInterval', 10, 3600),
        leaderboardInterval: assertInteger(input.leaderboardInterval, 'cache.leaderboardInterval', 10, 3600),
        playerSearchInterval: assertInteger(input.playerSearchInterval, 'cache.playerSearchInterval', 10, 3600),
        seasonalLeaderboardInterval: assertInteger(
          input.seasonalLeaderboardInterval,
          'cache.seasonalLeaderboardInterval',
          10,
          3600
        ),
        databaseStatusInterval: assertInteger(input.databaseStatusInterval, 'cache.databaseStatusInterval', 5, 3600),
        steamProfilesInterval: assertInteger(input.steamProfilesInterval, 'cache.steamProfilesInterval', 60, 86400)
      };
    default:
      throw new TypeError(`Unsupported settings section: ${section}`);
  }
}

export function mergeSettings(current, patch) {
  const merged = structuredClone(current || DEFAULT_SETTINGS);

  for (const [section, values] of Object.entries(patch || {})) {
    if (!ALLOWED_SECTIONS.has(section)) {
      continue;
    }

    const candidate = {
      ...DEFAULT_SETTINGS[section],
      ...merged[section],
      ...values
    };
    merged[section] = validateSection(section, candidate);
  }

  return merged;
}

export async function getSettingsRecord() {
  const rows = await executeQuery(
    'SELECT payload, revision, updated_at, updated_by FROM app_settings WHERE id = 1 LIMIT 1'
  );

  if (!rows[0]) {
    return {
      settings: cloneDefaults(),
      revision: 0,
      updatedAt: null,
      updatedBy: null,
      source: 'defaults'
    };
  }

  return {
    settings: parsePayload(rows[0].payload),
    revision: Number(rows[0].revision),
    updatedAt: rows[0].updated_at,
    updatedBy: rows[0].updated_by,
    source: 'database'
  };
}

export async function updateSettings(patch, updatedBy = 'admin') {
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      'SELECT payload, revision FROM app_settings WHERE id = 1 FOR UPDATE'
    );
    const current = rows[0] ? parsePayload(rows[0].payload) : cloneDefaults();
    const settings = mergeSettings(current, patch);
    const revision = Number(rows[0]?.revision || 0) + 1;

    await connection.execute(
      `INSERT INTO app_settings (id, payload, revision, updated_by)
       VALUES (1, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         payload = VALUES(payload),
         revision = VALUES(revision),
         updated_by = VALUES(updated_by)`,
      [JSON.stringify(settings), revision, updatedBy]
    );

    return { settings, revision };
  });
}

export function publicSettings(settings) {
  return {
    maintenance: { enabled: settings.maintenance.enabled },
    seasons: settings.seasons,
    discord: settings.discord,
    donations: settings.donations,
    heroStats: settings.heroStats,
    cache: {
      serverStatusInterval: settings.cache.serverStatusInterval
    }
  };
}
