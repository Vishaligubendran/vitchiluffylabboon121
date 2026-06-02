const { OAuth2Client } = require('google-auth-library');
const { nodeEnv } = require('../config/env');
const ApiError = require('./ApiError');
const { resolveGoogleClientId } = require('./resolveGoogleClientId');

let tokenVerifier = null;

async function getClient() {
  const clientId = await resolveGoogleClientId();
  if (!clientId) {
    throw ApiError.internal('Google Sign-In is not configured on the server');
  }
  return { oauth: new OAuth2Client(clientId), clientId };
}

async function defaultVerify(idToken) {
  const { oauth, clientId } = await getClient();
  const ticket = await oauth.verifyIdToken({
    idToken,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw ApiError.unauthorized('Google account has no email');
  }
  return payload;
}

/**
 * Verify a Google ID token from the client Sign-In button.
 * In tests, use setGoogleTokenVerifier() to stub verification.
 */
async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw ApiError.badRequest('Google ID token is required');
  }
  const verify = tokenVerifier || defaultVerify;
  try {
    return await verify(idToken);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.unauthorized('Invalid or expired Google sign-in');
  }
}

function setGoogleTokenVerifier(fn) {
  if (nodeEnv !== 'test') return;
  tokenVerifier = fn;
}

function resetGoogleTokenVerifier() {
  tokenVerifier = null;
}

module.exports = {
  verifyGoogleIdToken,
  setGoogleTokenVerifier,
  resetGoogleTokenVerifier,
};
