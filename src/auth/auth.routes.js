const express = require('express');
const authController = require('./auth.controller');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const {
  loginPinValidation,
  loginPasswordValidation,
  loginGoogleValidation,
  sendVerificationValidation,
  verifyEmailValidation,
  requestResetValidation,
  resetCredentialsValidation,
} = require('./auth.validators');

const router = express.Router();

router.get('/config', authController.getPublicConfig);
router.get('/me', authenticate, authController.getMe);
router.post('/login-pin', loginPinValidation, validate, authController.loginPin);
router.post('/login-password', loginPasswordValidation, validate, authController.loginPassword);
router.post('/login-google', loginGoogleValidation, validate, authController.loginGoogle);
router.post('/send-verification', sendVerificationValidation, validate, authController.sendVerification);
router.post('/verify-email', verifyEmailValidation, validate, authController.verifyEmail);
router.post('/request-reset', requestResetValidation, validate, authController.requestReset);
router.post('/reset-credentials', resetCredentialsValidation, validate, authController.resetCredentials);

module.exports = router;
