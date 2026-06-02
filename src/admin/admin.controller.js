const userService = require('../services/userService');
const kycService = require('../services/kycService');
const asyncHandler = require('../utils/asyncHandler');
const sanitizeUser = require('../utils/sanitizeUser');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');

const getUsers = asyncHandler(async (_req, res) => {
  const users = await userService.getAllUsers();
  res.status(200).json({
    success: true,
    count: users.length,
    users: users.map(sanitizeUser),
  });
});

const getSellers = asyncHandler(async (_req, res) => {
  const sellers = await userService.getUsersByRole(ROLES.SELLER);
  res.status(200).json({
    success: true,
    count: sellers.length,
    sellers: sellers.map(sanitizeUser),
  });
});

const getBuyers = asyncHandler(async (_req, res) => {
  const buyers = await userService.getUsersByRole(ROLES.BUYER);
  res.status(200).json({
    success: true,
    count: buyers.length,
    buyers: buyers.map(sanitizeUser),
  });
});

const getPendingKyc = asyncHandler(async (_req, res) => {
  const pendingKyc = await kycService.getPendingKyc();
  res.status(200).json({
    success: true,
    count: pendingKyc.length,
    pendingKyc,
  });
});

const approveKyc = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const adminId = req.user.uid;
  const seller = await userService.findByUid(sellerId);
  if (!seller) throw ApiError.notFound('Seller not found');
  if (seller.role !== ROLES.SELLER) throw ApiError.badRequest('User is not a seller');
  const kyc = await kycService.approveKyc(sellerId, adminId);
  res.status(200).json({ success: true, message: 'KYC approved successfully', kyc });
});

const rejectKyc = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const { reason } = req.body;
  const adminId = req.user.uid;
  const seller = await userService.findByUid(sellerId);
  if (!seller) throw ApiError.notFound('Seller not found');
  if (seller.role !== ROLES.SELLER) throw ApiError.badRequest('User is not a seller');
  const kyc = await kycService.rejectKyc(sellerId, adminId, reason);
  res.status(200).json({ success: true, message: 'KYC rejected', kyc });
});

const activateUser = asyncHandler(async (req, res) => {
  const user = await userService.activateUser(req.params.userId);
  res.status(200).json({
    success: true,
    message: 'User activated successfully',
    user: sanitizeUser(user),
  });
});

const blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;
  const adminId = req.user.uid;
  if (userId === adminId) throw ApiError.badRequest('You cannot block your own account');
  const user = await userService.findByUid(userId);
  if (!user) throw ApiError.notFound('User not found');
  if (user.role === ROLES.ADMIN) throw ApiError.badRequest('Admin accounts cannot be blocked');
  const blockedUser = await userService.blockUser(userId, reason);
  res.status(200).json({
    success: true,
    message: 'User blocked successfully',
    user: sanitizeUser(blockedUser),
  });
});

module.exports = {
  getUsers,
  getSellers,
  getBuyers,
  getPendingKyc,
  approveKyc,
  rejectKyc,
  blockUser,
  activateUser,
};
