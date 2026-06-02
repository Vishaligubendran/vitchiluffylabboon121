const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(req, _res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    const detail = formattedErrors.map((e) => `${e.field}: ${e.message}`).join(' · ');
    return next(ApiError.badRequest(detail || 'Validation failed', formattedErrors));
  }

  return next();
}

module.exports = validate;
