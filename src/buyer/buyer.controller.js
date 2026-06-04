const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

const registerBuyer = asyncHandler(async (req, res) => {
  const { fullName, username, email, mobile, password } = req.body;
  const result = await authService.registerBuyer({
    fullName,
    username,
    email,
    mobile,
    password,
  });
  res.status(201).json({ success: true, ...result });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.uid);
  res.status(200).json({ success: true, user });
});

const registerBuyerGoogle = asyncHandler(async (req, res) => {
  const { idToken, username, mobile, fullName } = req.body;
  const result = await authService.registerBuyerWithGoogle({
    idToken,
    username,
    mobile,
    fullName,
  });
  res.status(201).json({ success: true, ...result });
});

module.exports = { registerBuyer, registerBuyerGoogle, getProfile };
