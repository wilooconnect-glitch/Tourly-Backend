// Jest setup file
const dotenv = require('dotenv');

// Load environment variables for tests
dotenv.config({ path: 'test.env' });

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test timeout
jest.setTimeout(10000); 