const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

function signToken(payload) {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });
}

function verifyToken(token) {
  return jwt.verify(token, jwtConfig.secret);
}

module.exports = {
  signToken,
  verifyToken,
};
