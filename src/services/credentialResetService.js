const { v4: uuidv4 } = require('uuid');
const FirestoreService = require('./firestoreService');
const { COLLECTIONS, CREDENTIAL_RESET_EXPIRY_HOURS } = require('../config/constants');
const { clientUrl } = require('../config/env');
const ApiError = require('../utils/ApiError');

class CredentialResetService extends FirestoreService {
  constructor() {
    super(COLLECTIONS.CREDENTIAL_RESETS);
  }

  async createResetToken(userId, email) {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CREDENTIAL_RESET_EXPIRY_HOURS);

    await this.create({
      userId,
      email: email.toLowerCase(),
      token,
      expiresAt: expiresAt.toISOString(),
      used: false,
    });

    return token;
  }

  async verifyToken(token) {
    const record = await this.findOne('token', token);

    if (!record) {
      throw ApiError.badRequest('Invalid or expired reset link');
    }

    if (record.used) {
      throw ApiError.badRequest('Reset link has already been used');
    }

    if (new Date(record.expiresAt) < new Date()) {
      throw ApiError.badRequest('Reset link has expired');
    }

    await this.update(record.id, { used: true });

    return record;
  }

  getResetLink(token) {
    return `${clientUrl}/reset-credentials?token=${token}`;
  }
}

module.exports = new CredentialResetService();
