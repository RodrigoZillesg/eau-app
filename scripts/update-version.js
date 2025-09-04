#!/usr/bin/env node

/**
 * Version Update Script
 * Run with: node scripts/update-version.js [major|minor|patch] "description"
 * Example: node scripts/update-version.js patch "Fixed login bug"
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const updateType = args[0] || 'patch'; // major, minor, or patch
const changeDescription = args[1] || 'Code updates';

// Path to version file
const versionFile = path.join(__dirname, '../eau-members/src/config/version.ts');

// Read current version file
let content = fs.readFileSync(versionFile, 'utf8');

// Extract current version numbers
const majorMatch = content.match(/major:\s*(\d+)/);
const minorMatch = content.match(/minor:\s*(\d+)/);
const patchMatch = content.match(/patch:\s*(\d+)/);

if (!majorMatch || !minorMatch || !patchMatch) {
  console.error('❌ Could not parse version file');
  process.exit(1);
}

let major = parseInt(majorMatch[1]);
let minor = parseInt(minorMatch[1]);
let patch = parseInt(patchMatch[1]);

// Increment version based on type
switch(updateType.toLowerCase()) {
  case 'major':
    major++;
    minor = 0;
    patch = 0;
    console.log(`📦 Major version bump: ${major}.${minor}.${patch}`);
    break;
  case 'minor':
    minor++;
    patch = 0;
    console.log(`✨ Minor version bump: ${major}.${minor}.${patch}`);
    break;
  case 'patch':
  default:
    patch++;
    console.log(`🐛 Patch version bump: ${major}.${minor}.${patch}`);
    break;
}

// Get current date and time
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');

const buildNumber = `${year}${month}${day}-${hours}${minutes}`;
const lastUpdate = `${year}-${month}-${day} ${hours}:${minutes}`;

// Update the content
content = content.replace(/major:\s*\d+/, `major: ${major}`);
content = content.replace(/minor:\s*\d+/, `minor: ${minor}`);
content = content.replace(/patch:\s*\d+/, `patch: ${patch}`);
content = content.replace(/build:\s*'[^']*'/, `build: '${buildNumber}'`);
content = content.replace(/lastUpdate:\s*'[^']*'/, `lastUpdate: '${lastUpdate}'`);
content = content.replace(/changes:\s*'[^']*'/, `changes: '${changeDescription}'`);

// Write updated content
fs.writeFileSync(versionFile, content);

console.log(`✅ Version updated successfully!`);
console.log(`   Version: ${major}.${minor}.${patch}`);
console.log(`   Build: ${buildNumber}`);
console.log(`   Changes: ${changeDescription}`);
console.log('');
console.log('📝 Next steps:');
console.log('   1. Build the project: npm run build');
console.log('   2. Commit changes: git add -A && git commit -m "Version ' + major + '.' + minor + '.' + patch + '"');
console.log('   3. Push to GitHub: git push');
console.log('   4. Deploy on EasyPanel');