import fs from 'fs';
import path from 'path';

// Get the absolute path to the project root directory
// In production, we need to go up from .output/server to the root
const projectRoot = process.cwd().includes('.output/server')
  ? path.join(process.cwd(), '../../')
  : process.cwd();
const donorsFilePath = path.join(projectRoot, 'server/data/donors.json');

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

// Helper function to read donors data
async function readDonorsData() {
  try {
    const data = await fs.promises.readFile(donorsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading donors data:', error);
    return { donors: [] };
  }
}

// Helper function to write donors data
async function writeDonorsData(data) {
  try {
    await fs.promises.writeFile(donorsFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing donors data:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save donors data'
    });
  }
}

// Helper function to validate donor data
function validateDonor(donor) {
  const errors = [];

  if (!donor.name || typeof donor.name !== 'string' || donor.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }

  if (!donor.tier || typeof donor.tier !== 'string' || donor.tier.trim().length === 0) {
    errors.push('Tier is required and must be a non-empty string');
  }

  // SteamID is optional but if provided, should be valid format
  if (donor.steamid && (typeof donor.steamid !== 'string' || donor.steamid.trim().length === 0)) {
    errors.push('SteamID must be a non-empty string if provided');
  }

  // Validate donations array
  if (!donor.donations || !Array.isArray(donor.donations) || donor.donations.length === 0) {
    errors.push('At least one donation is required');
  } else {
    donor.donations.forEach((donation, index) => {
      if (!donation.amount || typeof donation.amount !== 'number' || donation.amount <= 0) {
        errors.push(`Donation ${index + 1}: Amount is required and must be a positive number`);
      }
      if (!donation.date || typeof donation.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(donation.date)) {
        errors.push(`Donation ${index + 1}: Date is required and must be in YYYY-MM-DD format`);
      }
    });
  }

  return errors;
}

// Helper function to calculate total amount from donations
function calculateTotalAmount(donations) {
  if (!Array.isArray(donations)) return 0;
  return donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  
  // Check admin authentication for all methods
  checkAdminAuth(event);
  
  if (method === 'GET') {
    // Get all donors and calculate total amounts
    const donorsData = await readDonorsData();

    // Process donors to ensure total amounts are calculated
    donorsData.donors = donorsData.donors.map(donor => {
      if (donor.donations && Array.isArray(donor.donations)) {
        return {
          ...donor,
          amount: calculateTotalAmount(donor.donations)
        };
      }
      return donor;
    });

    return donorsData;
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
      
      // Read current data
      const donorsData = await readDonorsData();
      
      // Add new donor
      const newDonor = {
        name: donor.name.trim(),
        tier: donor.tier.trim(),
        donations: donor.donations.map(donation => ({
          amount: parseFloat(donation.amount),
          date: donation.date
        })),
        amount: calculateTotalAmount(donor.donations)
      };

      // Add SteamID if provided
      if (donor.steamid && donor.steamid.trim()) {
        newDonor.steamid = donor.steamid.trim();
      }

      donorsData.donors.push(newDonor);
      
      // Save updated data
      await writeDonorsData(donorsData);
      
      return {
        success: true,
        message: 'Donor added successfully',
        donor: donorsData.donors[donorsData.donors.length - 1]
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to add donor'
      });
    }
  } else if (method === 'PUT') {
    // Update existing donor
    try {
      const body = await readBody(event);
      const { index, donor } = body;
      
      if (typeof index !== 'number' || index < 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Valid index is required'
        });
      }
      
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
      
      // Read current data
      const donorsData = await readDonorsData();
      
      if (index >= donorsData.donors.length) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Donor not found'
        });
      }
      
      // Update donor
      const updatedDonor = {
        name: donor.name.trim(),
        tier: donor.tier.trim(),
        donations: donor.donations.map(donation => ({
          amount: parseFloat(donation.amount),
          date: donation.date
        })),
        amount: calculateTotalAmount(donor.donations)
      };

      // Add SteamID if provided
      if (donor.steamid && donor.steamid.trim()) {
        updatedDonor.steamid = donor.steamid.trim();
      }

      donorsData.donors[index] = updatedDonor;
      
      // Save updated data
      await writeDonorsData(donorsData);
      
      return {
        success: true,
        message: 'Donor updated successfully',
        donor: donorsData.donors[index]
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update donor'
      });
    }
  } else if (method === 'DELETE') {
    // Delete donor
    try {
      const query = getQuery(event);
      const index = parseInt(query.index);
      
      if (isNaN(index) || index < 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Valid index is required'
        });
      }
      
      // Read current data
      const donorsData = await readDonorsData();
      
      if (index >= donorsData.donors.length) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Donor not found'
        });
      }
      
      // Remove donor
      const deletedDonor = donorsData.donors.splice(index, 1)[0];
      
      // Save updated data
      await writeDonorsData(donorsData);
      
      return {
        success: true,
        message: 'Donor deleted successfully',
        deletedDonor
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete donor'
      });
    }
  } else {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    });
  }
});
