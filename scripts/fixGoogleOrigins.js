#!/usr/bin/env node
/**
 * Fix Google Error 400: origin_mismatch for local development.
 */
require('dotenv').config();

const projectId = process.env.FIREBASE_PROJECT_ID || 'stage-247shop-co-in';
const clientId = process.env.GOOGLE_CLIENT_ID || '';

const origins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

console.log('\n=== Fix Google origin_mismatch (Error 400) ===\n');
console.log('Your app runs at: http://localhost:5173');
console.log('Google must allow that exact origin on your OAuth Web client.\n');

if (clientId) {
  console.log(`Client ID in .env:\n  ${clientId}\n`);
}

const clientEditUrl = clientId
  ? `https://console.cloud.google.com/auth/clients/${clientId}?project=${projectId}`
  : `https://console.cloud.google.com/apis/credentials?project=${projectId}`;

console.log('Steps:\n');
console.log('1. Open your OAuth Web client (edit page):');
console.log(`   ${clientEditUrl}\n`);
console.log('   Or: Credentials list →');
console.log(`   https://console.cloud.google.com/apis/credentials?project=${projectId}\n`);
console.log('2. Find the Web client matching your Client ID above\n');
console.log('3. In "Authorized JavaScript origins", click + ADD URI and add EACH line:\n');
origins.forEach((o) => console.log(`     ${o}`));
console.log('\n4. Click SAVE');
console.log('5. Wait 1–5 minutes, then hard-refresh the browser (Cmd+Shift+R)\n');
console.log('6. Use exactly this URL (not another port):');
console.log('   http://localhost:5173/login\n');
console.log('Do NOT use http://localhost:5174 unless you add that origin too.\n');

console.log('Firebase Auth → Settings → Authorized domains should include "localhost"');
console.log(`   https://console.firebase.google.com/project/${projectId}/authentication/settings\n`);

console.log('--- After you click SAVE in Google Cloud ---');
console.log('• Wait 2–5 minutes');
console.log('• Restart: npm run client  (use http://localhost:5173)');
console.log('• Hard refresh browser: Cmd+Shift+R\n');

if (process.platform === 'darwin' && clientId) {
  console.log('Opening OAuth client page in your browser...\n');
  require('child_process').execSync(`open "${clientEditUrl}"`);
}
