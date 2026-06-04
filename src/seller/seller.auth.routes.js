const express = require('express');
const sellerController = require('./seller.controller');
const validate = require('../middleware/validate');
const { registerSellerValidation } = require('./seller.validators');
const { registerGoogleValidation } = require('../shared/validators/registerGoogle.validators');

const router = express.Router();

router.post('/register-seller', registerSellerValidation, validate, sellerController.registerSeller);
router.post(
  '/register-seller-google',
  registerGoogleValidation,
  validate,
  sellerController.registerSellerGoogle
);

module.exports = router;
