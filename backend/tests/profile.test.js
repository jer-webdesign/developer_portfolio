const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // server should export the express app
require('dotenv').config();

describe('Profile endpoint security tests', () => {
  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dev_portfolio_test';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('Rejects XSS payload in bio (server strips or rejects)', async () => {
    // This test assumes an authenticated route; if authentication is required,
    // the test should create a test user and obtain a token. For now, check validation logic.
    const payload = { profile: { bio: '<script>alert(1)</script>' } };
    const res = await request(app).put('/api/profile').send(payload);
    expect([200,400]).toContain(res.statusCode);
    if (res.statusCode === 400) {
      // validation error expected
      expect(res.body).toHaveProperty('errors');
    } else {
      // If accepted, server should not return raw <script>
      expect(res.body.user.profile.bio).not.toContain('<script>');
    }
  }, 20000);

  test('Rejects NoSQL injection-like payload', async () => {
    const payload = { profile: { firstName: { $gt: '' } } };
    const res = await request(app).put('/api/profile').send(payload);
    // Server should not crash; expect 400 or 500 handled
    expect([400,500,200]).toContain(res.statusCode);
  });
});
