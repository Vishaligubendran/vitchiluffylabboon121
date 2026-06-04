#!/usr/bin/env node
/**
 * Add or update GOOGLE_CLIENT_ID in .env
 * Usage: node scripts/setGoogleClientId.js YOUR_CLIENT_ID.apps.googleusercontent.com
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(__dirname, '..', '.env');
const clientId = process.argv[2]?.trim();

function isValidClientId(id) {
  return /^[\w-]+\.apps\.googleusercontent\.com$/.test(id);
}

function updateEnv(id) {
  let content = fs.readFileSync(envPath, 'utf8');
  const line = `GOOGLE_CLIENT_ID=${id}`;

  if (/^GOOGLE_CLIENT_ID=.*$/m.test(content)) {
    content = content.replace(/^GOOGLE_CLIENT_ID=.*$/m, line);
  } else if (/^#\s*GOOGLE_CLIENT_ID=.*$/m.test(content)) {
    content = content.replace(/^#\s*GOOGLE_CLIENT_ID=.*$/m, line);
  } else {
    content = `${content.trimEnd()}\n\n${line}\n`;
  }

  fs.writeFileSync(envPath, content);
  console.log('\n✓ Updated .env with GOOGLE_CLIENT_ID');
  console.log('  Restart the API: npm run dev   (or npm run restart)\n');
}

function promptForId() {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'stage-247shop-co-in';
  console.log('\n=== Set Google OAuth Client ID ===\n');
  console.log('1. Firebase → Authentication → Sign-in method → Google → Enable');
  console.log(`   https://console.firebase.google.com/project/${projectId}/authentication/providers\n`);
  console.log('2. Google Cloud → Credentials → OAuth 2.0 Client IDs → Web client');
  console.log(`   https://console.cloud.google.com/apis/credentials?project=${projectId}\n`);
  console.log('   Add Authorized JavaScript origins:');
  console.log('     http://localhost:5173');
  console.log('     http://127.0.0.1:5173\n');
  console.log('3. Copy the Client ID (ends with .apps.googleusercontent.com)\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Paste Client ID here: ', (answer) => {
    rl.close();
    const id = answer.trim();
    if (!isValidClientId(id)) {
      console.error('\nInvalid format. Example: 123456789-abc.apps.googleusercontent.com\n');
      process.exit(1);
    }
    updateEnv(id);
  });
}

require('dotenv').config();

if (clientId) {
  if (!isValidClientId(clientId)) {
    console.error('Invalid Client ID. Must end with .apps.googleusercontent.com');
    process.exit(1);
  }
  updateEnv(clientId);
} else {
  promptForId();
}
