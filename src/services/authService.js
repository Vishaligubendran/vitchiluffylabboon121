const userService = require('./userService');
const kycService = require('./kycService');
const emailVerificationService = require('./emailVerificationService');
const credentialResetService = require('./credentialResetService');
const emailService = require('./emailService');
const { comparePin, createPinLookup } = require('../utils/pinGenerator');
const { signToken } = require('../utils/jwt');
const sanitizeUser = require('../utils/sanitizeUser');
const ApiError = require('../utils/ApiError');
const { USER_STATUS, ROLES, PIN_LENGTH } = require('../config/constants');
const { nodeEnv } = require('../config/env');
const { verifyGoogleIdToken } = require('../utils/googleAuth');
const { resolveGoogleClientId } = require('../utils/resolveGoogleClientId');

function attachDevToken(payload, token, emailResult, key = 'verificationToken') {
  const emailDelivery = emailService.wasEmailSent(emailResult) ? 'sent' : 'console';

  if (emailDelivery === 'sent') {
    const out = {
      ...payload,
      emailDelivery: 'sent',
      message: `${payload.message} Check your email inbox (and spam folder).`,
    };
    if (emailResult?.previewUrl && (nodeEnv === 'development' || process.env.EMAIL_DEV_ETHEREAL === 'true')) {
      out.emailPreviewUrl = emailResult.previewUrl;
      out.message = `${payload.message} Open the email preview link below (dev mail).`;
    }
    return out;
  }

  if (token && (nodeEnv === 'development' || process.env.EMAIL_SHOW_DEV_LINK === 'true')) {
    return {
      ...payload,
      emailDelivery: 'console',
      [key]: token,
      message: `${payload.message} (SMTP not configured — use the link below or add SMTP to .env)`,
    };
  }

  return { ...payload, emailDelivery };
}

class AuthService {
  async registerBuyer({ fullName, username, email, mobile, password }) {
    const { user, plainPin } = await userService.createBuyer({
      fullName,
      username,
      email,
      mobile,
      password,
    });

    const token = await emailVerificationService.createVerificationToken(user.uid, user.email);
    const emailResult = await emailService.sendVerificationEmail(
      user.email,
      emailVerificationService.getVerificationLink(token)
    );

    return attachDevToken(
      {
        user: sanitizeUser(user),
        pin: plainPin,
        message: 'Buyer registered successfully. Please verify your email.',
      },
      token,
      emailResult
    );
  }

  async _assertGoogleConfigured() {
    const clientId = await resolveGoogleClientId();
    if (!clientId) {
      throw ApiError.badRequest(
        'Google Sign-In is not configured. Enable Google in Firebase Authentication or set GOOGLE_CLIENT_ID in .env.'
      );
    }
  }

  async registerBuyerWithGoogle({ idToken, username, mobile, fullName }) {
    return this.registerWithGoogle({
      idToken,
      role: ROLES.BUYER,
      username,
      mobile,
      fullName,
    });
  }

  async registerSellerWithGoogle({ idToken, username, mobile, fullName }) {
    return this.registerWithGoogle({
      idToken,
      role: ROLES.SELLER,
      username,
      mobile,
      fullName,
    });
  }

