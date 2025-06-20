import fs from 'fs';
import path from 'path';

// Get the absolute path to the project root directory
const projectRoot = process.cwd();
const donorsFilePath = path.join(projectRoot, 'server/data/donors.json');

export default defineEventHandler(async (event) => {
  try {
    // Read the donors.json file
    const data = await fs.promises.readFile(donorsFilePath, 'utf8');
    const donorsData = JSON.parse(data);

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
