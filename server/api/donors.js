import { getCachedData } from '../utils/cache.js';
import { executeQuery } from '../utils/database.js';

// Fetch donors from database
async function fetchDonorsFromDatabase() {
  try {
    const query = `
      SELECT
        u.steamid,
        u.display_name,
        u.tier,
        u.show_on_website,
        COALESCE(SUM(d.amount), 0) as total_amount,
        COUNT(d.id) as donation_count,
        MIN(d.donation_date) as first_donation_date,
        MAX(d.donation_date) as last_donation_date
      FROM sakaDonate_users u
      LEFT JOIN sakaDonate_donations d ON u.steamid = d.steamid
      WHERE u.show_on_website = TRUE
      GROUP BY u.steamid, u.display_name, u.tier, u.show_on_website
      ORDER BY total_amount DESC
    `;

    const rows = await executeQuery(query);

    // Transform database rows to match expected format
    const donors = rows.map(row => ({
      name: row.display_name || 'Anonymous Donor',
      tier: row.tier || 'Supporter',
      amount: parseFloat(row.total_amount) || 0,
      steamid: row.steamid,
      donationCount: row.donation_count || 0,
      firstDonation: row.first_donation_date,
      lastDonation: row.last_donation_date
    }));

    return { donors };
  } catch (error) {
    console.error('Error fetching donors from database:', error);
    throw error;
  }
}

export default defineEventHandler(async (event) => {
  try {
    // Use cached data with 30-second TTL for donor information
    const result = await getCachedData('donors_list', fetchDonorsFromDatabase, 'default');

    return {
      ...result.data,
      cached: result.cached,
      timestamp: result.timestamp,
      source: result.source
    };
  } catch (error) {
    console.error('Error in donors API:', error);

    // Return fallback data if database is unavailable
    return {
      donors: [
        {
          name: "saka",
          amount: 100,
          tier: "VIP",
          steamid: "[U:1:XXXXXXXX]",
          donationCount: 1,
          firstDonation: "2024-05-15",
          lastDonation: "2024-05-15"
        }
      ],
      error: "Database unavailable, showing fallback data",
      cached: false,
      source: 'fallback'
    };
  }
});
