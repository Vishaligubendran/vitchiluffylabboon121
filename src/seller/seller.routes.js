const express = require('express');
const sellerController = require('./seller.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { uploadKycDocuments } = require('../middleware/upload');
const handleMulterError = require('../middleware/multerErrorHandler');
const validate = require('../middleware/validate');
const { submitKycValidation } = require('./seller.validators');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.SELLER));

router.get('/profile', sellerController.getProfile);
router.post(
  '/upload-kyc',
  uploadKycDocuments,
  handleMulterError,
  submitKycValidation,
  validate,
  sellerController.uploadKyc
);
router.get('/kyc-status', sellerController.getKycStatus);

module.exports = router;
