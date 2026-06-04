require('dotenv').config();

const fs = require('fs');
const path = require('path');

function loadFirebaseFromEnvVars() {
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  };
}

function loadFirebaseFromServiceAccountFile(filePath) {
  const resolved = path.resolve(process.cwd(), filePath);
  const serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf8'));

  return {
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key,
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      serviceAccount.storage_bucket ||
      `${serviceAccount.project_id}.appspot.com`,
  };
}

function resolveFirebaseConfig() {
  const hasEnvCredentials =
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;

  if (hasEnvCredentials) {
    return loadFirebaseFromEnvVars();
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath && fs.existsSync(path.resolve(process.cwd(), serviceAccountPath))) {
    return loadFirebaseFromServiceAccountFile(serviceAccountPath);
  }

  throw new Error(
    'Firebase is not configured. Add to .env:\n' +
      '  FIREBASE_PROJECT_ID\n' +
      '  FIREBASE_CLIENT_EMAIL\n' +
      '  FIREBASE_PRIVATE_KEY\n' +
      '  FIREBASE_STORAGE_BUCKET (optional)'
  );
}

if (!process.env.JWT_SECRET) {
  throw new Error('Missing required environment variable: JWT_SECRET');
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  firebase: resolveFirebaseConfig(),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  emailFrom: process.env.EMAIL_FROM || 'noreply@247shop.com',
  email: {
    provider: process.env.EMAIL_PROVIDER || 'auto',
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.RESEND_FROM || '',
    fromName: process.env.EMAIL_FROM_NAME || '247 Shop',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY || '',
      from:
        process.env.RESEND_FROM ||
        (process.env.EMAIL_FROM
          ? `${process.env.EMAIL_FROM_NAME || '247 Shop'} <${process.env.EMAIL_FROM}>`
          : ''),
    },
  },
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5,
  },
};
