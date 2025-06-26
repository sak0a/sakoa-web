import fs from 'fs';
import path from 'path';

// Get the absolute path to the project root directory
// In production, we need to go up from .output/server to the root
const projectRoot = process.cwd().includes('.output/server')
  ? path.join(process.cwd(), '../../')
  : process.cwd();
const donorsFilePath = path.join(projectRoot, 'server/data/donors.json');

export default defineEventHandler(async (event) => {
  try {
    // Read the donors.json file
    const data = await fs.promises.readFile(donorsFilePath, 'utf8');
    const donorsData = JSON.parse(data);

    // Process donors to calculate total amounts from individual donations
    donorsData.donors = donorsData.donors.map(donor => {
      if (donor.donations && Array.isArray(donor.donations)) {
        // Calculate total from individual donations
        const totalAmount = donor.donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
        return {
          ...donor,
          amount: totalAmount
        };
      }
      // Keep existing structure for donors without donations array
      return donor;
    });

    // Sort donors by amount (highest first)
    donorsData.donors.sort((a, b) => b.amount - a.amount);

    return donorsData;
  } catch (error) {
    console.error('Error reading donors data:', error);
    console.error('Attempted to read from:', donorsFilePath);

    return {
      donors: []
    };
  }
});
