const { param, query } = require('express-validator');

const pincodeParamValidation = [
  param('pincode').matches(/^[0-9]{6}$/).withMessage('Pincode must be 6 digits'),
];

const reverseGeocodeValidation = [
  query('lat').isFloat({ min: -90, max: 90 }),
  query('lng').isFloat({ min: -180, max: 180 }),
];

module.exports = { pincodeParamValidation, reverseGeocodeValidation };
