const { body } = require('express-validator');
const { PIN_LENGTH } = require('../config/constants');

const loginPinValidation = [
  body('pin')
    .trim()
    .isLength({ min: PIN_LENGTH, max: PIN_LENGTH })
    .withMessage(`PIN must be exactly ${PIN_LENGTH} digits`)
    .isNumeric(),
];

const loginPasswordValidation = [
  body('identifier').trim().notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty(),
];

const loginGoogleValidation = [
  body('idToken').trim().notEmpty().withMessage('Google ID token is required'),
];

const sendVerificationValidation = [
  body('email').trim().isEmail().normalizeEmail(),
];

const verifyEmailValidation = [body('token').trim().notEmpty()];

const requestResetValidation = [
  body('email').trim().isEmail().normalizeEmail(),
];

const resetCredentialsValidation = [
  body('token').trim().notEmpty(),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password: 8+ chars with upper, lower, number'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
  body('pin')
    .optional()
    .trim()
    .isLength({ min: PIN_LENGTH, max: PIN_LENGTH })
    .isNumeric()
    .withMessage(`Custom PIN must be exactly ${PIN_LENGTH} digits`),
];

module.exports = {
  loginPinValidation,
  loginPasswordValidation,
  loginGoogleValidation,
  sendVerificationValidation,
  verifyEmailValidation,
  requestResetValidation,
  resetCredentialsValidation,
};
