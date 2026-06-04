#!/usr/bin/env node
/**
 * Prints steps to enable Google Sign-In for this project.
 */
require('dotenv').config();

const projectId = process.env.FIREBASE_PROJECT_ID || 'your-firebase-project';
const hasClientId = Boolean(process.env.GOOGLE_CLIENT_ID);

console.log('\n=== Google Sign-In setup ===\n');
console.log(`Firebase project: ${projectId}\n`);

if (hasClientId) {
  console.log('✓ GOOGLE_CLIENT_ID is set in .env');
  console.log(`  ${process.env.GOOGLE_CLIENT_ID.slice(0, 20)}...\n`);
  console.log('Restart API + client if you just added it: npm run restart\n');
  process.exit(0);
}

console.log(`1. Enable Google: https://console.firebase.google.com/project/${projectId}/authentication/providers`);
console.log(`2. Credentials: https://console.cloud.google.com/apis/credentials?project=${projectId}`);
console.log('3. Create OAuth 2.0 Client ID → Web application (if none exists)');
console.log('4. Authorized JavaScript origins: http://localhost:5173 and http://127.0.0.1:5173');
console.log('5. Run: npm run google:set');
console.log('   (paste your Client ID when prompted)');
console.log('6. Restart: npm run restart\n');
