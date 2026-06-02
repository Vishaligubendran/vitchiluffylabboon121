const express = require('express');
const locationController = require('./location.controller');
const validate = require('../middleware/validate');
const { pincodeParamValidation, reverseGeocodeValidation } = require('./location.validators');

const router = express.Router();

router.get(
  '/pincode/:pincode',
  pincodeParamValidation,
  validate,
  locationController.getPincode
);

router.get(
  '/reverse',
  reverseGeocodeValidation,
  validate,
  locationController.reverseGeocode
);

module.exports = router;
