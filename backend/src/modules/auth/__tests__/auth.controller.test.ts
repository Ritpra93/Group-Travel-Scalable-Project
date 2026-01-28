/**
 * Auth Controller Tests
 * Unit tests for authentication controller handlers
 */

import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../auth.controller';
import { authService } from '../auth.service';
import { ConflictError, UnauthorizedError, ValidationError } from '../../../common/utils/errors';

// Mock the auth service
jest.mock('../auth.service', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshTokens: jest.fn(),
  },
}));

// Helper to create mock request
function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    cookies: {},
    user: undefined,
    ...overrides,
  } as Request;
}

// Helper to create mock response
function createMockRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('AuthController', () => {
  let controller: AuthController;
  let mockNext: NextFunction;

  // Mock data
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
    timezone: 'UTC',
    bio: null,
    interests: [] as string[],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastLoginAt: null,
    emailVerifiedAt: null,
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: '15m',
  };

  const mockAuthResponse = {
    user: mockUser,
    tokens: mockTokens,
  };

  beforeEach(() => {
    controller = new AuthController();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  // ==========================================================================
  // register()
  // ==========================================================================

  describe('register()', () => {
    const validRegistration = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      name: 'New User',
    };

    it('returns 201 with user and tokens on successful registration', async () => {
      const req = createMockReq({ body: validRegistration });
      const res = createMockRes();

      (authService.register as jest.Mock).mockResolvedValue(mockAuthResponse);

      await controller.register(req, res, mockNext);

      expect(authService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validRegistration.email,
          password: validRegistration.password,
          name: validRegistration.name,
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAuthResponse,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('calls next with ValidationError for invalid email format', async () => {
      const req = createMockReq({
        body: { email: 'not-an-email', password: 'SecurePass123!', name: 'Test' },
      });
      const res = createMockRes();

      await controller.register(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('calls next with ValidationError for missing required fields', async () => {
      const req = createMockReq({
        body: { email: 'test@example.com' }, // Missing password and name
      });
      const res = createMockRes();

      await controller.register(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('calls next with ValidationError for short password', async () => {
      const req = createMockReq({
        body: { email: 'test@example.com', password: 'short', name: 'Test' },
      });
      const res = createMockRes();

      await controller.register(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('calls next with ConflictError when email already exists', async () => {
      const req = createMockReq({ body: validRegistration });
      const res = createMockRes();

      (authService.register as jest.Mock).mockRejectedValue(
        new ConflictError('Email already registered')
      );

      await controller.register(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ConflictError));
    });
  });

  // ==========================================================================
  // login()
  // ==========================================================================

  describe('login()', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'ValidPassword123!',
    };

    it('returns 200 with user, tokens, and sets httpOnly cookie on successful login', async () => {
      const req = createMockReq({ body: validCredentials });
      const res = createMockRes();

      (authService.login as jest.Mock).mockResolvedValue(mockAuthResponse);

      await controller.login(req, res, mockNext);

      expect(authService.login).toHaveBeenCalledWith(validCredentials);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockTokens.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAuthResponse,
      });
    });

    it('calls next with ValidationError for invalid email format', async () => {
      const req = createMockReq({
        body: { email: 'invalid-email', password: 'SomePassword123!' },
      });
      const res = createMockRes();

      await controller.login(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('calls next with ValidationError for missing password', async () => {
      const req = createMockReq({
        body: { email: 'test@example.com' },
      });
      const res = createMockRes();

      await controller.login(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('calls next with UnauthorizedError for invalid credentials', async () => {
      const req = createMockReq({ body: validCredentials });
      const res = createMockRes();

      (authService.login as jest.Mock).mockRejectedValue(
        new UnauthorizedError('Invalid email or password')
      );

      await controller.login(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  // ==========================================================================
  // logout()
  // ==========================================================================

  describe('logout()', () => {
    it('returns 200 and clears cookie on successful logout with cookie', async () => {
      const req = createMockReq({
        cookies: { refreshToken: 'valid-refresh-token' },
      });
      const res = createMockRes();

      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      await controller.logout(req, res, mockNext);

      expect(authService.logout).toHaveBeenCalledWith('valid-refresh-token');
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('returns 200 on successful logout with body token (backwards compatibility)', async () => {
      const req = createMockReq({
        body: { refreshToken: 'body-refresh-token' },
      });
      const res = createMockRes();

      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      await controller.logout(req, res, mockNext);

      expect(authService.logout).toHaveBeenCalledWith('body-refresh-token');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('calls next with ValidationError when no refresh token provided', async () => {
      const req = createMockReq({ body: {}, cookies: {} });
      const res = createMockRes();

      await controller.logout(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('prefers cookie token over body token', async () => {
      const req = createMockReq({
        cookies: { refreshToken: 'cookie-token' },
        body: { refreshToken: 'body-token' },
      });
      const res = createMockRes();

      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      await controller.logout(req, res, mockNext);

      expect(authService.logout).toHaveBeenCalledWith('cookie-token');
    });
  });

  // ==========================================================================
  // refresh()
  // ==========================================================================

  describe('refresh()', () => {
    it('returns 200 with new tokens and updates cookie on successful refresh', async () => {
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: '15m',
      };
      const req = createMockReq({
        cookies: { refreshToken: 'old-refresh-token' },
      });
      const res = createMockRes();

      (authService.refreshTokens as jest.Mock).mockResolvedValue(newTokens);

      await controller.refresh(req, res, mockNext);

      expect(authService.refreshTokens).toHaveBeenCalledWith({
        refreshToken: 'old-refresh-token',
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        newTokens.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: newTokens,
      });
    });

    it('calls next with UnauthorizedError when no refresh token cookie present', async () => {
      const req = createMockReq({ cookies: {} });
      const res = createMockRes();

      await controller.refresh(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('calls next with UnauthorizedError for expired/invalid refresh token', async () => {
      const req = createMockReq({
        cookies: { refreshToken: 'expired-token' },
      });
      const res = createMockRes();

      (authService.refreshTokens as jest.Mock).mockRejectedValue(
        new UnauthorizedError('Token expired')
      );

      await controller.refresh(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('calls next with UnauthorizedError for blacklisted token', async () => {
      const req = createMockReq({
        cookies: { refreshToken: 'blacklisted-token' },
      });
      const res = createMockRes();

      (authService.refreshTokens as jest.Mock).mockRejectedValue(
        new UnauthorizedError('Token has been revoked')
      );

      await controller.refresh(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  // ==========================================================================
  // me()
  // ==========================================================================

  describe('me()', () => {
    it('returns 200 with user data when authenticated', async () => {
      const userWithPassword = {
        ...mockUser,
        passwordHash: 'hashed-password-should-not-be-returned',
      };
      const req = createMockReq({ user: userWithPassword });
      const res = createMockRes();

      await controller.me(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        }),
      });

      // Ensure password hash is not returned
      const responseData = (res.json as jest.Mock).mock.calls[0][0].data;
      expect(responseData.passwordHash).toBeUndefined();
    });

    it('calls next with ValidationError when user is not attached to request', async () => {
      const req = createMockReq({ user: undefined });
      const res = createMockRes();

      await controller.me(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(ValidationError);
    });
  });
});
