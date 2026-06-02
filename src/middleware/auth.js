const { verifyToken } = require('../utils/jwt');
const userService = require('../services/userService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { USER_STATUS } = require('../config/constants');

const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Access token is required');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await userService.findByUid(decoded.uid);

  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  if (user.status === USER_STATUS.BLOCKED) {
    throw ApiError.forbidden('Your account has been blocked');
  }

  req.user = user;
  next();
});

module.exports = authenticate;
