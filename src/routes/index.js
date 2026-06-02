const express = require('express');
const authRoutes = require('../auth');
const buyer = require('../buyer');
const seller = require('../seller');
const adminRoutes = require('../admin');
const locationRoutes = require('../location');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: '247 Shop API is running',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/auth', buyer.authRoutes);
router.use('/auth', seller.authRoutes);
router.use('/buyer', buyer.routes);
router.use('/seller', seller.routes);
router.use('/admin', adminRoutes);
router.use('/location', locationRoutes);

module.exports = router;
