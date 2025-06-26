import fs from 'fs';
import path from 'path';

// Get the absolute path to the project root directory
// In production, we need to go up from .output/server to the root
const projectRoot = process.cwd().includes('.output/server')
  ? path.join(process.cwd(), '../../')
  : process.cwd();
const settingsFilePath = path.join(projectRoot, 'server/data/settings.json');

// Helper function to read settings data
async function readSettingsData() {
  try {
    const data = await fs.promises.readFile(settingsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading settings data:', error);
    // Return default settings if file doesn't exist
    return {
      maintenance: {
        enabled: false,
        title: "Maintenance Mode",
        message: "We're currently performing maintenance on our servers. Please check back soon!",
        estimatedTime: "",
        lastUpdated: ""
      }
    };
  }
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  
  if (method === 'GET') {
    const settingsData = await readSettingsData();
    return {
      maintenance: settingsData.maintenance
    };
  } else {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    });
  }
});
