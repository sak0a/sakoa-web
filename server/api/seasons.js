import { getAvailableSeasons, getCurrentSeason } from '../utils/seasons.js';

export default defineEventHandler(async (event) => {
  try {
    const seasons = await getAvailableSeasons();
    const currentSeason = await getCurrentSeason();

    return {
      success: true,
      data: {
        seasons,
        currentSeason,
        total: seasons.length
      }
    };
  } catch (error) {
    console.error('Error fetching seasons:', error);

    return {
      success: false,
      error: 'Failed to fetch seasons',
      data: {
        seasons: [],
        currentSeason: 1,
        total: 0
      }
    };
  }
});
