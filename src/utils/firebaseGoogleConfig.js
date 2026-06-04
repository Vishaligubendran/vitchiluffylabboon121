const { GoogleAuth } = require('google-auth-library');
const { firebase } = require('../config/env');

let cachedClientId = null;
let cachedProjectNumber = null;

async function getProjectNumber() {
  if (cachedProjectNumber) return cachedProjectNumber;

  const auth = new GoogleAuth({
    credentials: {
      client_email: firebase.clientEmail,
      private_key: firebase.privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const res = await client.request({
    url: `https://cloudresourcemanager.googleapis.com/v1/projects/${firebase.projectId}`,
  });
  cachedProjectNumber = res.data.projectNumber;
  return cachedProjectNumber;
}

/**
 * Load Google OAuth Web Client ID from Firebase Auth (after Google provider is enabled).
 */
async function fetchGoogleClientIdFromFirebase() {
  if (cachedClientId) return cachedClientId;

  const auth = new GoogleAuth({
    credentials: {
      client_email: firebase.clientEmail,
      private_key: firebase.privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const projectNumber = await getProjectNumber();

  const res = await client.request({
    url: `https://identitytoolkit.googleapis.com/v2/projects/${projectNumber}/defaultSupportedIdpConfigs/google.com`,
  });

  const clientId = res.data?.clientId;
  if (!clientId || !res.data?.enabled) {
    throw new Error('Google sign-in is not enabled in Firebase Authentication');
  }

  cachedClientId = clientId;
  return clientId;
}

function getCachedGoogleClientId() {
  return cachedClientId;
}

function setCachedGoogleClientId(id) {
  cachedClientId = id;
}

module.exports = {
  fetchGoogleClientIdFromFirebase,
  getCachedGoogleClientId,
  setCachedGoogleClientId,
};
