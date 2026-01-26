import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { registerSchema, loginSchema } from './auth.types';
import { ValidationError, UnauthorizedError } from '../../common/utils/errors';
import { env } from '../../config/env';
import type { ApiResponse } from '../../common/types/api';
import type { AuthResponse } from './auth.types';

// Cookie options for refresh token
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/**
 * Authentication Controller
 *
 * Handles HTTP requests for authentication endpoints
 */
export class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  async register(
    req: Request,
    res: Response<ApiResponse<AuthResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body);

      // Register user
      const result = await authService.register(validatedData);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(
    req: Request,
    res: Response<ApiResponse<AuthResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate input
      const validatedData = loginSchema.parse(req.body);

      // Login user
      const result = await authService.login(validatedData);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   * Reads refresh token from cookie or body (for backwards compatibility)
   */
  async logout(
    req: Request,
    res: Response<ApiResponse<void>>,
    next: NextFunction
  ): Promise<void> {
    try {
      // Read refresh token from cookie first, fallback to body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      await authService.logout(refreshToken);

      // Clear the httpOnly cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   * Reads refresh token from httpOnly cookie (set during login)
   */
  async refresh(
    req: Request,
    res: Response<ApiResponse<AuthResponse['tokens']>>,
    next: NextFunction
  ): Promise<void> {
    try {
      // Read refresh token from httpOnly cookie
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token not found');
      }

      // Refresh tokens
      const tokens = await authService.refreshTokens({ refreshToken });

      // Update the httpOnly cookie with new refresh token
      res.cookie('refreshToken', tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  async me(
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      // User is already attached to req by auth middleware
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const { passwordHash: _, ...userWithoutPassword } = req.user;

      res.status(200).json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
