require('./helpers/testEnv');

const { test, describe, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const InMemoryFirestore = require('./helpers/inMemoryFirestore');
const { generatePin, hashPin, comparePin } = require('../src/utils/pinGenerator');
const { signToken, verifyToken } = require('../src/utils/jwt');
const sanitizeUser = require('../src/utils/sanitizeUser');
const ApiError = require('../src/utils/ApiError');
const { ROLES, USER_STATUS, KYC_STATUS, PIN_LENGTH } = require('../src/config/constants');

describe('Utilities', () => {
  test('generatePin returns an 8-digit string', () => {
    const pin = generatePin();
    assert.match(pin, new RegExp(`^\\d{${PIN_LENGTH}}$`));
  });

  test('hashPin and comparePin work together', async () => {
    const pin = '12345678';
    const hash = await hashPin(pin);
    assert.notEqual(pin, hash);
    assert.equal(await comparePin(pin, hash), true);
    assert.equal(await comparePin('000000', hash), false);
  });

  test('signToken and verifyToken round-trip', () => {
    const token = signToken({ uid: 'user-1', role: ROLES.BUYER });
    const decoded = verifyToken(token);
    assert.equal(decoded.uid, 'user-1');
    assert.equal(decoded.role, ROLES.BUYER);
  });

  test('sanitizeUser removes sensitive fields', () => {
    const safe = sanitizeUser({
      uid: '1',
      username: 'john',
      email: 'john@test.com',
      passwordHash: 'secret-hash',
      pin: 'pin-hash',
      role: ROLES.BUYER,
    });

    assert.equal(safe.passwordHash, undefined);
    assert.equal(safe.pin, undefined);
    assert.equal(safe.username, 'john');
  });

  test('ApiError factory methods set status codes', () => {
    assert.equal(ApiError.badRequest('bad').statusCode, 400);
    assert.equal(ApiError.unauthorized().statusCode, 401);
    assert.equal(ApiError.forbidden().statusCode, 403);
    assert.equal(ApiError.notFound().statusCode, 404);
    assert.equal(ApiError.conflict('dup').statusCode, 409);
  });
});

describe('Auth flow (in-memory Firestore)', () => {
  let memoryDb;
  let userService;
  let authService;
  let emailVerificationService;

  before(() => {
    memoryDb = new InMemoryFirestore();

    const firebaseModule = require('../src/config/firebase');
    firebaseModule.getDb = () => memoryDb;

    userService = require('../src/services/userService');
    authService = require('../src/services/authService');
    emailVerificationService = require('../src/services/emailVerificationService');
  });

  beforeEach(() => {
    memoryDb.reset();
  });

  const buyerPayload = {
    fullName: 'Test Buyer',
    username: 'buyer1',
    email: 'buyer1@test.com',
    mobile: '9876543210',
    password: 'SecurePass1',
  };

  test('registerBuyer creates user and returns PIN', async () => {
    const result = await authService.registerBuyer(buyerPayload);

    assert.equal(result.user.role, ROLES.BUYER);
    assert.equal(result.user.status, USER_STATUS.PENDING_EMAIL);
    assert.match(result.pin, new RegExp(`^\\d{${PIN_LENGTH}}$`));
    assert.equal(result.user.isEmailVerified, false);
  });

  test('registerBuyer rejects duplicate email', async () => {
    await authService.registerBuyer(buyerPayload);

    await assert.rejects(
      () =>
        authService.registerBuyer({
          ...buyerPayload,
          username: 'buyer2',
        }),
      (err) => err.statusCode === 409
    );
  });

  test('login blocked before email verification', async () => {
    const { pin } = await authService.registerBuyer(buyerPayload);

    await assert.rejects(
      () => authService.loginWithPin({ pin }),
      (err) => err.statusCode === 403
    );
  });

  test('full buyer flow: register → verify → login', async () => {
    const { pin } = await authService.registerBuyer(buyerPayload);

    const verifications = await emailVerificationService.findMany({});
    assert.ok(verifications.length >= 1);

    const verifyResult = await authService.verifyEmail(verifications[0].token);
    assert.equal(verifyResult.redirectTo, '/login?verified=1');

    const loginResult = await authService.loginWithPin({ pin });

    assert.ok(loginResult.token);
    assert.equal(loginResult.user.status, USER_STATUS.ACTIVE);
  });

  test('loginWithPassword works after verification', async () => {
    await authService.registerBuyer({
      fullName: 'Buyer Two',
      username: 'buyer2',
      email: 'buyer2@test.com',
      mobile: '9876543212',
      password: 'SecurePass1',
    });

    const verifications = await emailVerificationService.findMany({});
    await authService.verifyEmail(verifications[0].token);

    const loginResult = await authService.loginWithPassword({
      identifier: 'buyer2@test.com',
      password: 'SecurePass1',
    });

    assert.ok(loginResult.token);
    assert.equal(loginResult.user.email, 'buyer2@test.com');
  });

  test('registerSeller creates placeholder KYC record', async () => {
    const result = await authService.registerSeller({
      fullName: 'Jane Doe',
      username: 'seller1',
      email: 'seller1@test.com',
      mobile: '9876543213',
      password: 'SecurePass1',
    });

    assert.equal(result.user.role, ROLES.SELLER);
    assert.match(result.pin, new RegExp(`^\\d{${PIN_LENGTH}}$`));

    const kycService = require('../src/services/kycService');
    const kyc = await kycService.findBySellerId(result.user.uid);
    assert.equal(kyc.sellerId, result.user.uid);
    assert.equal(kyc.kycStatus, KYC_STATUS.PENDING);
    assert.equal(kyc.submittedAt, null);
  });

  test('credential reset rotates PIN and updates password', async () => {
    const { user } = await authService.registerBuyer({
      fullName: 'Reset User',
      username: 'resetuser',
      email: 'reset@test.com',
      mobile: '9876543299',
      password: 'SecurePass1',
    });

    const verifications = await emailVerificationService.findMany({});
    const v = verifications.find((x) => x.email === 'reset@test.com');
    await authService.verifyEmail(v.token);

    const credentialResetService = require('../src/services/credentialResetService');
    const token = await credentialResetService.createResetToken(user.uid, user.email);

    const resetResult = await authService.resetCredentials({
      token,
      password: 'NewSecure1',
    });

    assert.match(resetResult.pin, /^\d{8}$/);

    const loginResult = await authService.loginWithPassword({
      identifier: 'reset@test.com',
      password: 'NewSecure1',
    });
    assert.ok(loginResult.token);

    const pinLogin = await authService.loginWithPin({ pin: resetResult.pin });
    assert.ok(pinLogin.token);
  });

  test('loginWithGoogle signs in verified buyer by email', async () => {
    const googleAuth = require('../src/utils/googleAuth');
    googleAuth.setGoogleTokenVerifier(async () => ({
      sub: 'google-sub-123',
      email: buyerPayload.email,
      email_verified: true,
      name: buyerPayload.fullName,
    }));

    try {
      const { pin } = await authService.registerBuyer(buyerPayload);
      const verifications = await emailVerificationService.findMany({});
      await authService.verifyEmail(verifications[0].token);

      const loginResult = await authService.loginWithGoogle({
        idToken: 'fake-token-for-test',
      });

      assert.ok(loginResult.token);
      assert.equal(loginResult.user.email, buyerPayload.email);

      const pinLogin = await authService.loginWithPin({ pin });
      assert.ok(pinLogin.token);
    } finally {
      googleAuth.resetGoogleTokenVerifier();
    }
  });

  test('registerBuyerWithGoogle creates verified buyer', async () => {
    const googleAuth = require('../src/utils/googleAuth');
    googleAuth.setGoogleTokenVerifier(async () => ({
      sub: 'google-reg-buyer-1',
      email: 'googlebuyer@test.com',
      email_verified: true,
      name: 'Google Buyer',
    }));

    try {
      const result = await authService.registerBuyerWithGoogle({
        idToken: 'fake',
        username: 'googlebuyer',
        mobile: '9876543290',
      });

      assert.equal(result.user.role, ROLES.BUYER);
      assert.equal(result.user.isEmailVerified, true);
      assert.equal(result.registeredWithGoogle, true);
      assert.ok(result.token);
      assert.match(result.pin, /^\d{8}$/);

      const loginResult = await authService.loginWithGoogle({ idToken: 'fake' });
      assert.equal(loginResult.user.email, 'googlebuyer@test.com');
    } finally {
      googleAuth.resetGoogleTokenVerifier();
    }
  });

  test('registerSellerWithGoogle creates seller and KYC placeholder', async () => {
    const googleAuth = require('../src/utils/googleAuth');
    googleAuth.setGoogleTokenVerifier(async () => ({
      sub: 'google-reg-seller-1',
      email: 'googleseller@test.com',
      email_verified: true,
      name: 'Google Seller',
    }));

    try {
      const result = await authService.registerSellerWithGoogle({
        idToken: 'fake',
        username: 'googleseller',
        mobile: '9876543291',
      });

      assert.equal(result.user.role, ROLES.SELLER);
      const kycService = require('../src/services/kycService');
      const kyc = await kycService.findBySellerId(result.user.uid);
      assert.equal(kyc.sellerId, result.user.uid);
    } finally {
      googleAuth.resetGoogleTokenVerifier();
    }
  });

  test('loginWithGoogle rejects unknown email', async () => {
    const googleAuth = require('../src/utils/googleAuth');
    googleAuth.setGoogleTokenVerifier(async () => ({
      sub: 'google-unknown',
      email: 'nobody@test.com',
      email_verified: true,
    }));

    try {
      await assert.rejects(
        () => authService.loginWithGoogle({ idToken: 'fake' }),
        (err) => err.statusCode === 404
      );
    } finally {
      googleAuth.resetGoogleTokenVerifier();
    }
  });

  test('blockUser prevents login', async () => {
    const { pin, user } = await authService.registerBuyer({
      fullName: 'Blocked User',
      username: 'blocked',
      email: 'blocked@test.com',
      mobile: '9876543214',
      password: 'SecurePass1',
    });

    const verifications = await emailVerificationService.findMany({});
    await authService.verifyEmail(verifications[0].token);
    await userService.blockUser(user.uid, 'Policy violation');

    await assert.rejects(
      () => authService.loginWithPin({ pin }),
      (err) => err.statusCode === 403
    );
  });
});

describe('KYC service', () => {
  let memoryDb;
  let kycService;

  before(() => {
    memoryDb = new InMemoryFirestore();
    const firebaseModule = require('../src/config/firebase');
    firebaseModule.getDb = () => memoryDb;
    kycService = require('../src/services/kycService');
  });

  beforeEach(() => {
    memoryDb.reset();
  });

  test('getPendingKyc excludes records without uploaded documents', async () => {
    await kycService.create({
      sellerId: 'seller-1',
      businessName: 'Incomplete',
      kycStatus: KYC_STATUS.PENDING,
      submittedAt: null,
      documentUrls: {},
    });

    await kycService.submitKyc('seller-2', {
      businessName: 'Complete Shop',
      businessType: 'Supplier',
      shopName: 'Complete Shop',
      ownerName: 'Owner',
      email: 'shop@test.com',
      mobile: '9876543210',
      state: 'Tamil Nadu',
      pincode: '600001',
      area: 'Central',
      address: '123 Test Street, Chennai',
      gstin: '22AAAAA0000A1Z5',
      panNumber: 'ABCDE1234F',
      aadhaarNumber: '123456789012',
      documentUrls: {
        aadhaarImage: '/uploads/a.pdf',
        panImage: '/uploads/p.pdf',
        gstCertificate: '/uploads/g.pdf',
        addressProof: '/uploads/ad.pdf',
        ownerPhoto: '/uploads/o.pdf',
        shopPhoto: '/uploads/s.pdf',
      },
    });

    const pending = await kycService.getPendingKyc();
    assert.equal(pending.length, 1);
    assert.equal(pending[0].sellerId, 'seller-2');
  });

  test('approveKyc rejects when documents are missing', async () => {
    await kycService.create({
      sellerId: 'seller-1',
      businessName: 'No Docs',
      kycStatus: KYC_STATUS.PENDING,
      submittedAt: null,
      documentUrls: {},
    });

    await assert.rejects(
      () => kycService.approveKyc('seller-1', 'admin-1'),
      (err) => err.statusCode === 400
    );
  });
});
