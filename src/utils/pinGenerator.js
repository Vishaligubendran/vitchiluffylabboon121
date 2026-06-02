const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { PIN_LENGTH, BCRYPT_SALT_ROUNDS } = require('../config/constants');
const { jwt: jwtConfig } = require('../config/env');

function generatePin() {
  const min = Math.pow(10, PIN_LENGTH - 1);
  const max = Math.pow(10, PIN_LENGTH) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

async function hashPin(pin) {
  return bcrypt.hash(pin, BCRYPT_SALT_ROUNDS);
}

async function comparePin(pin, pinHash) {
  return bcrypt.compare(pin, pinHash);
}

function createPinLookup(pin) {
  return crypto
    .createHmac('sha256', jwtConfig.secret)
    .update(pin)
    .digest('hex');
}

module.exports = {
  generatePin,
  hashPin,
  comparePin,
  createPinLookup,
};
