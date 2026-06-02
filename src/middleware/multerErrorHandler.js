const ApiError = require('../utils/ApiError');

function handleMulterError(err, _req, _res, next) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return next(ApiError.badRequest('File size exceeds the allowed limit'));
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return next(ApiError.badRequest(`Unexpected file field: ${err.field}`));
  }

  if (err instanceof ApiError) {
    return next(err);
  }

  if (err.name === 'MulterError') {
    return next(ApiError.badRequest(err.message));
  }

  return next(err);
}

module.exports = handleMulterError;
