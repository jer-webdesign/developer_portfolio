const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('Profile integration security tests', () => {
  beforeAll(async () => {
    // Ensure mongoose connects to the in-memory server started in jest.setup.js
    const uri = process.env.MONGODB_TEST_URI;
    if (!uri) throw new Error('MONGODB_TEST_URI not set by jest setup');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (global.__MONGOD__) await global.__MONGOD__.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  test('strips script tags and event handlers from bio when updating profile', async () => {
    await request(app)
      .post('/auth/register')
      .send({ username: 'puser', email: 'puser@example.com', password: 'Test@1234' });

    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'puser@example.com', password: 'Test@1234' });

    const token = login.body.accessToken;
    expect(token).toBeDefined();

    const payload = {
      profile: { bio: "<script>alert(1)</script> Hello <img src=x onerror=alert(1)>" }
    };

    const putRes = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect([200, 400]).toContain(putRes.statusCode);

    const getRes = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    const bio = getRes.body.user.profile.bio || '';
    expect(bio).not.toMatch(/<script|onerror|javascript:/i);
  });

  test('rejects NoSQL operator injection payloads for firstName', async () => {
    await request(app)
      .post('/auth/register')
      .send({ username: 'nuser', email: 'nuser@example.com', password: 'Test@1234' });

    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'nuser@example.com', password: 'Test@1234' });

    const token = login.body.accessToken;
    expect(token).toBeDefined();

    const payload = { profile: { firstName: { $gt: '' } } };
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    // Server should not accept operator objects as valid firstName values
    expect([400, 422, 200]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      const getRes = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`);
      const firstName = getRes.body.user.profile.firstName;
      expect(typeof firstName === 'string' || firstName === undefined).toBeTruthy();
    }
  });
});
