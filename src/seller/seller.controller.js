const authService = require('../services/authService');
const kycService = require('../services/kycService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { kycFields } = require('../middleware/upload');

const buildDocumentUrls = (files) => {
  const urls = {};
  kycFields.forEach(({ name }) => {
    if (files?.[name]?.[0]) {
      urls[name] = `/uploads/${files[name][0].filename}`;
    }
  });
  return urls;
};

const registerSeller = asyncHandler(async (req, res) => {
  const { fullName, username, email, mobile, password } = req.body;
  const result = await authService.registerSeller({
    fullName,
    username,
    email,
    mobile,
    password,
  });
  res.status(201).json({ success: true, ...result });
});

const uploadKyc = asyncHandler(async (req, res) => {
  const sellerId = req.user.uid;
  const documentUrls = buildDocumentUrls(req.files);

  const required = [
    'aadhaarImage',
    'panImage',
    'gstCertificate',
    'addressProof',
    'ownerPhoto',
    'shopPhoto',
  ];
  const missing = required.filter((f) => !documentUrls[f]);
  if (missing.length) {
    throw ApiError.badRequest(`Missing documents: ${missing.join(', ')}`);
  }

  const kyc = await kycService.submitKyc(sellerId, {
    ...req.body,
    documentUrls,
  });

  res.status(200).json({
    success: true,
    message: 'KYC submitted successfully. Awaiting admin approval.',
    kyc: {
      sellerId: kyc.sellerId,
      shopName: kyc.shopName,
      kycStatus: kyc.kycStatus,
      submittedAt: kyc.submittedAt,
    },
  });
});

const getKycStatus = asyncHandler(async (req, res) => {
  const kyc = await kycService.getKycStatus(req.user.uid);
  res.status(200).json({
    success: true,
    kyc: {
      ...kyc,
      aadhaarNumber: kyc.aadhaarNumber
        ? `XXXX-XXXX-${kyc.aadhaarNumber.slice(-4)}`
        : null,
    },
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.uid);
  res.status(200).json({ success: true, user });
});

const registerSellerGoogle = asyncHandler(async (req, res) => {
  const { idToken, username, mobile, fullName } = req.body;
  const result = await authService.registerSellerWithGoogle({
    idToken,
    username,
    mobile,
    fullName,
  });
  res.status(201).json({ success: true, ...result });
});

module.exports = {
  registerSeller,
  registerSellerGoogle,
  uploadKyc,
  getKycStatus,
  getProfile,
};
