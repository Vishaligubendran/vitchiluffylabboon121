require('./helpers/testEnv');

const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const InMemoryFirestore = require('./helpers/inMemoryFirestore');

describe('HTTP routes', () => {
  let app;
  let memoryDb;

  before(() => {
    memoryDb = new InMemoryFirestore();
    const firebaseModule = require('../src/config/firebase');
    firebaseModule.getDb = () => memoryDb;

    app = require('../src/app');
  });

  test('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  test('POST /api/auth/register-buyer validates input', async () => {
    const res = await request(app)
      .post('/api/auth/register-buyer')
      .send({ username: 'ab', email: 'bad', password: 'weak' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(Array.isArray(res.body.errors));
  });

  test('POST /api/auth/register-buyer succeeds with valid payload', async () => {
    const res = await request(app)
      .post('/api/auth/register-buyer')
      .send({
        fullName: 'Test Buyer',
        username: 'testbuyer',
        email: 'testbuyer@example.com',
        mobile: '9876543210',
        password: 'SecurePass1',
        confirmPassword: 'SecurePass1',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.match(res.body.pin, /^\d{8}$/);
    assert.equal(res.body.user.role, 'buyer');
  });

  test('GET /api/admin/users requires authentication', async () => {
    const res = await request(app).get('/api/admin/users');
    assert.equal(res.status, 401);
  });

  test('GET /api/seller/kyc-status requires seller role', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register-buyer')
      .send({
        fullName: 'Role Buyer',
        username: 'rolebuyer',
        email: 'rolebuyer@example.com',
        mobile: '9876543211',
        password: 'SecurePass1',
        confirmPassword: 'SecurePass1',
      });

    const loginAttempt = await request(app)
      .get('/api/seller/kyc-status')
      .set('Authorization', `Bearer invalid-token`);

    assert.equal(loginAttempt.status, 401);

    const emailVerificationService = require('../src/services/emailVerificationService');
    const verifications = await emailVerificationService.findMany({});
    const buyerVerification = verifications.find((v) => v.email === 'rolebuyer@example.com');
    assert.ok(buyerVerification);

    await request(app)
      .post('/api/auth/verify-email')
      .send({ token: buyerVerification.token });

    const loginRes = await request(app)
      .post('/api/auth/login-pin')
      .send({ pin: registerRes.body.pin });

    assert.equal(loginRes.status, 200);

    const sellerRouteRes = await request(app)
      .get('/api/seller/kyc-status')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    assert.equal(sellerRouteRes.status, 403);
  });

  test('POST /api/auth/request-reset accepts email', async () => {
    const res = await request(app)
      .post('/api/auth/request-reset')
      .send({ email: 'nobody@example.com' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.message);
  });

  test('GET /api/location/pincode validates format', async () => {
    const res = await request(app).get('/api/location/pincode/12');
    assert.equal(res.status, 400);
  });

  test('unknown route returns 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    assert.equal(res.status, 404);
  });
});
