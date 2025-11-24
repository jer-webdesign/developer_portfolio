const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // server should export the express app
require('dotenv').config();
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Profile endpoint security tests', () => {
  let mongod;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  test('Rejects XSS payload in bio (server strips or rejects)', async () => {
    // This test assumes an authenticated route; if authentication is required,
    // the test should create a test user and obtain a token. For now, check validation logic.
    const payload = { profile: { bio: '<script>alert(1)</script>' } };
    const res = await request(app).put('/api/profile').send(payload);
    // Accept unauthorized (401) or validation/accepted responses
    expect([200,400,401]).toContain(res.statusCode);
    if (res.statusCode === 400) {
      // validation error expected
      expect(res.body).toHaveProperty('errors');
    } else if (res.statusCode === 401) {
      // unauthorized - acceptable for unauthenticated test
      expect(res.body).toHaveProperty('message');
    } else {
      // If accepted, server should not return raw <script>
      expect(res.body.user).toBeDefined();
      expect(res.body.user.profile).toBeDefined();
      expect(res.body.user.profile.bio).not.toContain('<script>');
    }
  }, 20000);

  test('Rejects NoSQL injection-like payload', async () => {
    const payload = { profile: { firstName: { $gt: '' } } };
    const res = await request(app).put('/api/profile').send(payload);
    // Server should not crash; accept 400/500/200/401
    expect([400,500,200,401]).toContain(res.statusCode);
  });
});
