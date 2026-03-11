/**
 * Password Reset Tests
 *
 * Tests for forgot password and reset password flows.
 * Verifies: email enumeration prevention, token generation/expiry,
 * password validation, session invalidation, and correct HTTP responses.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth.service';
import { AuthController } from '../auth.controller';
import { authService } from '../auth.service';
import { mockDb, mockSelectResult, mockUpdateResult, mockDeleteResult } from '../../../__tests__/mocks/db.mock';
import { mockUser } from '../../../__tests__/fixtures';
import { BadRequestError, ValidationError } from '../../../common/utils/errors';

// Mock password utility — default: passwords are valid
jest.mock('../../../common/utils/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('$2b$10$newhashedpassword'),
  comparePassword: jest.fn().mockResolvedValue(true),
  validatePasswordStrength: jest.fn().mockReturnValue({ valid: true, errors: [] }),
}));

// Mock JWT utility
jest.mock('../../../common/utils/jwt', () => ({
  generateTokenPair: jest.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
  verifyRefreshToken: jest.fn(),
}));

// Mock cuid2
jest.mock('@paralleldrive/cuid2', () => ({
  createId: jest.fn().mockReturnValue('mock-cuid'),
}));

// Mock crypto for deterministic token generation
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('deterministic-reset-token-for-testing'),
  }),
}));

// ============================================================================
// Fixtures
// ============================================================================

const mockUserWithResetToken = {
  ...mockUser,
  passwordResetToken: 'valid-reset-token',
  passwordResetExpAt: new Date(Date.now() + 60 * 60 * 1000), // 1hr in future
};

const mockUserWithExpiredToken = {
  ...mockUser,
  passwordResetToken: 'expired-reset-token',
  passwordResetExpAt: new Date(Date.now() - 60 * 60 * 1000), // 1hr ago
};

// ============================================================================
// Service Tests
// ============================================================================

describe('AuthService - Password Reset', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    jest.clearAllMocks();
  });

  // ==========================================================================
  // forgotPassword()
  // ==========================================================================

  describe('forgotPassword()', () => {
    it('does NOT throw and does NOT write to DB when email is unknown', async () => {
      // User not found
      mockSelectResult([]);

      await expect(
        service.forgotPassword({ email: 'nonexistent@example.com' })
      ).resolves.not.toThrow();

      // Critically: updateTable should NOT have been called
      expect(mockDb.updateTable).not.toHaveBeenCalled();
    });

    it('generates a token and stores it with a ~1hr future expiry', async () => {
      const now = Date.now();
      mockSelectResult([mockUser]);
      const updateBuilder = mockUpdateResult([]);

      await service.forgotPassword({ email: mockUser.email });

      // Verify updateTable was called on users table
      expect(mockDb.updateTable).toHaveBeenCalledWith('users');

      // Verify the set() call contains the token and a future expiry
      const setCall = updateBuilder.set.mock.calls[0][0];
      expect(setCall.passwordResetToken).toBe('deterministic-reset-token-for-testing');
      expect(setCall.passwordResetExpAt).toBeInstanceOf(Date);

      // Expiry should be roughly 1 hour from now (within 5 seconds tolerance)
      const expiryMs = setCall.passwordResetExpAt.getTime();
      const expectedMs = now + 60 * 60 * 1000;
      expect(Math.abs(expiryMs - expectedMs)).toBeLessThan(5000);
    });

    it('lowercases the email before looking up the user', async () => {
      const selectBuilder = mockSelectResult([]);

      await service.forgotPassword({ email: 'TEST@EXAMPLE.COM' });

      // The where clause should have been called with lowercase email
      expect(selectBuilder.where).toHaveBeenCalledWith(
        'email', '=', 'test@example.com'
      );
    });

    it('logs the reset URL containing the token to console', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockSelectResult([mockUser]);
      mockUpdateResult([]);

      await service.forgotPassword({ email: mockUser.email });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('deterministic-reset-token-for-testing')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/reset-password')
      );

      consoleSpy.mockRestore();
    });
  });

  // ==========================================================================
  // resetPassword()
  // ==========================================================================

  describe('resetPassword()', () => {
    it('throws BadRequestError when token does not exist in DB', async () => {
      // No user found with this token
      mockSelectResult([]);

      await expect(
        service.resetPassword({ token: 'nonexistent-token', password: 'NewP@ssw0rd!' })
      ).rejects.toThrow(BadRequestError);

      await expect(
        service.resetPassword({ token: 'nonexistent-token', password: 'NewP@ssw0rd!' })
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('throws BadRequestError when token is expired', async () => {
      // User found but token expired 1 hour ago
      mockSelectResult([mockUserWithExpiredToken]);

      await expect(
        service.resetPassword({ token: 'expired-reset-token', password: 'NewP@ssw0rd!' })
      ).rejects.toThrow(BadRequestError);
    });

    it('throws ValidationError when new password is too weak', async () => {
      const { validatePasswordStrength } = require('../../../common/utils/password');
      validatePasswordStrength.mockReturnValueOnce({
        valid: false,
        errors: ['Must contain uppercase letter', 'Must contain special character'],
      });

      mockSelectResult([mockUserWithResetToken]);

      await expect(
        service.resetPassword({ token: 'valid-reset-token', password: 'weakpass' })
      ).rejects.toThrow(ValidationError);
    });

    it('hashes the new password and updates the user record', async () => {
      const { hashPassword } = require('../../../common/utils/password');

      mockSelectResult([mockUserWithResetToken]);
      const updateBuilder = mockUpdateResult([]);
      mockDeleteResult([]); // for session deletion

      await service.resetPassword({ token: 'valid-reset-token', password: 'NewSecureP@ss1!' });

      // Verify hashPassword was called with the new password
      expect(hashPassword).toHaveBeenCalledWith('NewSecureP@ss1!');

      // Verify the DB update includes the hashed password
      const setCall = updateBuilder.set.mock.calls[0][0];
      expect(setCall.passwordHash).toBe('$2b$10$newhashedpassword');
    });

    it('clears the reset token after use (single-use enforcement)', async () => {
      mockSelectResult([mockUserWithResetToken]);
      const updateBuilder = mockUpdateResult([]);
      mockDeleteResult([]); // for session deletion

      await service.resetPassword({ token: 'valid-reset-token', password: 'NewSecureP@ss1!' });

      const setCall = updateBuilder.set.mock.calls[0][0];
      expect(setCall.passwordResetToken).toBeNull();
      expect(setCall.passwordResetExpAt).toBeNull();
    });

    it('invalidates all existing sessions for security', async () => {
      mockSelectResult([mockUserWithResetToken]);
      mockUpdateResult([]); // password update
      const deleteBuilder = mockDeleteResult([]);

      await service.resetPassword({ token: 'valid-reset-token', password: 'NewSecureP@ss1!' });

      // Verify sessions were deleted for this user
      expect(mockDb.deleteFrom).toHaveBeenCalledWith('sessions');
      expect(deleteBuilder.where).toHaveBeenCalledWith('userId', '=', mockUser.id);
    });
  });
});

// ============================================================================
// Controller Tests
// ============================================================================

// Mock the auth service for controller tests
jest.mock('../auth.service', () => {
  const actual = jest.requireActual('../auth.service');
  return {
    ...actual,
    authService: {
      ...actual.authService,
      forgotPassword: jest.fn().mockResolvedValue(undefined),
      resetPassword: jest.fn().mockResolvedValue(undefined),
    },
  };
});

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    cookies: {},
    user: undefined,
    ...overrides,
  } as Request;
}

function createMockRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('AuthController - Password Reset', () => {
  let controller: AuthController;
  let mockNext: jest.Mock;

  beforeEach(() => {
    controller = new AuthController();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  // ==========================================================================
  // forgotPassword()
  // ==========================================================================

  describe('forgotPassword()', () => {
    it('returns 200 with generic message on valid email', async () => {
      const req = createMockReq({ body: { email: 'user@example.com' } });
      const res = createMockRes();

      await controller.forgotPassword(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'If an account with that email exists, a password reset link has been sent.',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns identical 200 response for unknown email (prevents enumeration)', async () => {
      // Service returns void for both known and unknown emails
      (authService.forgotPassword as jest.Mock).mockResolvedValue(undefined);

      const req = createMockReq({ body: { email: 'unknown@example.com' } });
      const res = createMockRes();

      await controller.forgotPassword(req, res, mockNext);

      // Response must be identical regardless of whether email exists
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'If an account with that email exists, a password reset link has been sent.',
        },
      });
    });

    it('calls next with ValidationError for malformed email', async () => {
      const req = createMockReq({ body: { email: 'not-an-email' } });
      const res = createMockRes();

      await controller.forgotPassword(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('calls next with ValidationError for empty body', async () => {
      const req = createMockReq({ body: {} });
      const res = createMockRes();

      await controller.forgotPassword(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  // ==========================================================================
  // resetPassword()
  // ==========================================================================

  describe('resetPassword()', () => {
    it('returns 200 with success message on valid reset', async () => {
      const req = createMockReq({
        body: { token: 'valid-token', password: 'NewSecureP@ss1!' },
      });
      const res = createMockRes();

      await controller.resetPassword(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Password has been reset successfully.',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('forwards BadRequestError from service (expired/invalid token)', async () => {
      (authService.resetPassword as jest.Mock).mockRejectedValue(
        new BadRequestError('Invalid or expired reset token')
      );

      const req = createMockReq({
        body: { token: 'expired-token', password: 'NewSecureP@ss1!' },
      });
      const res = createMockRes();

      await controller.resetPassword(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('calls next with ValidationError for missing token', async () => {
      const req = createMockReq({
        body: { password: 'NewSecureP@ss1!' },
      });
      const res = createMockRes();

      await controller.resetPassword(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('calls next with ValidationError for password shorter than 8 chars', async () => {
      const req = createMockReq({
        body: { token: 'valid-token', password: 'short' },
      });
      const res = createMockRes();

      await controller.resetPassword(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ValidationError);
    });
  });
});
