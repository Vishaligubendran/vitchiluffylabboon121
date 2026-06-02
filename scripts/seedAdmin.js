/**
 * Seed script to create the initial admin user.
 * Usage:
 *   node scripts/seedAdmin.js              — create admin if missing
 *   node scripts/seedAdmin.js --rotate-pin — new 8-digit PIN for existing admin
 *
 * Optional env: ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD
 */
require('dotenv').config();

const { initializeFirebase } = require('../src/config/firebase');
const userService = require('../src/services/userService');
const { ROLES, USER_STATUS } = require('../src/config/constants');
const { generatePin, hashPin, createPinLookup } = require('../src/utils/pinGenerator');

const rotatePin = process.argv.includes('--rotate-pin');

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const email = process.env.ADMIN_EMAIL || 'admin@247shop.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';

  initializeFirebase();

  const existing = await userService.findByEmail(email);

  if (existing) {
    if (rotatePin) {
      await userService.update(existing.uid, {
        isEmailVerified: true,
        status: USER_STATUS.ACTIVE,
      });
      const plainPin = await userService.rotatePin(existing.uid);
      console.log('Admin PIN rotated successfully');
      console.log('Email:', email);
      console.log('Username:', existing.username || username);
      console.log('PIN (save securely, shown once):', plainPin);
      console.log('Password login: username admin + Admin@123456 (or ADMIN_PASSWORD in .env)');
      process.exit(0);
    }

    if (!existing.pinLookup) {
      const plainPin = generatePin();
      const pinHash = await hashPin(plainPin);
      await userService.update(existing.uid, {
        pinHash,
        pinLookup: createPinLookup(plainPin),
      });
      console.log('Admin PIN updated (pinLookup added):', plainPin);
    } else {
      console.log('Admin user already exists:', email);
      console.log('Login: username "admin" + password Admin@123456 (or ADMIN_PASSWORD in .env).');
      console.log('New PIN: npm run seed:admin:rotate');
    }
    process.exit(0);
  }

  const { user, plainPin } = await userService.createUser({
    fullName: 'System Admin',
    username,
    email,
    mobile: '9999999999',
    password,
    role: ROLES.ADMIN,
  });

  await userService.update(user.uid, {
    isEmailVerified: true,
    status: USER_STATUS.ACTIVE,
  });

  console.log('Admin user created successfully');
  console.log('Email:', email);
  console.log('Username:', username);
  console.log('PIN (save securely):', plainPin);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Failed to seed admin:', err.message);
  process.exit(1);
});
