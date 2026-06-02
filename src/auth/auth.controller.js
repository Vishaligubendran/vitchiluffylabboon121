const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { resolveGoogleClientId } = require('../utils/resolveGoogleClientId');
const { firebase } = require('../config/env');

const getPublicConfig = asyncHandler(async (_req, res) => {
  let googleClientId = '';
  try {
    googleClientId = await resolveGoogleClientId();
  } catch {
    googleClientId = process.env.GOOGLE_CLIENT_ID || '';
  }

  res.status(200).json({
    success: true,
    googleClientId,
    googleSignInEnabled: Boolean(googleClientId),
    firebaseAuthDomain: `${firebase.projectId}.firebaseapp.com`,
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.uid);
  res.status(200).json({ success: true, user });
});

const loginPin = asyncHandler(async (req, res) => {
  const result = await authService.loginWithPin({ pin: req.body.pin });
  res.status(200).json({ success: true, ...result });
});

const loginPassword = asyncHandler(async (req, res) => {
  const result = await authService.loginWithPassword({
    identifier: req.body.identifier,
    password: req.body.password,
  });
  res.status(200).json({ success: true, ...result });
});

const loginGoogle = asyncHandler(async (req, res) => {
  const result = await authService.loginWithGoogle({ idToken: req.body.idToken });
  res.status(200).json({ success: true, ...result });
});

const sendVerification = asyncHandler(async (req, res) => {
  const result = await authService.sendVerificationEmail(req.body.email);
  res.status(200).json({ success: true, ...result });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.body.token);
  res.status(200).json({ success: true, ...result });
});

const requestReset = asyncHandler(async (req, res) => {
  const result = await authService.requestCredentialReset(req.body.email);
  res.status(200).json({ success: true, ...result });
});

const resetCredentials = asyncHandler(async (req, res) => {
  const result = await authService.resetCredentials({
    token: req.body.token,
    password: req.body.password,
    pin: req.body.pin,
  });
  res.status(200).json({ success: true, ...result });
});

module.exports = {
  getPublicConfig,
  getMe,
  loginPin,
  loginPassword,
  loginGoogle,
  sendVerification,
  verifyEmail,
  requestReset,
  resetCredentials,
};
