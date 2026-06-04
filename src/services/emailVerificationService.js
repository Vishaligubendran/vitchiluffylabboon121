const { v4: uuidv4 } = require('uuid');
const FirestoreService = require('./firestoreService');
const { COLLECTIONS, EMAIL_VERIFICATION_EXPIRY_HOURS } = require('../config/constants');
const { clientUrl } = require('../config/env');
const ApiError = require('../utils/ApiError');

class EmailVerificationService extends FirestoreService {
  constructor() {
    super(COLLECTIONS.EMAIL_VERIFICATIONS);
  }

  async createVerificationToken(userId, email) {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFICATION_EXPIRY_HOURS);

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
    const verification = await this.findOne('token', token);

    if (!verification) {
      throw ApiError.badRequest('Invalid verification token');
    }

    if (verification.used) {
      throw ApiError.badRequest('Verification token has already been used');
    }

    if (new Date(verification.expiresAt) < new Date()) {
      throw ApiError.badRequest('Verification token has expired');
    }

    await this.update(verification.id, { used: true });

    return verification;
  }

  getVerificationLink(token) {
    return `${clientUrl}/verify-email?token=${token}`;
  }
}

module.exports = new EmailVerificationService();