  async registerWithGoogle({ idToken, role, username, mobile, fullName }) {
    await this._assertGoogleConfigured();

    const payload = await verifyGoogleIdToken(idToken);
    const email = payload.email.toLowerCase();
    const googleId = payload.sub;

    if (!payload.email_verified) {
      throw ApiError.forbidden('Your Google email must be verified');
    }

    const existingByGoogle = await userService.findByGoogleId(googleId);
    if (existingByGoogle) {
      throw ApiError.conflict('This Google account is already registered. Please sign in.');
    }

    const existingByEmail = await userService.findByEmail(email);
    if (existingByEmail) {
      throw ApiError.conflict(
        'This email is already registered. Sign in with Google or your PIN/password.'
      );
    }

    const resolvedName =
      (fullName && fullName.trim()) ||
      payload.name ||
      email.split('@')[0];

    const createFn =
      role === ROLES.SELLER
        ? userService.createSellerWithGoogle.bind(userService)
        : userService.createBuyerWithGoogle.bind(userService);

    const { user, plainPin } = await createFn({
      fullName: resolvedName,
      username: username.toLowerCase(),
      email,
      mobile,
      googleId,
      googleEmail: email,
    });

    if (role === ROLES.SELLER) {
      await kycService.createPlaceholder(user.uid);
    }

    const message =
      role === ROLES.SELLER
        ? 'Seller account created with Google. Save your PIN, then sign in to complete KYC.'
        : 'Buyer account created with Google. Your email is already verified.';

    return {
      user: sanitizeUser(user),
      pin: plainPin,
      message,
      registeredWithGoogle: true,
      token: signToken({ uid: user.uid, role: user.role }),
      redirectTo: role === ROLES.SELLER ? '/seller/onboarding' : '/buyer',
    };
  }

  async registerSeller({ fullName, username, email, mobile, password }) {
    const { user, plainPin } = await userService.createSeller({
      fullName,
      username,
      email,
      mobile,
      password,
    });

    await kycService.createPlaceholder(user.uid);

    const token = await emailVerificationService.createVerificationToken(user.uid, user.email);
    const emailResult = await emailService.sendVerificationEmail(
      user.email,
      emailVerificationService.getVerificationLink(token)
    );

    return attachDevToken(
      {
        user: sanitizeUser(user),
        pin: plainPin,
        message: 'Seller registered. Verify email then complete KYC onboarding.',
        redirectTo: '/seller/onboarding',
      },
      token,
      emailResult
    );
  }

  async loginWithPin({ pin }) {
    const normalizedPin = String(pin).trim();
    if (!/^\d{8}$/.test(normalizedPin)) {
      throw ApiError.badRequest('PIN must be exactly 8 digits');
    }

    const pinLookup = createPinLookup(normalizedPin);
    const user = await userService.findByPinLookup(pinLookup);

    if (!user) throw ApiError.unauthorized('Invalid PIN');
    if (user.status === USER_STATUS.BLOCKED) {
      throw ApiError.forbidden('Your account has been blocked');
    }
    if (user.role !== ROLES.ADMIN && !user.isEmailVerified) {
      throw ApiError.forbidden('Please verify your email before logging in');
    }

    const pinHash = userService.getPinHash(user);
    if (!pinHash) throw ApiError.unauthorized('PIN not configured for this account');

    const isPinValid = await comparePin(normalizedPin, pinHash);
    if (!isPinValid) throw ApiError.unauthorized('Invalid PIN');

    return {
      token: signToken({ uid: user.uid, role: user.role }),
      user: sanitizeUser(user),
    };
  }

  async loginWithGoogle({ idToken }) {
    await this._assertGoogleConfigured();

    const payload = await verifyGoogleIdToken(idToken);
    const email = payload.email.toLowerCase();
    const googleId = payload.sub;

    if (!payload.email_verified) {
      throw ApiError.forbidden('Your Google email is not verified');
    }

    let user =
      (await userService.findByGoogleId(googleId)) ||
      (await userService.findByEmail(email));

    if (!user) {
      throw ApiError.notFound(
        'No account found for this Google email. Please register as Buyer or Seller first.'
      );
    }

    if (user.role === ROLES.ADMIN) {
      throw ApiError.forbidden('Admin accounts must sign in with PIN or password');
    }

    if (user.status === USER_STATUS.BLOCKED) {
      throw ApiError.forbidden('Your account has been blocked');
    }

    if (!user.isEmailVerified) {
      await userService.verifyEmail(user.uid);
      user = { ...user, isEmailVerified: true, status: USER_STATUS.ACTIVE };
    }

    if (!user.googleId) {
      await userService.linkGoogleAccount(user.uid, {
        googleId,
        googleEmail: email,
        fullName: payload.name,
      });
      user = { ...(await userService.findByUid(user.uid)) };
    }

    return {
      token: signToken({ uid: user.uid, role: user.role }),
      user: sanitizeUser(user),
    };
  }

