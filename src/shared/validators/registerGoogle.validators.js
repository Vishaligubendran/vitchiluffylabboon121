const { body } = require('express-validator');
const { normalizeMobile } = require('./register.validators');

const registerGoogleValidation = [
  body('idToken').trim().notEmpty().withMessage('Google ID token is required'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3–30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username: letters, numbers, and underscore only'),
  body('mobile')
    .trim()
    .customSanitizer(normalizeMobile)
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile must be exactly 10 digits (e.g. 9876543210)'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be 2–100 characters'),
];

module.exports = { registerGoogleValidation };
