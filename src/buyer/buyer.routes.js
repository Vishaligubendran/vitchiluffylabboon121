const express = require('express');
const buyerController = require('./buyer.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.BUYER));

router.get('/profile', buyerController.getProfile);

module.exports = router;