  async loginWithPassword({ identifier, password }) {
    const user = await userService.findByIdentifier(identifier);
    if (!user) throw ApiError.unauthorized('Invalid credentials');
    if (user.status === USER_STATUS.BLOCKED) {
      throw ApiError.forbidden('Your account has been blocked');
    }
    if (user.role !== ROLES.ADMIN && !user.isEmailVerified) {
      throw ApiError.forbidden('Please verify your email before logging in');
    }
    if (!(await userService.comparePassword(user, password))) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    return {
      token: signToken({ uid: user.uid, role: user.role }),
      user: sanitizeUser(user),
    };
  }

  async sendVerificationEmail(email) {
    const user = await userService.findByEmail(email);
    if (!user) throw ApiError.notFound('No account found with this email');
    if (user.isEmailVerified) throw ApiError.badRequest('Email is already verified');

    const token = await emailVerificationService.createVerificationToken(user.uid, user.email);
    const emailResult = await emailService.sendVerificationEmail(
      user.email,
      emailVerificationService.getVerificationLink(token)
    );

    return attachDevToken({ message: 'Verification email sent successfully' }, token, emailResult);
  }

  async requestCredentialReset(email) {
    const user = await userService.findByEmail(email);

    if (!user) {
      return {
        message: 'If an account exists for this email, a reset link has been sent.',
      };
    }

    if (user.status === USER_STATUS.BLOCKED) {
      throw ApiError.forbidden('Your account has been blocked. Contact support.');
    }

    if (!user.isEmailVerified) {
      throw ApiError.badRequest('Please verify your email before resetting credentials');
    }

    const token = await credentialResetService.createResetToken(user.uid, user.email);
    const emailResult = await emailService.sendCredentialResetEmail(
      user.email,
      credentialResetService.getResetLink(token)
    );

    return attachDevToken(
      { message: 'If an account exists for this email, a reset link has been sent.' },
      token,
      emailResult,
      'resetToken'
    );
  }

  async resetCredentials({ token, password, pin }) {
    const reset = await credentialResetService.verifyToken(token);
    const user = await userService.findByUid(reset.userId);

    if (!user) throw ApiError.notFound('User not found');
    if (user.status === USER_STATUS.BLOCKED) {
      throw ApiError.forbidden('Your account has been blocked');
    }

    await userService.updatePassword(user.uid, password);

    let plainPin;
    if (pin) {
      if (!/^\d{8}$/.test(pin)) {
        throw ApiError.badRequest(`PIN must be exactly ${PIN_LENGTH} digits`);
      }
      await userService.updatePin(user.uid, pin);
      plainPin = pin;
    } else {
      plainPin = await userService.rotatePin(user.uid);
    }

    return {
      message: 'Password and PIN updated successfully. Save your new PIN — shown once.',
      pin: plainPin,
    };
  }

  async verifyEmail(token) {
    const verification = await emailVerificationService.verifyToken(token);
    const user = await userService.findByUid(verification.userId);
    if (!user) throw ApiError.notFound('User not found');

    if (user.isEmailVerified) {
      return {
        message: 'Email is already verified. Please login.',
        redirectTo: '/login',
        role: user.role,
      };
    }

    await userService.verifyEmail(user.uid);

    const redirectTo =
      user.role === ROLES.SELLER
        ? '/login?verified=seller'
        : '/login?verified=1';

    return {
      message:
        user.role === ROLES.SELLER
          ? 'Email verified. Please login with your PIN or password, then complete KYC.'
          : 'Email verified successfully. Please login.',
      redirectTo,
      role: user.role,
    };
  }

  async getProfile(uid) {
    const user = await userService.findByUid(uid);
    if (!user) throw ApiError.notFound('User not found');
    return sanitizeUser(user);
  }
}

module.exports = new AuthService();
