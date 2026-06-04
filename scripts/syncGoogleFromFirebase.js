#!/usr/bin/env node
/**
 * Pull Google OAuth Client ID from Firebase Auth and write to .env
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { initializeFirebase } = require('../src/config/firebase');
const { fetchGoogleClientIdFromFirebase } = require('../src/utils/firebaseGoogleConfig');

const envPath = path.join(__dirname, '..', '.env');

async function main() {
  initializeFirebase();
  const clientId = await fetchGoogleClientIdFromFirebase();

  let content = fs.readFileSync(envPath, 'utf8');
  const line = `GOOGLE_CLIENT_ID=${clientId}`;

  if (/^GOOGLE_CLIENT_ID=.*$/m.test(content)) {
    content = content.replace(/^GOOGLE_CLIENT_ID=.*$/m, line);
  } else if (/^#\s*GOOGLE_CLIENT_ID=.*$/m.test(content)) {
    content = content.replace(/^#\s*GOOGLE_CLIENT_ID=.*$/m, line);
  } else {
    content = `${content.trimEnd()}\n\n${line}\n`;
  }

  fs.writeFileSync(envPath, content);

  const clientEnvPath = path.join(__dirname, '..', 'client', '.env');
  let clientContent = fs.existsSync(clientEnvPath)
    ? fs.readFileSync(clientEnvPath, 'utf8')
    : 'VITE_API_URL=/api\n';
  const viteLine = `VITE_GOOGLE_CLIENT_ID=${clientId}`;
  if (/^VITE_GOOGLE_CLIENT_ID=.*$/m.test(clientContent)) {
    clientContent = clientContent.replace(/^VITE_GOOGLE_CLIENT_ID=.*$/m, viteLine);
  } else if (/^#\s*VITE_GOOGLE_CLIENT_ID=.*$/m.test(clientContent)) {
    clientContent = clientContent.replace(/^#\s*VITE_GOOGLE_CLIENT_ID=.*$/m, viteLine);
  } else {
    clientContent = `${clientContent.trimEnd()}\n${viteLine}\n`;
  }
  fs.writeFileSync(clientEnvPath, clientContent);

  console.log('\n✓ Synced Google Client ID from Firebase');
  console.log(`  GOOGLE_CLIENT_ID=${clientId}`);
  console.log('\nRestart servers: npm run restart\n');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  console.error('Enable Google in Firebase → Authentication → Sign-in method');
  process.exit(1);
});
