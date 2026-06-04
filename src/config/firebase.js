const admin = require('firebase-admin');
const { firebase: firebaseConfig } = require('./env');

let db = null;
let storage = null;

function initializeFirebase() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebaseConfig.projectId,
        clientEmail: firebaseConfig.clientEmail,
        privateKey: firebaseConfig.privateKey,
      }),
      storageBucket: firebaseConfig.storageBucket,
    });
  }

  db = admin.firestore();
  storage = admin.storage().bucket();

  return { db, storage, admin };
}

function getDb() {
  if (!db) {
    initializeFirebase();
  }
  return db;
}

function getStorage() {
  if (!storage) {
    initializeFirebase();
  }
  return storage;
}

module.exports = {
  initializeFirebase,
  getDb,
  getStorage,
  admin,
};
