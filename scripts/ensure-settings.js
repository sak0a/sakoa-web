#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// This script ensures the settings.json file exists with proper defaults
// Run this after deployment to ensure settings are available

const settingsFilePath = path.join(process.cwd(), 'server/data/settings.json');

console.log('🔧 Ensuring settings file exists...');
console.log('Settings path:', settingsFilePath);

const defaultSettings = {
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
    enabled: false,
    welcomeMessage: "Hi! I'm your TF2 Dodgeball Server assistant. I can help you with commands, donations, gameplay, and more!",
    lastUpdated: ""
  },
  donations: {
    paypalEnabled: true,
    revolutEnabled: true,
    buyMeACoffeeEnabled: true,
    lastUpdated: ""
  }
};

try {
  // Ensure directory exists
  const dir = path.dirname(settingsFilePath);
  if (!fs.existsSync(dir)) {
    console.log('📁 Creating settings directory...');
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(settingsFilePath)) {
    console.log('✅ Settings file already exists');
    
    // Check if it has donations section
    const existingData = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
    if (!existingData.donations) {
      console.log('🔄 Adding missing donations section...');
      existingData.donations = defaultSettings.donations;
      fs.writeFileSync(settingsFilePath, JSON.stringify(existingData, null, 2));
      console.log('✅ Donations section added');
    } else {
      console.log('✅ Donations section exists');
    }
  } else {
    console.log('📝 Creating new settings file...');
    fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
    console.log('✅ Settings file created successfully');
  }
  
  console.log('🎉 Settings file is ready!');
} catch (error) {
  console.error('❌ Error ensuring settings file:', error);
  process.exit(1);
}
