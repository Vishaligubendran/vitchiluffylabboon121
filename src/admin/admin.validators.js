const { body } = require('express-validator');

const blockUserValidation = [
  body('reason').optional().trim().isLength({ max: 500 }),
];

const rejectKycValidation = [
  body('reason').trim().notEmpty().isLength({ max: 500 }),
];

module.exports = { blockUserValidation, rejectKycValidation };
