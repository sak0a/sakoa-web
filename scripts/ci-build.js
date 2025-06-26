#!/usr/bin/env node

/**
 * CI Build Script
 * Handles native binding issues during GitHub Actions deployment
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🚀 Starting CI build process...');

// Function to run command with error handling
function runCommand(command, description, continueOnError = false) {
  console.log(`\n📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    if (!continueOnError) {
      process.exit(1);
    }
    console.log(`⚠️ Continuing despite ${description} failure...`);
    return false;
  }
}

// Step 1: Handle npm optional dependency issues
console.log('\n🔧 Checking for npm optional dependency issues...');
if (!existsSync('node_modules') || !existsSync('package-lock.json')) {
  console.log('📦 Installing dependencies (handling optional dependency issues)...');
  runCommand('npm install', 'Install dependencies', false);
}

// Step 2: Try to prepare Nuxt (may fail due to native bindings)
console.log('\n🔧 Attempting Nuxt preparation...');
const prepareSuccess = runCommand('nuxt prepare', 'Nuxt prepare', true);

if (!prepareSuccess) {
  console.log('\n🔄 Nuxt prepare failed (likely due to native bindings), trying alternative approach...');

  // Try to install missing rollup bindings
  console.log('🔧 Attempting to install missing rollup bindings...');
  runCommand('npm install @rollup/rollup-linux-x64-gnu --save-optional', 'Install rollup bindings', true);

  // Retry nuxt prepare
  const retryPrepare = runCommand('nuxt prepare', 'Nuxt prepare (retry)', true);

  if (!retryPrepare) {
    // Create minimal .nuxt directory structure if it doesn't exist
    if (!existsSync('.nuxt')) {
      console.log('📁 Creating minimal .nuxt directory structure...');
      runCommand('mkdir -p .nuxt', 'Create .nuxt directory', false);
    }
  }
}

// Step 3: Run the build
console.log('\n🏗️ Building project...');
const buildSuccess = runCommand('nuxt build', 'Nuxt build', true);

if (!buildSuccess) {
  console.log('\n🔄 Standard build failed, trying with additional environment variables...');
  process.env.NITRO_PRESET = 'node-server';
  process.env.NUXT_TELEMETRY_DISABLED = '1';
  runCommand('nuxt build', 'Nuxt build (retry)', false);
}

// Step 4: Copy data files
console.log('\n📂 Copying data files...');
runCommand('node scripts/copy-data-files.js', 'Copy data files', false);

console.log('\n🎉 CI build process completed successfully!');
console.log('📦 Build output is ready in .output directory');
