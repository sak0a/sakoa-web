// Season calculation utilities based on the SourceMod plugin logic
import fs from 'fs';
import path from 'path';

/**
 * Default season configuration - used as fallback
 */
const DEFAULT_SEASON_CONFIG = {
  startDay: 15, // Day of month when seasons start (15th)
  referenceYear: 2025, // Reference year for season calculation
  referenceMonth: 5 // Reference month (January = 1)
};

/**
 * Get season configuration from settings file
 * @returns {object} Season configuration
 */
async function getSeasonConfig() {
  try {
    // Get the absolute path to the project root directory
    const projectRoot = process.cwd().includes('.output/server')
      ? path.join(process.cwd(), '../../')
      : process.cwd();
    const settingsFilePath = path.join(projectRoot, 'server/data/settings.json');

    const data = await fs.promises.readFile(settingsFilePath, 'utf8');
    const settings = JSON.parse(data);

    if (settings.seasons) {
      return {
        startDay: settings.seasons.startDay || DEFAULT_SEASON_CONFIG.startDay,
        referenceYear: settings.seasons.startYear || DEFAULT_SEASON_CONFIG.referenceYear,
        referenceMonth: settings.seasons.startMonth || DEFAULT_SEASON_CONFIG.referenceMonth
      };
    }
  } catch (error) {
    console.warn('Failed to load season config from settings, using defaults:', error);
  }

  return DEFAULT_SEASON_CONFIG;
}

/**
 * Calculate the current season number based on the current date
 * @returns {Promise<number>} Current season number
 */
export async function getCurrentSeason() {
  const config = await getSeasonConfig();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based
  const currentDay = now.getDate();

  // Calculate months since reference point
  let monthsSinceReference = (currentYear - config.referenceYear) * 12 +
                            (currentMonth - config.referenceMonth);

  // If we haven't reached the season start day this month, we're still in the previous season
  if (currentDay < config.startDay) {
    monthsSinceReference--;
  }

  // Season numbers start from 1
  return Math.max(1, monthsSinceReference + 1);
}

/**
 * Get the date range for a specific season
 * @param {number} seasonNumber - Season number (1, 2, 3, etc.)
 * @returns {Promise<object>} - { startDate: Date, endDate: Date, seasonNumber: number }
 */
export async function getSeasonDateRange(seasonNumber) {
  if (seasonNumber < 1) {
    throw new Error('Season number must be 1 or greater');
  }

  const config = await getSeasonConfig();

  // Calculate the start month for this season
  const monthsFromReference = seasonNumber - 1;
  const startYear = config.referenceYear + Math.floor((config.referenceMonth - 1 + monthsFromReference) / 12);
  const startMonth = ((config.referenceMonth - 1 + monthsFromReference) % 12) + 1;

  // Season starts on the configured day of the start month
  const startDate = new Date(startYear, startMonth - 1, config.startDay);

  // Calculate end date directly (next season start - 1 day)
  const nextMonthsFromReference = seasonNumber; // Next season
  const nextStartYear = config.referenceYear + Math.floor((config.referenceMonth - 1 + nextMonthsFromReference) / 12);
  const nextStartMonth = ((config.referenceMonth - 1 + nextMonthsFromReference) % 12) + 1;
  const nextSeasonStart = new Date(nextStartYear, nextStartMonth - 1, config.startDay);
  const endDate = new Date(nextSeasonStart.getTime() - 24 * 60 * 60 * 1000); // One day before

  return {
    startDate,
    endDate,
    seasonNumber
  };
}

/**
 * Get a list of all available seasons (from season 1 to current season)
 * @returns {Promise<Array>} Array of season objects with metadata
 */
export async function getAvailableSeasons() {
  const currentSeason = await getCurrentSeason();
  const seasons = [];

  for (let i = 1; i <= currentSeason; i++) {
    const dateRange = await getSeasonDateRange(i);
    const isCurrent = i === currentSeason;

    seasons.push({
      seasonNumber: i,
      name: `Season ${i}`,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      isCurrent,
      tableName: i === currentSeason ? 'sakaStats' : `sakaStats_s${i}`,
      displayName: isCurrent ? `Season ${i} (Current)` : `Season ${i}`,
      dateRange: `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`
    });
  }

  // Return in reverse order (newest first)
  return seasons.reverse();
}

/**
 * Get the database table name for a specific season
 * @param {number} seasonNumber - Season number
 * @returns {Promise<string>} Database table name
 */
export async function getSeasonTableName(seasonNumber) {
  const currentSeason = await getCurrentSeason();

  if (seasonNumber === currentSeason) {
    return 'sakaStats';
  } else if (seasonNumber >= 1 && seasonNumber < currentSeason) {
    return `sakaStats_s${seasonNumber}`;
  } else {
    throw new Error(`Invalid season number: ${seasonNumber}`);
  }
}

/**
 * Validate if a season number is valid
 * @param {number} seasonNumber - Season number to validate
 * @returns {Promise<boolean>} True if valid, false otherwise
 */
export async function isValidSeason(seasonNumber) {
  const currentSeason = await getCurrentSeason();
  return seasonNumber >= 1 && seasonNumber <= currentSeason;
}

/**
 * Format a date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get season information for display
 * @param {number} seasonNumber - Season number
 * @returns {Promise<object>} Season information object
 */
export async function getSeasonInfo(seasonNumber) {
  if (!(await isValidSeason(seasonNumber))) {
    throw new Error(`Invalid season number: ${seasonNumber}`);
  }

  const currentSeason = await getCurrentSeason();
  const dateRange = await getSeasonDateRange(seasonNumber);
  const isCurrent = seasonNumber === currentSeason;

  return {
    seasonNumber,
    name: `Season ${seasonNumber}`,
    displayName: isCurrent ? `Season ${seasonNumber} (Current)` : `Season ${seasonNumber}`,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    isCurrent,
    tableName: await getSeasonTableName(seasonNumber),
    dateRange: `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`
  };
}
