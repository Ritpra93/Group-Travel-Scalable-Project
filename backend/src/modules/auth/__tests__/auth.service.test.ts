/**
 * Auth Service Tests
 * Unit tests for authentication functionality
 */

import { AuthService } from '../auth.service';
import { ConflictError, UnauthorizedError, ValidationError } from '../../../common/utils/errors';
import * as passwordUtils from '../../../common/utils/password';
import * as jwtUtils from '../../../common/utils/jwt';
import { db } from '../../../config/kysely';
import { cacheSet, cacheGet } from '../../../config/redis';

// Mock the database
jest.mock('../../../config/kysely', () => ({
  db: {
    selectFrom: jest.fn(),
    insertInto: jest.fn(),
    updateTable: jest.fn(),
    deleteFrom: jest.fn(),
  },
}));

// Mock password utilities
jest.mock('../../../common/utils/password', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  validatePasswordStrength: jest.fn(),
}));

// Mock JWT utilities
jest.mock('../../../common/utils/jwt', () => ({
  generateTokenPair: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

// Mock cuid2
jest.mock('@paralleldrive/cuid2', () => ({
  createId: jest.fn(() => 'mock-id-123'),
}));

describe('AuthService', () => {
  let authService: AuthService;

  // Mock data
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
    timezone: 'UTC',
    interests: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockUserWithPassword = {
    ...mockUser,
    passwordHash: 'hashed-password',
    bio: null,
    lastLoginAt: null,
    emailVerifiedAt: null,
  };

  const mockTokenPair = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: '15m',
  };

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  // Helper to create chainable mock
  const createChainableMock = (result: any = null) => {
    const mock: any = {};
    const methods = [
      'selectFrom', 'selectAll', 'select', 'where', 'insertInto',
      'updateTable', 'deleteFrom', 'values', 'set', 'returning',
    ];
    methods.forEach((m) => {
      mock[m] = jest.fn().mockReturnValue(mock);
    });
    mock.executeTakeFirst = jest.fn().mockResolvedValue(result);
    mock.executeTakeFirstOrThrow = jest.fn().mockResolvedValue(result);
    mock.execute = jest.fn().mockResolvedValue(result ? [result] : []);
    return mock;
  };

  describe('register', () => {
    const validRegistration = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      name: 'New User',
      timezone: 'UTC',
      interests: [] as string[],
    };

    it('should register a new user successfully', async () => {
      // Setup mocks
      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashed-password');
      (jwtUtils.generateTokenPair as jest.Mock).mockReturnValue(mockTokenPair);

      const selectMock = createChainableMock(null); // No existing user
      const insertMock = createChainableMock(mockUser);
      const sessionInsertMock = createChainableMock();

      (db.selectFrom as jest.Mock).mockReturnValue(selectMock);
      (db.insertInto as jest.Mock)
        .mockReturnValueOnce(insertMock)
        .mockReturnValueOnce(sessionInsertMock);

      // Execute
      const result = await authService.register(validRegistration);

      // Assert
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
      expect(result.tokens).toEqual(mockTokenPair);
      expect(passwordUtils.validatePasswordStrength).toHaveBeenCalledWith(validRegistration.password);
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(validRegistration.password);
    });

    it('should throw ValidationError for weak password', async () => {
      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Password must be at least 8 characters'],
      });

      await expect(
        authService.register({ ...validRegistration, password: 'weak' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if email already exists', async () => {
      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      const selectMock = createChainableMock(mockUser); // User exists
      (db.selectFrom as jest.Mock).mockReturnValue(selectMock);

      await expect(authService.register(validRegistration)).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    const loginCredentials = {
      email: 'test@example.com',
      password: 'ValidPassword123!',
    };

    it('should login successfully with valid credentials', async () => {
      const selectMock = createChainableMock(mockUserWithPassword);
      const updateMock = createChainableMock();
      const insertMock = createChainableMock();

      (db.selectFrom as jest.Mock).mockReturnValue(selectMock);
      (db.insertInto as jest.Mock).mockReturnValue(insertMock);
      (db.updateTable as jest.Mock).mockReturnValue(updateMock);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateTokenPair as jest.Mock).mockReturnValue(mockTokenPair);

      const result = await authService.login(loginCredentials);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(loginCredentials.email);
      expect(result.tokens).toEqual(mockTokenPair);
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      const selectMock = createChainableMock(null);
      (db.selectFrom as jest.Mock).mockReturnValue(selectMock);

      await expect(authService.login(loginCredentials)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for wrong password', async () => {
      const selectMock = createChainableMock(mockUserWithPassword);
      (db.selectFrom as jest.Mock).mockReturnValue(selectMock);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginCredentials)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('logout', () => {
    it('should logout successfully and blacklist token', async () => {
      const mockPayload = { userId: 'user-123', email: 'test@example.com', type: 'refresh' as const };
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);

      const deleteMock = createChainableMock();
      (db.deleteFrom as jest.Mock).mockReturnValue(deleteMock);

      await authService.logout('valid-refresh-token');

      expect(jwtUtils.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(db.deleteFrom).toHaveBeenCalled();
      expect(cacheSet).toHaveBeenCalledWith(
        'blacklist:valid-refresh-token',
        true,
        expect.any(Number)
      );
    });

    it('should not throw error for invalid token (idempotent)', async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Should not throw
      await expect(authService.logout('invalid-token')).resolves.toBeUndefined();
    });
  });

  describe('refreshTokens', () => {
    const mockSession = {
      id: 'session-123',
      userId: 'user-123',
      token: 'old-refresh-token',
      expiresAt: new Date(Date.now() + 86400000),
    };

    it('should refresh tokens successfully', async () => {
      const mockPayload = { userId: 'user-123', email: 'test@example.com', type: 'refresh' as const };
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (cacheGet as jest.Mock).mockResolvedValue(null); // Not blacklisted
      (jwtUtils.generateTokenPair as jest.Mock).mockReturnValue(mockTokenPair);

      const sessionSelectMock = createChainableMock(mockSession);
      const userSelectMock = createChainableMock({ id: 'user-123', email: 'test@example.com' });
      const updateMock = createChainableMock();

      (db.selectFrom as jest.Mock)
        .mockReturnValueOnce(sessionSelectMock)
        .mockReturnValueOnce(userSelectMock);
      (db.updateTable as jest.Mock).mockReturnValue(updateMock);

      const result = await authService.refreshTokens({ refreshToken: 'old-refresh-token' });

      expect(result).toEqual(mockTokenPair);
      expect(cacheSet).toHaveBeenCalled(); // Old token blacklisted
    });

    it('should throw UnauthorizedError for blacklisted token', async () => {
      const mockPayload = { userId: 'user-123', email: 'test@example.com', type: 'refresh' as const };
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (cacheGet as jest.Mock).mockResolvedValue(true); // Blacklisted

      await expect(
        authService.refreshTokens({ refreshToken: 'blacklisted-token' })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for expired session', async () => {
      const mockPayload = { userId: 'user-123', email: 'test@example.com', type: 'refresh' as const };
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (cacheGet as jest.Mock).mockResolvedValue(null);

      const selectMock = createChainableMock(null); // No valid session
      (db.selectFrom as jest.Mock).mockReturnValue(selectMock);

      await expect(
        authService.refreshTokens({ refreshToken: 'expired-session-token' })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete expired sessions and return count', async () => {
      const deleteMock = createChainableMock();
      deleteMock.executeTakeFirst = jest.fn().mockResolvedValue({ numDeletedRows: BigInt(5) });
      (db.deleteFrom as jest.Mock).mockReturnValue(deleteMock);

      const count = await authService.cleanupExpiredSessions();

      expect(count).toBe(5);
      expect(db.deleteFrom).toHaveBeenCalled();
    });
  });
});

describe('Password Validation (Unit)', () => {
  // Test the actual password validation without mocking
  const { validatePasswordStrength } = jest.requireActual('../../../common/utils/password');

  it('should accept valid password', () => {
    const result = validatePasswordStrength('ValidPass123!');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject short password', () => {
    const result = validatePasswordStrength('Ab1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters long');
  });

  it('should reject password without uppercase', () => {
    const result = validatePasswordStrength('validpass123!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('should reject password without lowercase', () => {
    const result = validatePasswordStrength('VALIDPASS123!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('should reject password without number', () => {
    const result = validatePasswordStrength('ValidPass!!!!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('should reject password without special character', () => {
    const result = validatePasswordStrength('ValidPass123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one special character');
  });
});
