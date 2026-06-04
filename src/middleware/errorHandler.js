const ApiError = require('../utils/ApiError');
const { nodeEnv } = require('../config/env');

function notFoundHandler(_req, _res, next) {
  next(ApiError.notFound('Route not found'));
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  const response = {
    success: false,
    message,
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  if (nodeEnv === 'development' && statusCode === 500 && !err.isOperational) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
