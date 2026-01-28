/**
 * Jest Test Setup
 * Configure mocks and global test utilities
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock uuid (ESM module that Jest can't transform)
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
}));

// Mock Redis functions
jest.mock('../config/redis', () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(true),
  cacheDel: jest.fn().mockResolvedValue(true),
  redisClient: {
    isReady: true,
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));

// Mock logger to avoid console output during tests
jest.mock('../common/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  logAuth: jest.fn(),
  logEvent: jest.fn(),
  logRequest: jest.fn(),
  logError: jest.fn(),
}));

// Global test utilities
beforeAll(() => {
  // Any global setup
});

afterAll(() => {
  // Any global teardown
});

// Clear all mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
