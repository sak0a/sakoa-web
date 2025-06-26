// Season calculation utilities based on the SourceMod plugin logic

/**
 * Season configuration - matches the SourceMod plugin settings
 */
const SEASON_CONFIG = {
  startDay: 15, // Day of month when seasons start (15th)
  referenceYear: 2025, // Reference year for season calculation
  referenceMonth: 5 // Reference month (January = 1)
};

/**
 * Calculate the current season number based on the current date
 * @returns {number} Current season number
 */
export function getCurrentSeason() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based
  const currentDay = now.getDate();

  // Calculate months since reference point
  let monthsSinceReference = (currentYear - SEASON_CONFIG.referenceYear) * 12 + 
                            (currentMonth - SEASON_CONFIG.referenceMonth);

  // If we haven't reached the season start day this month, we're still in the previous season
  if (currentDay < SEASON_CONFIG.startDay) {
    monthsSinceReference--;
  }

  // Season numbers start from 1
  return Math.max(1, monthsSinceReference + 1);
}

/**
 * Get the date range for a specific season
 * @param {number} seasonNumber - Season number (1, 2, 3, etc.)
 * @returns {object} - { startDate: Date, endDate: Date, seasonNumber: number }
 */
export function getSeasonDateRange(seasonNumber) {
  if (seasonNumber < 1) {
    throw new Error('Season number must be 1 or greater');
  }

  // Calculate the start month for this season
  const monthsFromReference = seasonNumber - 1;
  const startYear = SEASON_CONFIG.referenceYear + Math.floor((SEASON_CONFIG.referenceMonth - 1 + monthsFromReference) / 12);
  const startMonth = ((SEASON_CONFIG.referenceMonth - 1 + monthsFromReference) % 12) + 1;

  // Season starts on the configured day of the start month
  const startDate = new Date(startYear, startMonth - 1, SEASON_CONFIG.startDay);

  // Calculate end date directly (next season start - 1 day)
  const nextMonthsFromReference = seasonNumber; // Next season
  const nextStartYear = SEASON_CONFIG.referenceYear + Math.floor((SEASON_CONFIG.referenceMonth - 1 + nextMonthsFromReference) / 12);
  const nextStartMonth = ((SEASON_CONFIG.referenceMonth - 1 + nextMonthsFromReference) % 12) + 1;
  const nextSeasonStart = new Date(nextStartYear, nextStartMonth - 1, SEASON_CONFIG.startDay);
  const endDate = new Date(nextSeasonStart.getTime() - 24 * 60 * 60 * 1000); // One day before

  return {
    startDate,
    endDate,
    seasonNumber
  };
}

/**
 * Get a list of all available seasons (from season 1 to current season)
 * @returns {Array} Array of season objects with metadata
 */
export function getAvailableSeasons() {
  const currentSeason = getCurrentSeason();
  const seasons = [];

  for (let i = 1; i <= currentSeason; i++) {
    const dateRange = getSeasonDateRange(i);
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
 * @returns {string} Database table name
 */
export function getSeasonTableName(seasonNumber) {
  const currentSeason = getCurrentSeason();
  
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
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidSeason(seasonNumber) {
  const currentSeason = getCurrentSeason();
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
 * @returns {object} Season information object
 */
export function getSeasonInfo(seasonNumber) {
  if (!isValidSeason(seasonNumber)) {
    throw new Error(`Invalid season number: ${seasonNumber}`);
  }

  const currentSeason = getCurrentSeason();
  const dateRange = getSeasonDateRange(seasonNumber);
  const isCurrent = seasonNumber === currentSeason;

  return {
    seasonNumber,
    name: `Season ${seasonNumber}`,
    displayName: isCurrent ? `Season ${seasonNumber} (Current)` : `Season ${seasonNumber}`,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    isCurrent,
    tableName: getSeasonTableName(seasonNumber),
    dateRange: `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`
  };
}
