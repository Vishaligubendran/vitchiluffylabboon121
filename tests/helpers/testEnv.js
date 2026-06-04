process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-minimum-32-chars';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'test-project';
process.env.FIREBASE_CLIENT_EMAIL =
  process.env.FIREBASE_CLIENT_EMAIL || 'test@test.iam.gserviceaccount.com';
process.env.FIREBASE_PRIVATE_KEY =
  process.env.FIREBASE_PRIVATE_KEY ||
  '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----\n';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || 'test-google-client-id.apps.googleusercontent.com';
delete process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

// Tests use in-memory flow — do not hit real SMTP from developer .env
delete process.env.SMTP_HOST;
delete process.env.SMTP_USER;
delete process.env.SMTP_PASS;
delete process.env.RESEND_API_KEY;
delete process.env.EMAIL_DEV_ETHEREAL;

module.exports = {};
