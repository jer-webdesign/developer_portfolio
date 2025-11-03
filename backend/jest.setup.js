// Jest setup file
require('dotenv').config({ path: '.env.test' });

// Override MONGODB_URI for tests
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI;

// Set test timeout
jest.setTimeout(30000);