#!/usr/bin/env node
/**
 * Test email delivery to any inbox.
 * Usage: node scripts/testEmail.js recipient@example.com
 */
require('dotenv').config();
const emailService = require('../src/services/emailService');
const { clientUrl } = require('../src/config/env');

const to = process.argv[2];

async function main() {
  if (!to || !to.includes('@')) {
    console.error('Usage: npm run email:test -- recipient@example.com');
    process.exit(1);
  }

  if (!emailService.isEmailConfigured()) {
    console.error('\nEmail is not configured. Run: npm run email:setup\n');
    process.exit(1);
  }

  const provider = emailService.getActiveProvider();
  if (provider === 'smtp') {
    await emailService.verifySmtpConnection();
  }

  const link = `${clientUrl}/verify-email?token=test-token`;
  const result = await emailService.sendVerificationEmail(to, link);
  console.log(`\n✓ Test email sent to ${to} via ${result.mode}`);
  console.log('  Check inbox and spam folder.\n');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
