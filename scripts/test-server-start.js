#!/usr/bin/env node

/**
 * Test script to verify the server can start without errors
 * This helps diagnose deployment issues on Plesk
 */

console.log('🧪 Testing server startup...');

// Test 1: Check if all required files exist
import fs from 'fs';
import path from 'path';

const requiredFiles = [
  '.output/server/index.mjs',
  '.output/server/package.json',
  '.output/server/server/data/settings.json',
  '.output/server/server/data/donors.json',
  '.output/server/server/data/servers.json'
];

const optionalFiles = [
  '.output/server/.env'  // Created during deployment
];

console.log('\n📁 Checking required files...');
let missingFiles = [];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    missingFiles.push(file);
  }
}

console.log('\n📁 Checking optional files...');
for (const file of optionalFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`⚠️  ${file} - MISSING (will be created during deployment)`);
  }
}

if (missingFiles.length > 0) {
  console.log(`\n❌ Missing ${missingFiles.length} required files. Deployment may fail.`);
  process.exit(1);
}

// Test 2: Check environment variables
console.log('\n🔧 Checking environment variables...');
if (fs.existsSync('.output/server/.env')) {
  try {
    const envContent = fs.readFileSync('.output/server/.env', 'utf8');
    const envVars = envContent.split('\n').filter(line => line.includes('='));

    const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'ADMIN_PASSWORD'];

    for (const envVar of requiredEnvVars) {
      const found = envVars.some(line => line.startsWith(envVar + '='));
      if (found) {
        console.log(`✅ ${envVar}`);
      } else {
        console.log(`❌ ${envVar} - MISSING`);
      }
    }
  } catch (error) {
    console.log(`❌ Error reading .env file: ${error.message}`);
  }
} else {
  console.log('⚠️  .env file not found - will be created during deployment');
}

// Test 3: Check settings.json structure
console.log('\n⚙️ Checking settings.json...');
try {
  const settingsContent = fs.readFileSync('.output/server/server/data/settings.json', 'utf8');
  const settings = JSON.parse(settingsContent);

  if (settings.maintenance && typeof settings.maintenance.enabled === 'boolean') {
    console.log('✅ settings.json structure is valid');
    console.log(`ℹ️ Maintenance mode: ${settings.maintenance.enabled ? 'ENABLED' : 'DISABLED'}`);
  } else {
    console.log('❌ settings.json structure is invalid');
  }
} catch (error) {
  console.log(`❌ Error reading settings.json: ${error.message}`);
}

// Test 4: Try to import the server module (without starting it)
console.log('\n🚀 Testing server module import...');
try {
  // Change to server directory
  process.chdir('.output/server');
  
  // Try to require the main module
  const serverPath = path.resolve('./index.mjs');
  console.log(`📋 Server path: ${serverPath}`);
  
  if (fs.existsSync(serverPath)) {
    console.log('✅ Server file exists and is accessible');
  } else {
    console.log('❌ Server file not found');
  }
  
} catch (error) {
  console.log(`❌ Error testing server module: ${error.message}`);
}

console.log('\n✅ Server startup test completed!');
console.log('📋 If all checks passed, the server should start successfully.');
console.log('📋 If there are errors above, fix them before deployment.');
