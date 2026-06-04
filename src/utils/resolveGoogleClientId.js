const { googleClientId: envClientId } = require('../config/env');
const {
  fetchGoogleClientIdFromFirebase,
  getCachedGoogleClientId,
  setCachedGoogleClientId,
} = require('./firebaseGoogleConfig');

async function resolveGoogleClientId() {
  if (process.env.GOOGLE_CLIENT_ID) return process.env.GOOGLE_CLIENT_ID;
  if (envClientId) return envClientId;
  if (getCachedGoogleClientId()) return getCachedGoogleClientId();

  const fromFirebase = await fetchGoogleClientIdFromFirebase();
  setCachedGoogleClientId(fromFirebase);
  process.env.GOOGLE_CLIENT_ID = fromFirebase;
  return fromFirebase;
}

module.exports = { resolveGoogleClientId };
