const locationService = require('../services/locationService');
const asyncHandler = require('../utils/asyncHandler');

const getPincode = asyncHandler(async (req, res) => {
  const result = await locationService.lookupPincode(req.params.pincode);
  res.status(200).json({ success: true, ...result });
});

const reverseGeocode = asyncHandler(async (req, res) => {
  const result = await locationService.reverseGeocode(req.query.lat, req.query.lng);
  res.status(200).json({ success: true, location: result });
});

module.exports = { getPincode, reverseGeocode };
