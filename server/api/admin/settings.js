import fs from 'fs';
import path from 'path';

// Get the absolute path to the project root directory
// In production, we need to go up from .output/server to the root
const projectRoot = process.cwd().includes('.output/server')
  ? path.join(process.cwd(), '../../')
  : process.cwd();
const settingsFilePath = path.join(projectRoot, 'server/data/settings.json');

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
      },
      seasons: {
        startYear: 2025,
        startMonth: 5,
        startDay: 15,
        lastUpdated: ""
      },
      discord: {
        inviteUrl: "https://discord.gg/JuxYYVEkzc",
        lastUpdated: ""
      },
      chatbot: {
        enabled: true,
        welcomeMessage: "Hi! I'm your TF2 Dodgeball Server assistant. I can help you with commands, donations, gameplay, and more!",
        lastUpdated: ""
      },
      donations: {
        paypalEnabled: true,
        revolutEnabled: true,
        buyMeACoffeeEnabled: true,
        lastUpdated: ""
      },
      cache: {
        serverStatusInterval: 30,
        leaderboardInterval: 10,
        playerSearchInterval: 10,
        seasonalLeaderboardInterval: 10,
        databaseStatusInterval: 5,
        lastUpdated: ""
      },
      heroStats: {
        uptime: "24/7",
        activePlayers: 1247,
        monthlyDonations: 17.5,
        monthlyGoal: 30,
        autoUpdateDonations: false,
        autoUpdatePlayers: false,
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

      // Update season settings
      if (settings.seasons) {
        settingsData.seasons = {
          ...settingsData.seasons,
          ...settings.seasons,
          lastUpdated: new Date().toISOString()
        };
      }

      // Update Discord settings
      if (settings.discord) {
        settingsData.discord = {
          ...settingsData.discord,
          ...settings.discord,
          lastUpdated: new Date().toISOString()
        };
      }

      // Update chatbot settings
      if (settings.chatbot) {
        settingsData.chatbot = {
          ...settingsData.chatbot,
          ...settings.chatbot,
          lastUpdated: new Date().toISOString()
        };
      }

      // Update donations settings
      if (settings.donations) {
        settingsData.donations = {
          ...settingsData.donations,
          ...settings.donations,
          lastUpdated: new Date().toISOString()
        };
      }

      // Update cache settings
      if (settings.cache) {
        settingsData.cache = {
          ...settingsData.cache,
          ...settings.cache,
          lastUpdated: new Date().toISOString()
        };
      }

      // Update hero statistics
      if (settings.heroStats) {
        settingsData.heroStats = {
          ...settingsData.heroStats,
          ...settings.heroStats,
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
