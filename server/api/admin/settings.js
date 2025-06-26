import fs from 'fs';
import path from 'path';

// Get the absolute path to the project root directory
const projectRoot = process.cwd();
const settingsFilePath = path.join(projectRoot, 'server/data/settings.json');

// Helper function to check admin authentication
function checkAdminAuth(event) {
  const sessionCookie = getCookie(event, 'admin-session');
  if (sessionCookie !== 'authenticated') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - Admin access required'
    });
  }
}

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

// Helper function to write settings data
async function writeSettingsData(data) {
  try {
    await fs.promises.writeFile(settingsFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing settings data:', error);
    throw error;
  }
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  
  // Check admin authentication for all methods
  checkAdminAuth(event);
  
  if (method === 'GET') {
    // Get current settings
    const settingsData = await readSettingsData();
    return settingsData;
  } else if (method === 'PUT') {
    // Update settings
    try {
      const body = await readBody(event);
      const { settings } = body;
      
      if (!settings) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Settings data is required'
        });
      }
      
      // Read current data
      const settingsData = await readSettingsData();
      
      // Update maintenance settings
      if (settings.maintenance) {
        settingsData.maintenance = {
          ...settingsData.maintenance,
          ...settings.maintenance,
          lastUpdated: new Date().toISOString()
        };
      }
      
      // Save updated data
      await writeSettingsData(settingsData);
      
      return {
        success: true,
        message: 'Settings updated successfully',
        settings: settingsData
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update settings'
      });
    }
  } else {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    });
  }
});
