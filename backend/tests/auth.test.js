const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Authentication Tests', () => {
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

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test@1234'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject weak passwords', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'weak'
        });
      
      expect(res.status).toBe(400);
    });

    it('should reject duplicate emails', async () => {
      await request(app)
        .post('/auth/register')
        .send({
          username: 'user1',
          email: 'test@example.com',
          password: 'Test@1234'
        });

      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'user2',
          email: 'test@example.com',
          password: 'Test@5678'
        });
      
      expect(res.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test@1234'
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        });
      
      expect(res.status).toBe(401);
    });

    it('should lock account after 5 failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'WrongPassword'
          });
      }

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234'
        });
      
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('locked');
    });
  });

  describe('JWT Token Tests', () => {
    let accessToken;

    beforeEach(async () => {
      await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test@1234'
        });

      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234'
        });

      accessToken = loginRes.body.accessToken;
    });

    it('should access protected route with valid token', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid_token');
      
      expect(res.status).toBe(401);
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/profile');
      
      expect(res.status).toBe(401);
    });
  });
});