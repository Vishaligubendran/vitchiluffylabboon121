const { body } = require('express-validator');
const { baseRegisterValidation } = require('../shared/validators/register.validators');

const registerSellerValidation = [...baseRegisterValidation];

const submitKycValidation = [
  body('businessName').trim().isLength({ min: 2, max: 150 }),
  body('businessType').trim().notEmpty(),
  body('shopName').trim().isLength({ min: 2, max: 150 }),
  body('email').trim().isEmail(),
  body('mobile').trim().matches(/^[0-9]{10}$/),
  body('ownerName').trim().isLength({ min: 2, max: 100 }),
  body('state').trim().notEmpty(),
  body('pincode').trim().matches(/^[0-9]{6}$/),
  body('area').trim().notEmpty(),
  body('address').trim().isLength({ min: 10, max: 500 }),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('aadhaarNumber').trim().matches(/^[0-9]{12}$/),
  body('panNumber').trim().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
  body('gstin').trim().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
  body('is24x7').optional(),
];

module.exports = { registerSellerValidation, submitKycValidation };
