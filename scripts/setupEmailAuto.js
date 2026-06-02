#!/usr/bin/env node
/**
 * Auto-configure email in .env.
 * --dev     Create free Ethereal SMTP (preview links in API console; not real inbox)
 * --smtp    Apply SMTP from env vars: SMTP_USER, SMTP_PASS, SMTP_HOST, EMAIL_FROM
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const envPath = path.join(process.cwd(), '.env');
const mode = process.argv.includes('--smtp') ? 'smtp' : 'dev';

function upsertEnv(lines, updates) {
  const keys = new Set(Object.keys(updates));
  const out = [];
  const written = new Set();

  for (const line of lines) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=/);
    if (match && keys.has(match[1])) {
      out.push(`${match[1]}=${updates[match[1]]}`);
      written.add(match[1]);
    } else {
      out.push(line);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!written.has(key)) {
      out.push(`${value === '' ? key + '=' : `${key}=${value}`}`);
    }
  }

  return out;
}

function readEnvFile() {
  if (!fs.existsSync(envPath)) {
    console.error('Missing .env file');
    process.exit(1);
  }
  return fs.readFileSync(envPath, 'utf8').split('\n');
}

function writeEnv(lines) {
  fs.writeFileSync(envPath, lines.join('\n').replace(/\n*$/, '\n'));
}

async function setupDevEthereal() {
  console.log('Creating free Ethereal SMTP account (for development)...\n');
  const account = await nodemailer.createTestAccount();

  const updates = {
    EMAIL_PROVIDER: 'smtp',
    EMAIL_FROM: account.user,
    EMAIL_FROM_NAME: '247 Shop',
    SMTP_HOST: account.smtp.host,
    SMTP_PORT: String(account.smtp.port),
    SMTP_SECURE: 'false',
    SMTP_USER: account.user,
    SMTP_PASS: account.pass,
    EMAIL_DEV_ETHEREAL: 'true',
  };

  const lines = readEnvFile();
  const emailBlockStart = lines.findIndex((l) => l.includes('Email —'));
  if (emailBlockStart >= 0) {
    let end = emailBlockStart + 1;
    while (end < lines.length && !lines[end].startsWith('UPLOAD_DIR')) {
      end += 1;
    }
    const before = lines.slice(0, emailBlockStart);
    const after = lines.slice(end);
    const newBlock = [
      '# Email — auto-configured (Ethereal dev SMTP). For REAL inbox use: npm run email:configure',
      ...Object.entries(updates).map(([k, v]) => `${k}=${v}`),
    ];
    writeEnv([...before, ...newBlock, ...after]);
  } else {
    writeEnv(upsertEnv(lines, updates));
  }

  console.log('✓ Email configured in .env (Ethereal SMTP)\n');
  console.log('  SMTP_USER:', account.user);
  console.log('  Web inbox: https://ethereal.email/login');
  console.log('  Login with the SMTP_USER / SMTP_PASS above\n');
  console.log('After register, the API logs a preview URL for each email.');
  console.log('For Gmail/Outlook/Yahoo inbox, run: npm run email:configure\n');
}

function setupFromEnv() {
  const user = process.env.SMTP_USER;
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const from = process.env.EMAIL_FROM || user;

  if (!user || !pass) {
    console.error('Usage: SMTP_USER=... SMTP_PASS=... npm run email:configure');
    console.error('Optional: SMTP_HOST=smtp-relay.brevo.com EMAIL_FROM=...');
    process.exit(1);
  }

  const updates = {
    EMAIL_PROVIDER: 'smtp',
    EMAIL_FROM: from,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || '247 Shop',
    SMTP_HOST: host,
    SMTP_PORT: process.env.SMTP_PORT || '587',
    SMTP_SECURE: process.env.SMTP_SECURE || 'false',
    SMTP_USER: user,
    SMTP_PASS: pass,
    EMAIL_DEV_ETHEREAL: '',
  };

  const lines = readEnvFile();
  writeEnv(upsertEnv(lines, updates));
  console.log(`✓ SMTP configured (${host}) — emails go to real inboxes.\n`);
}

async function main() {
  if (mode === 'smtp') {
    setupFromEnv();
    return;
  }
  await setupDevEthereal();
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
