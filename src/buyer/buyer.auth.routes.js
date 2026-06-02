const express = require('express');
const buyerController = require('./buyer.controller');
const validate = require('../middleware/validate');
const { registerBuyerValidation } = require('./buyer.validators');
const { registerGoogleValidation } = require('../shared/validators/registerGoogle.validators');

const router = express.Router();

router.post('/register-buyer', registerBuyerValidation, validate, buyerController.registerBuyer);
router.post(
  '/register-buyer-google',
  registerGoogleValidation,
  validate,
  buyerController.registerBuyerGoogle
);

module.exports = router;
