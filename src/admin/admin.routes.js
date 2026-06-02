const express = require('express');
const adminController = require('./admin.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { blockUserValidation, rejectKycValidation } = require('./admin.validators');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/users', adminController.getUsers);
router.get('/sellers', adminController.getSellers);
router.get('/buyers', adminController.getBuyers);
router.get('/pending-kyc', adminController.getPendingKyc);
router.put('/approve-kyc/:sellerId', adminController.approveKyc);
router.put('/reject-kyc/:sellerId', rejectKycValidation, validate, adminController.rejectKyc);
router.put('/block-user/:userId', blockUserValidation, validate, adminController.blockUser);
router.put('/activate-user/:userId', adminController.activateUser);

module.exports = router;
