#!/usr/bin/env node
/**
 * Verify Gmail SMTP credentials in .env
 */
require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.error('Missing SMTP_USER or SMTP_PASS in .env');
    process.exit(1);
  }

  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass: pass.replace(/\s+/g, '') },
  });

  try {
    await transport.verify();
    console.log(`\n✓ Gmail SMTP OK for ${user}\n`);
    console.log('Run: npm run email:test -- your@email.com\n');
  } catch (err) {
    console.error(`\n✗ Gmail login failed for ${user}\n`);
    console.error(err.message.split('\n')[0]);
    console.error(`
Fix:
1. Use the SAME Gmail as SMTP_USER (the account that created the app password)
2. Google Account → Security → 2-Step Verification ON
3. App passwords → create new "Mail" password (16 letters, no spaces in .env)
4. Update SMTP_PASS in .env and run: node scripts/verifyGmail.js
`);
    process.exit(1);
  }
}

main();
