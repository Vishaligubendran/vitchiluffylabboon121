const fs = require('fs');
const path = require('path');
const app = require('./app');
const { port, nodeEnv, upload } = require('./config/env');
const { initializeFirebase } = require('./config/firebase');

const { resolveGoogleClientId } = require('./utils/resolveGoogleClientId');
const emailService = require('./services/emailService');

fs.mkdirSync(path.resolve(process.cwd(), upload.dir), { recursive: true });
initializeFirebase();

app.listen(port, async () => {
  console.log(`247 Shop API running on port ${port} [${nodeEnv}]`);
  try {
    const googleId = await resolveGoogleClientId();
    console.log('[OK] Google Sign-In configured (Firebase)');
    if (nodeEnv === 'development') {
      console.log(`     Client ID: ${googleId.slice(0, 24)}...`);
    }
  } catch (err) {
    console.warn(`[WARN] Google Sign-In: ${err.message}`);
    console.warn('       Enable Google in Firebase Auth or run: npm run google:sync');
  }

  if (emailService.isEmailConfigured()) {
    try {
      await emailService.verifyEmailConnection();
      const provider = emailService.getActiveProvider();
      console.log(
        `[OK] Email via ${provider} — verification links go to any inbox (Gmail, Outlook, Yahoo, etc.)`
      );
    } catch (err) {
      console.warn(`[WARN] Email connection failed: ${err.message}`);
      console.warn('       Run: npm run email:setup');
    }
  } else {
    console.warn('[WARN] Email not configured — links only on screen / API console');
    console.warn('       Run: npm run email:setup  (free Brevo or Resend — works with any email address)');
  }
});
