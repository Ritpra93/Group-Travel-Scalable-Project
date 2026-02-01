/**
 * Auth Service Tests
 *
 * Tests for user registration, login, and token management
 */

import { AuthService } from '../auth.service';
import { mockDb, mockSelectResult, mockInsertResult } from '../../../__tests__/mocks/db.mock';
import { mockUser, mockSession } from '../../../__tests__/fixtures';
import { ConflictError, UnauthorizedError, ValidationError } from '../../../common/utils/errors';

// Mock the password utility
jest.mock('../../../common/utils/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  comparePassword: jest.fn().mockResolvedValue(true),
  validatePasswordStrength: jest.fn().mockReturnValue({ valid: true, errors: [] }),
}));

// Mock JWT utility
jest.mock('../../../common/utils/jwt', () => ({
  generateTokenPair: jest.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
  verifyRefreshToken: jest.fn().mockReturnValue({
    userId: 'user-1',
    email: 'test@example.com',
    type: 'refresh',
  }),
}));

// Mock cuid2
jest.mock('@paralleldrive/cuid2', () => ({
  createId: jest.fn().mockReturnValue('mock-cuid'),
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validInput = {
      email: 'newuser@example.com',
      password: 'SecureP@ssw0rd!',
      name: 'New User',
      timezone: 'UTC',
      interests: [] as string[],
    };

    it('should register a new user successfully', async () => {
      // Mock: no existing user
      mockSelectResult([]);

      // Mock: user creation returns user
      const createdUser = {
        id: 'mock-cuid',
        email: validInput.email.toLowerCase(),
        name: validInput.name,
        avatarUrl: null,
        timezone: 'UTC',
        interests: [],
        createdAt: new Date(),
      };
      mockInsertResult([createdUser]);

      // Mock: session creation
      mockInsertResult([{ id: 'session-id' }]);

      const result = await authService.register(validInput);

      expect(result.user.email).toBe(validInput.email.toLowerCase());
      expect(result.user.name).toBe(validInput.name);
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(result.tokens.refreshToken).toBe('mock-refresh-token');
    });

    it('should throw ConflictError if email already exists', async () => {
      // Mock: existing user found
      mockSelectResult([mockUser]);

      await expect(authService.register(validInput)).rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError if password is weak', async () => {
      const { validatePasswordStrength } = require('../../../common/utils/password');
      validatePasswordStrength.mockReturnValueOnce({
        valid: false,
        errors: ['Password must be at least 8 characters'],
      });

      await expect(
        authService.register({ ...validInput, password: 'weak' })
      ).rejects.toThrow(ValidationError);
    });

    it('should normalize email to lowercase', async () => {
      mockSelectResult([]);
      const createdUser = {
        id: 'mock-cuid',
        email: 'uppercase@example.com',
        name: validInput.name,
        avatarUrl: null,
        timezone: 'UTC',
        interests: [],
        createdAt: new Date(),
      };
      mockInsertResult([createdUser]);
      mockInsertResult([{ id: 'session-id' }]);

      const result = await authService.register({
        ...validInput,
        email: 'UPPERCASE@EXAMPLE.COM',
      });

      // Check that insertInto was called with lowercase email
      expect(mockDb.insertInto).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'SecureP@ssw0rd!',
    };

    it('should login user with valid credentials', async () => {
      // Mock: user found
      mockSelectResult([mockUser]);

      // Mock: session creation
      mockInsertResult([{ id: 'session-id' }]);

      // Mock: update last login
      const mockUpdateBuilder = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };
      mockDb.updateTable.mockReturnValueOnce(mockUpdateBuilder as any);

      const result = await authService.login(validCredentials);

      expect(result.user.email).toBe(mockUser.email);
      expect(result.tokens.accessToken).toBe('mock-access-token');
    });

    it('should throw UnauthorizedError if user not found', async () => {
      // Mock: no user found
      mockSelectResult([]);

      await expect(authService.login(validCredentials)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if password is incorrect', async () => {
      const { comparePassword } = require('../../../common/utils/password');
      comparePassword.mockResolvedValueOnce(false);

      // Mock: user found
      mockSelectResult([mockUser]);

      await expect(authService.login(validCredentials)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('logout', () => {
    it('should delete session and blacklist token', async () => {
      // Mock: session deletion
      const mockDeleteBuilder = {
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };
      mockDb.deleteFrom.mockReturnValueOnce(mockDeleteBuilder as any);

      await expect(
        authService.logout('refresh-token')
      ).resolves.not.toThrow();

      expect(mockDb.deleteFrom).toHaveBeenCalledWith('sessions');
    });
  });
});
