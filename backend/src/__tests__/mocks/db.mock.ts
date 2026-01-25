/**
 * Database Mock Utilities
 * Provides mock database responses for testing
 */

import type { User } from '../../config/database.types';

// Sample test user data
export const mockUser: Omit<User, 'passwordHash'> & { passwordHash?: string } = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  timezone: 'UTC',
  bio: null,
  interests: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  lastLoginAt: null,
  emailVerifiedAt: null,
};

export const mockUserWithPassword = {
  ...mockUser,
  // This is a bcrypt hash of 'TestPassword123!'
  passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2rIAKcJYxS',
};

// Mock session data
export const mockSession = {
  id: 'test-session-id-123',
  userId: mockUser.id,
  token: 'mock-refresh-token',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  lastUsedAt: new Date(),
  ipAddress: null,
  userAgent: null,
};

/**
 * Create a mock Kysely query builder
 */
export function createMockQueryBuilder<T>(result: T | null = null) {
  const builder = {
    selectAll: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insertInto: jest.fn().mockReturnThis(),
    updateTable: jest.fn().mockReturnThis(),
    deleteFrom: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    executeTakeFirst: jest.fn().mockResolvedValue(result),
    executeTakeFirstOrThrow: jest.fn().mockResolvedValue(result),
    execute: jest.fn().mockResolvedValue(result ? [result] : []),
  };
  return builder;
}

/**
 * Create a chainable mock that returns itself for fluent interface
 */
export function createChainableMock<T>(finalResult: T | null = null) {
  const mock: any = {
    _result: finalResult,
  };

  const methods = [
    'selectFrom',
    'selectAll',
    'select',
    'where',
    'insertInto',
    'updateTable',
    'deleteFrom',
    'values',
    'set',
    'returning',
    'orderBy',
    'limit',
    'offset',
    'leftJoin',
    'innerJoin',
  ];

  methods.forEach((method) => {
    mock[method] = jest.fn().mockReturnValue(mock);
  });

  mock.executeTakeFirst = jest.fn().mockResolvedValue(finalResult);
  mock.executeTakeFirstOrThrow = jest.fn().mockResolvedValue(finalResult);
  mock.execute = jest.fn().mockResolvedValue(finalResult ? [finalResult] : []);

  return mock;
}
