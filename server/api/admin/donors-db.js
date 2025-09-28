import { executeQuery } from '../../utils/database.js';
import { clearCache } from '../../utils/cache.js';
import { normalizeToSteam3, isValidSteamId, steamIdForPlugin } from '../../utils/steamid.js';

// Helper function to check admin authentication
function checkAdminAuth(event) {
  const sessionCookie = getCookie(event, 'admin-session');
  if (sessionCookie !== 'authenticated') {
    console.error('Admin authentication failed - invalid or missing session cookie');
    throw createError({
      statusCode: 401,
      statusMessage: 'Admin password not found. Please log in again.'
    });
  }
}

// Helper function to validate donor data
function validateDonor(donor) {
  const errors = [];

  if (!donor.steamid || typeof donor.steamid !== 'string' || donor.steamid.trim() === '') {
    errors.push('Steam ID is required');
  } else {
    // Validate and normalize Steam ID
    const normalizedSteamId = normalizeToSteam3(donor.steamid.trim());
    if (!normalizedSteamId) {
      errors.push('Invalid Steam ID format. Use [U:1:XXXXXXX] or STEAM_0:X:XXXXXXX format');
    }
  }

  if (!donor.display_name || typeof donor.display_name !== 'string' || donor.display_name.trim() === '') {
    errors.push('Display name is required');
  }

  if (!donor.tier || typeof donor.tier !== 'string' || donor.tier.trim() === '') {
    errors.push('Tier is required');
  }
  
  if (donor.donations && Array.isArray(donor.donations)) {
    donor.donations.forEach((donation, index) => {
      if (!donation.amount || isNaN(parseFloat(donation.amount)) || parseFloat(donation.amount) <= 0) {
        errors.push(`Donation ${index + 1}: Invalid amount`);
      }
      
      if (!donation.date || !/^\d{4}-\d{2}-\d{2}$/.test(donation.date)) {
        errors.push(`Donation ${index + 1}: Invalid date format (use YYYY-MM-DD)`);
      }
    });
  }
  
  return errors;
}

