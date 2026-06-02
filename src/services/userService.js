const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const FirestoreService = require('./firestoreService');
const {
  COLLECTIONS,
  ROLES,
  USER_STATUS,
  BCRYPT_SALT_ROUNDS,
} = require('../config/constants');
const { generatePin, hashPin, createPinLookup } = require('../utils/pinGenerator');
const ApiError = require('../utils/ApiError');

class UserService extends FirestoreService {
  constructor() {
    super(COLLECTIONS.USERS);
  }

  async findByUid(uid) {
    return this.findById(uid);
  }

  async findByEmail(email) {
    return this.findOne('email', email.toLowerCase());
  }

  async findByUsername(username) {
    return this.findOne('username', username.toLowerCase());
  }

  async findByPinLookup(pinLookup) {
    return this.findOne('pinLookup', pinLookup);
  }

  async findByIdentifier(identifier) {
    const normalized = identifier.toLowerCase().trim();
    const byEmail = await this.findByEmail(normalized);
    if (byEmail) return byEmail;
    return this.findByUsername(normalized);
  }

  async findByGoogleId(googleId) {
    if (!googleId) return null;
    return this.findOne('googleId', googleId);
  }

  async linkGoogleAccount(uid, { googleId, googleEmail, fullName }) {
    const updates = { googleId, googleEmail };
    if (fullName) updates.googleDisplayName = fullName;
    return this.update(uid, updates);
  }

  async emailExists(email) {
    return !!(await this.findByEmail(email));
  }

  async usernameExists(username) {
    return !!(await this.findByUsername(username));
  }

  async createUser({ fullName, username, email, mobile, password, role }) {
    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();

    if (await this.emailExists(normalizedEmail)) {
      throw ApiError.conflict('Email is already registered');
    }

    if (await this.usernameExists(normalizedUsername)) {
      throw ApiError.conflict('Username is already taken');
    }

    const uid = uuidv4();
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    let plainPin;
    let pinLookup;
    do {
      plainPin = generatePin();
      pinLookup = createPinLookup(plainPin);
    } while (await this.findByPinLookup(pinLookup));

    const pinHash = await hashPin(plainPin);

    const userData = {
      uid,
      role,
      fullName,
      username: normalizedUsername,
      email: normalizedEmail,
      mobile,
      passwordHash,
      pinHash,
      pinLookup,
      isEmailVerified: false,
      status: USER_STATUS.PENDING_EMAIL,
    };

    const user = await this.create(userData, uid);
    return { user, plainPin };
  }

  async createBuyer(data) {
    return this.createUser({ ...data, role: ROLES.BUYER });
  }

  async createSeller(data) {
    return this.createUser({ ...data, role: ROLES.SELLER });
  }

  async createUserWithGoogle({
    fullName,
    username,
    email,
    mobile,
    role,
    googleId,
    googleEmail,
  }) {
    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();

    if (await this.emailExists(normalizedEmail)) {
      throw ApiError.conflict('Email is already registered. Sign in instead.');
    }

    if (await this.findByGoogleId(googleId)) {
      throw ApiError.conflict('This Google account is already registered. Sign in instead.');
    }

    if (await this.usernameExists(normalizedUsername)) {
      throw ApiError.conflict('Username is already taken');
    }

    const uid = uuidv4();
    const randomPassword = `${crypto.randomBytes(16).toString('base64url')}Aa1`;
    const passwordHash = await bcrypt.hash(randomPassword, BCRYPT_SALT_ROUNDS);

    let plainPin;
    let pinLookup;
    do {
      plainPin = generatePin();
      pinLookup = createPinLookup(plainPin);
    } while (await this.findByPinLookup(pinLookup));

    const pinHash = await hashPin(plainPin);

    const userData = {
      uid,
      role,
      fullName,
      username: normalizedUsername,
      email: normalizedEmail,
      mobile,
      passwordHash,
      pinHash,
      pinLookup,
      googleId,
      googleEmail: googleEmail || normalizedEmail,
      authProvider: 'google',
      isEmailVerified: true,
      status: USER_STATUS.ACTIVE,
    };

    const user = await this.create(userData, uid);
    return { user, plainPin };
  }

  async createBuyerWithGoogle(data) {
    return this.createUserWithGoogle({ ...data, role: ROLES.BUYER });
  }

  async createSellerWithGoogle(data) {
    return this.createUserWithGoogle({ ...data, role: ROLES.SELLER });
  }

  async verifyEmail(uid) {
    return this.update(uid, {
      isEmailVerified: true,
      status: USER_STATUS.ACTIVE,
    });
  }

  async blockUser(uid, reason = null) {
    return this.update(uid, {
      status: USER_STATUS.BLOCKED,
      blockReason: reason,
      blockedAt: new Date().toISOString(),
    });
  }

  async activateUser(uid) {
    const user = await this.findByUid(uid);
    if (!user) throw ApiError.notFound('User not found');
    if (user.role === ROLES.ADMIN) {
      throw ApiError.badRequest('Admin accounts cannot be modified this way');
    }
    return this.update(uid, {
      status: USER_STATUS.ACTIVE,
      blockReason: null,
      blockedAt: null,
    });
  }

  async getUsersByRole(role) {
    const users = await this.findMany({ role });
    return users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async getAllUsers() {
    const snapshot = await this.getCollection().get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async comparePassword(user, password) {
    return bcrypt.compare(password, user.passwordHash);
  }

  getPinHash(user) {
    return user.pinHash || user.pin;
  }

  async updatePassword(uid, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    return this.update(uid, { passwordHash });
  }

  async updatePin(uid, plainPin) {
    let pinLookup;
    let existing;
    do {
      pinLookup = createPinLookup(plainPin);
      existing = await this.findByPinLookup(pinLookup);
    } while (existing && existing.uid !== uid);

    const pinHash = await hashPin(plainPin);
    return this.update(uid, { pinHash, pinLookup });
  }

  async rotatePin(uid) {
    let plainPin;
    let pinLookup;
    let collision;
    do {
      plainPin = generatePin();
      pinLookup = createPinLookup(plainPin);
      collision = await this.findByPinLookup(pinLookup);
    } while (collision && collision.uid !== uid);

    await this.updatePin(uid, plainPin);
    return plainPin;
  }
}

module.exports = new UserService();
