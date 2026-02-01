/**
 * Jest Test Setup
 * Configure mocks and global test utilities
 */

import { mockDb, resetDbMocks } from './mocks/db.mock';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32chars';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-32';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Mock uuid (ESM module that Jest can't transform)
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
}));

// Mock Kysely database
jest.mock('../config/kysely', () => ({
  db: mockDb,
  disconnectKysely: jest.fn().mockResolvedValue(undefined),
  testKyselyConnection: jest.fn().mockResolvedValue(true),
}));

// Mock Redis functions
jest.mock('../config/redis', () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(true),
  cacheDel: jest.fn().mockResolvedValue(true),
  cacheDelPattern: jest.fn().mockResolvedValue(true),
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

// Mock WebSocket emitters (no-op in tests)
jest.mock('../websocket/emitters/polls.emitter', () => ({
  emitPollCreated: jest.fn(),
  emitPollVoted: jest.fn(),
  emitPollClosed: jest.fn(),
  emitPollDeleted: jest.fn(),
}));

jest.mock('../websocket/emitters/expenses.emitter', () => ({
  emitExpenseCreated: jest.fn(),
  emitExpenseUpdated: jest.fn(),
  emitExpenseDeleted: jest.fn(),
  emitSplitUpdated: jest.fn(),
}));

jest.mock('../websocket/emitters/itinerary.emitter', () => ({
  emitItineraryItemCreated: jest.fn(),
  emitItineraryItemUpdated: jest.fn(),
  emitItineraryItemDeleted: jest.fn(),
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
  resetDbMocks();
});
