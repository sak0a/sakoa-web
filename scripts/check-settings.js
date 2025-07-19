#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Get the absolute path to the project root directory
// In production, we need to go up from .output/server to the root
const projectRoot = process.cwd().includes('.output/server')
  ? path.join(process.cwd(), '../../')
  : process.cwd();

const settingsFilePath = path.join(projectRoot, 'server/data/settings.json');

console.log('=== Settings File Debug ===');
console.log('Current working directory:', process.cwd());
console.log('Project root:', projectRoot);
console.log('Settings file path:', settingsFilePath);
console.log('Settings file exists:', fs.existsSync(settingsFilePath));

if (fs.existsSync(settingsFilePath)) {
  try {
    const data = fs.readFileSync(settingsFilePath, 'utf8');
    const settings = JSON.parse(data);
    console.log('Settings file content:');
    console.log(JSON.stringify(settings, null, 2));
    
    if (settings.donations) {
      console.log('\n=== Donation Settings ===');
      console.log('PayPal enabled:', settings.donations.paypalEnabled);
      console.log('Revolut enabled:', settings.donations.revolutEnabled);
      console.log('Buy Me a Coffee enabled:', settings.donations.buyMeACoffeeEnabled);
    } else {
      console.log('\n❌ No donations section found in settings!');
    }
  } catch (error) {
    console.error('❌ Error reading settings file:', error);
  }
} else {
  console.log('❌ Settings file does not exist!');
  console.log('Creating default settings file...');
  
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
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
    console.log('✅ Default settings file created successfully!');
  } catch (error) {
    console.error('❌ Error creating settings file:', error);
  }
}
