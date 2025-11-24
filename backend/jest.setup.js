// Jest setup file - load test environment variables
require('dotenv').config({ path: '.env.test' });

// Keep a reasonable default timeout for longer integration tests
jest.setTimeout(30000);