// Helper function to get donor with donations
async function getDonorWithDonations(steamid) {
  try {
    // Get user info
    const userQuery = `
      SELECT steamid, display_name, tier, show_on_website, expiry_date, added_date, added_by
      FROM sakaDonate_users 
      WHERE steamid = ?
    `;
    const userRows = await executeQuery(userQuery, [steamid]);
    
    if (userRows.length === 0) {
      return null;
    }
    
    const user = userRows[0];
    
    // Get donations
    const donationsQuery = `
      SELECT amount, donation_date, added_date, added_by, notes
      FROM sakaDonate_donations 
      WHERE steamid = ?
      ORDER BY donation_date DESC
    `;
    const donations = await executeQuery(donationsQuery, [steamid]);
    
    return {
      steamid: user.steamid,
      display_name: user.display_name,
      tier: user.tier,
      show_on_website: user.show_on_website === 1,
      expiry_date: user.expiry_date,
      added_date: user.added_date,
      added_by: user.added_by,
      donations: donations.map(d => ({
        amount: parseFloat(d.amount),
        date: d.donation_date ? new Date(d.donation_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        added_date: d.added_date,
        added_by: d.added_by,
        notes: d.notes || ''
      })),
      total_amount: donations.reduce((sum, d) => sum + parseFloat(d.amount), 0)
    };
  } catch (error) {
    console.error('Error getting donor with donations:', error);
    throw error;
  }
}

// Helper function to get all donors with summary
async function getAllDonors() {
  try {
    const query = `
      SELECT 
        u.steamid,
        u.display_name,
        u.tier,
        u.show_on_website,
        u.expiry_date,
        u.added_date,
        u.added_by,
        COALESCE(SUM(d.amount), 0) as total_amount,
        COUNT(d.id) as donation_count
      FROM sakaDonate_users u
      LEFT JOIN sakaDonate_donations d ON u.steamid = d.steamid
      GROUP BY u.steamid, u.display_name, u.tier, u.show_on_website, u.expiry_date, u.added_date, u.added_by
      ORDER BY total_amount DESC
    `;
    
    const rows = await executeQuery(query);
    
    return rows.map(row => ({
      steamid: row.steamid,
      display_name: row.display_name,
      tier: row.tier,
      show_on_website: row.show_on_website === 1,
      expiry_date: row.expiry_date,
      added_date: row.added_date,
      added_by: row.added_by,
      total_amount: parseFloat(row.total_amount),
      donation_count: row.donation_count
    }));
  } catch (error) {
    console.error('Error getting all donors:', error);
    throw error;
  }
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  
  // Check admin authentication for all methods
  checkAdminAuth(event);
  
  if (method === 'GET') {
    // Get all donors with full details including donations and notes
    try {
      const summaryDonors = await getAllDonors();
      const donorsWithDetails = [];

      // Fetch full details for each donor
      for (const donor of summaryDonors) {
        try {
          const fullDonor = await getDonorWithDonations(donor.steamid);
          donorsWithDetails.push(fullDonor);
        } catch (error) {
          console.error(`Error fetching details for donor ${donor.steamid}:`, error);
          // Fallback to summary data if detailed fetch fails
          donorsWithDetails.push(donor);
        }
      }

      return {
        success: true,
        donors: donorsWithDetails
      };
    } catch (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch donors from database'
      });
    }
  } else if (method === 'POST') {
    // Add new donor
    try {
      const body = await readBody(event);
      const { donor } = body;
      
      if (!donor) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Donor data is required'
        });
      }
      
      // Validate donor data
      const validationErrors = validateDonor(donor);
      if (validationErrors.length > 0) {
        throw createError({
          statusCode: 400,
          statusMessage: `Validation failed: ${validationErrors.join(', ')}`
        });
      }
      
      // Normalize Steam ID to Steam3 format
      const normalizedSteamId = normalizeToSteam3(donor.steamid.trim());
      if (!normalizedSteamId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid Steam ID format'
        });
      }

      // Check if donor already exists
      const existingDonor = await getDonorWithDonations(normalizedSteamId);
      if (existingDonor) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Donor with this Steam ID already exists'
        });
      }

      // Insert user with normalized Steam ID
      const userQuery = `
        INSERT INTO sakaDonate_users (steamid, display_name, tier, show_on_website, expiry_date, added_date, added_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await executeQuery(userQuery, [
        normalizedSteamId,
        donor.display_name.trim(),
        donor.tier.trim(),
        donor.show_on_website || false,
        donor.expiry_date || 0,
        Math.floor(Date.now() / 1000),
        'admin-web'
      ]);
      
      // Insert donations if provided
      if (donor.donations && Array.isArray(donor.donations)) {
        const donationQuery = `
          INSERT INTO sakaDonate_donations (steamid, amount, donation_date, added_date, added_by, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        for (const donation of donor.donations) {
          await executeQuery(donationQuery, [
            normalizedSteamId,
            parseFloat(donation.amount),
            donation.date,
            Math.floor(Date.now() / 1000),
            'admin-web',
            donation.notes || null
          ]);
        }
      }
      
      // Clear cache
      clearCache('donors_list');
      
      // Return the created donor
      const newDonor = await getDonorWithDonations(normalizedSteamId);
      
      return {
        success: true,
        message: 'Donor added successfully',
        donor: newDonor
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      console.error('Error adding donor:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to add donor'
      });
    }
  } else if (method === 'PUT') {
    // Update existing donor
    try {
      const body = await readBody(event);
      const { steamid, donor } = body;
      
      if (!steamid || !donor) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Steam ID and donor data are required'
        });
      }
      
      // Validate donor data
      const validationErrors = validateDonor(donor);
      if (validationErrors.length > 0) {
        throw createError({
          statusCode: 400,
          statusMessage: `Validation failed: ${validationErrors.join(', ')}`
        });
      }
      
      // Check if donor exists
      const existingDonor = await getDonorWithDonations(steamid);
      if (!existingDonor) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Donor not found'
        });
      }
      
      // Update user
      const userQuery = `
        UPDATE sakaDonate_users
        SET display_name = ?, tier = ?, show_on_website = ?, expiry_date = ?
        WHERE steamid = ?
      `;

      await executeQuery(userQuery, [
        donor.display_name.trim(),
        donor.tier.trim(),
        donor.show_on_website || false,
        donor.expiry_date || 0,
        steamid
      ]);
      
      // Update donations - delete existing and insert new ones
      if (donor.donations && Array.isArray(donor.donations)) {
        // Delete existing donations
        await executeQuery('DELETE FROM sakaDonate_donations WHERE steamid = ?', [steamid]);
        
        // Insert new donations
        const donationQuery = `
          INSERT INTO sakaDonate_donations (steamid, amount, donation_date, added_date, added_by, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        for (const donation of donor.donations) {
          await executeQuery(donationQuery, [
            steamid,
            parseFloat(donation.amount),
            donation.date,
            Math.floor(Date.now() / 1000),
            'admin-web',
            donation.notes || null
          ]);
        }
      }
      
      // Clear cache
      clearCache('donors_list');
      
      // Return updated donor
      const updatedDonor = await getDonorWithDonations(steamid);
      
      return {
        success: true,
        message: 'Donor updated successfully',
        donor: updatedDonor
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      console.error('Error updating donor:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update donor'
      });
    }
  } else if (method === 'DELETE') {
    // Delete donor
    try {
      const query = getQuery(event);
      const { steamid } = query;
      
      if (!steamid) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Steam ID is required'
        });
      }
      
      // Check if donor exists
      const existingDonor = await getDonorWithDonations(steamid);
      if (!existingDonor) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Donor not found'
        });
      }
      
      // Delete donor (donations will be deleted automatically due to foreign key constraint)
      await executeQuery('DELETE FROM sakaDonate_users WHERE steamid = ?', [steamid]);
      
      // Clear cache
      clearCache('donors_list');
      
      return {
        success: true,
        message: 'Donor deleted successfully',
        deletedDonor: existingDonor
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      console.error('Error deleting donor:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete donor'
      });
    }
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  });
});
