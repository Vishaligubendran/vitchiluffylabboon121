/**
 * Firebase connectivity diagnostic.
 * Usage: node scripts/checkFirebase.js
 */
require('dotenv').config();

const { initializeFirebase, getDb, getStorage } = require('../src/config/firebase');
const { firebase: firebaseConfig } = require('../src/config/env');
const { COLLECTIONS } = require('../src/config/constants');

async function checkFirebase() {
  const results = [];
  const ok = (msg) => results.push({ status: 'OK', msg });
  const fail = (msg, err) => results.push({ status: 'FAIL', msg, error: err?.message || String(err) });

  console.log('\n=== Firebase Connection Check ===\n');

  try {
    ok(`Project ID: ${firebaseConfig.projectId}`);
    ok(`Client email: ${firebaseConfig.clientEmail?.slice(0, 20)}...`);
    ok(`Private key loaded: ${firebaseConfig.privateKey?.includes('BEGIN PRIVATE KEY') ? 'yes' : 'no'}`);
    ok(`Storage bucket: ${firebaseConfig.storageBucket}`);
  } catch (err) {
    fail('Environment config', err);
    printResults(results);
    process.exit(1);
  }

  try {
    initializeFirebase();
    ok('Firebase Admin SDK initialized');
  } catch (err) {
    fail('Firebase Admin init', err);
    printResults(results);
    process.exit(1);
  }

  const db = getDb();

  try {
    const pingRef = db.collection('_health_check').doc('ping');
    await pingRef.set({
      checkedAt: new Date().toISOString(),
      source: 'checkFirebase.js',
    });
    const snap = await pingRef.get();
    if (snap.exists) {
      ok('Firestore write + read (health check document)');
      await pingRef.delete();
      ok('Firestore delete (cleanup)');
    } else {
      fail('Firestore read after write', new Error('Document missing'));
    }
  } catch (err) {
    fail('Firestore read/write', err);
    if (err.code === 5 || err.message?.includes('NOT_FOUND')) {
      results.push({
        status: 'HINT',
        msg: 'Enable Firestore in Firebase Console → Build → Firestore Database',
      });
    }
    if (err.message?.includes('PERMISSION_DENIED')) {
      results.push({
        status: 'HINT',
        msg: 'Check service account has Cloud Datastore User / Firebase Admin role',
      });
    }
  }

  for (const name of Object.values(COLLECTIONS)) {
    try {
      const snapshot = await db.collection(name).limit(1).get();
      const countSnap = await db.collection(name).count().get();
      const count = countSnap.data().count;
      ok(`Collection "${name}": accessible (${count} document(s))`);
    } catch (err) {
      if (err.message?.includes('count') || err.code === 'invalid-argument') {
        try {
          const snapshot = await db.collection(name).limit(5).get();
          ok(`Collection "${name}": accessible (${snapshot.size} sampled)`);
        } catch (inner) {
          fail(`Collection "${name}"`, inner);
        }
      } else {
        fail(`Collection "${name}"`, err);
      }
    }
  }

  try {
    const bucket = getStorage();
    const [exists] = await bucket.exists();
    if (exists) {
      ok(`Cloud Storage bucket "${bucket.name}" exists`);
    } else {
      results.push({
        status: 'WARN',
        msg: `Storage bucket "${bucket.name}" not found (KYC uses local uploads/ — OK for dev)`,
      });
    }
  } catch (err) {
    results.push({
      status: 'WARN',
      msg: `Storage check skipped: ${err.message} (local uploads still work)`,
    });
  }

  printResults(results);

  const failed = results.filter((r) => r.status === 'FAIL').length;
  process.exit(failed > 0 ? 1 : 0);
}

function printResults(results) {
  results.forEach((r) => {
    const icon = r.status === 'OK' ? '✓' : r.status === 'FAIL' ? '✗' : r.status === 'WARN' ? '!' : '→';
    console.log(`${icon} [${r.status}] ${r.msg}`);
    if (r.error) console.log(`    ${r.error}`);
  });
  console.log('');
  const failed = results.filter((r) => r.status === 'FAIL').length;
  if (failed === 0) {
    console.log('Firebase is connected and Firestore is working.\n');
  } else {
    console.log(`${failed} check(s) failed. Fix the issues above.\n`);
  }
}

checkFirebase().catch((err) => {
  console.error('Diagnostic crashed:', err.message);
  process.exit(1);
});
