import { db } from '../../config/kysely';
import { hashPassword, comparePassword, validatePasswordStrength } from '../../common/utils/password';
import { generateTokenPair, verifyRefreshToken } from '../../common/utils/jwt';
import { ConflictError, UnauthorizedError, ValidationError } from '../../common/utils/errors';
import { logAuth, logEvent } from '../../common/utils/logger';
import { cacheSet } from '../../config/redis';
import type { RegisterInput, LoginInput, RefreshTokenInput, AuthResponse } from './auth.types';
import { createId } from '@paralleldrive/cuid2';

/**
 * Authentication Service
 *
 * Handles user registration, login, logout, and token refresh
 */
export class AuthService {
  /**
   * Register a new user
   *
   * @param input - Registration data
   * @returns Authentication response with user and tokens
   * @throws ConflictError if email already exists
   * @throws ValidationError if password is weak
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, name, timezone, interests } = input;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw new ValidationError('Password does not meet requirements', {
        errors: passwordValidation.errors,
      });
    }

    // Check if user already exists
    const existingUser = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email.toLowerCase())
      .executeTakeFirst();

    if (existingUser) {
      logAuth('register', email, false, { reason: 'email_exists' });
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await db
      .insertInto('users')
      .values({
        id: createId(),
        email: email.toLowerCase(),
        passwordHash,
        name,
        timezone: timezone || 'UTC',
        interests: interests || [],
        updatedAt: new Date(),
      })
      .returning([
        'id',
        'email',
        'name',
        'avatarUrl',
        'timezone',
        'interests',
        'createdAt',
      ])
      .executeTakeFirstOrThrow();

    // Generate tokens
    const tokens = generateTokenPair(user.id, user.email);

    // Create session record
    await db
      .insertInto('sessions')
      .values({
        id: createId(),
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .execute();

    logAuth('register', user.id, true);
    logEvent('user_registered', { userId: user.id, email: user.email });

    return {
      user,
      tokens,
    };
  }

  /**
   * Login user
   *
   * @param input - Login credentials
   * @returns Authentication response with user and tokens
   * @throws UnauthorizedError if credentials are invalid
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    // Find user
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email.toLowerCase())
      .executeTakeFirst();

    if (!user) {
      logAuth('login', email, false, { reason: 'user_not_found' });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      logAuth('login', user.id, false, { reason: 'invalid_password' });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const tokens = generateTokenPair(user.id, user.email);

    // Create session record
    await db
      .insertInto('sessions')
      .values({
        id: createId(),
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .execute();

    // Update last login
    await db
      .updateTable('users')
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where('id', '=', user.id)
      .execute();

    logAuth('login', user.id, true);
    logEvent('user_logged_in', { userId: user.id, email: user.email });

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Logout user
   *
   * Invalidates the refresh token by removing it from the database
   * and adding it to the Redis blacklist
   *
   * @param refreshToken - Refresh token to invalidate
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      // Verify token to get user ID
      const payload = verifyRefreshToken(refreshToken);

      // Delete session from database
      await db
        .deleteFrom('sessions')
        .where('token', '=', refreshToken)
        .where('userId', '=', payload.userId)
        .execute();

      // Add token to blacklist in Redis (7 days TTL)
      await cacheSet(`blacklist:${refreshToken}`, true, 7 * 24 * 60 * 60);

      logAuth('logout', payload.userId, true);
      logEvent('user_logged_out', { userId: payload.userId });
    } catch (error) {
      // If token is invalid, still succeed (idempotent logout)
      logAuth('logout', 'unknown', false, { error: (error as Error).message });
    }
  }

  /**
   * Refresh access token using refresh token
   *
   * @param input - Refresh token input
   * @returns New token pair
   * @throws UnauthorizedError if refresh token is invalid or blacklisted
   */
  async refreshTokens(input: RefreshTokenInput): Promise<AuthResponse['tokens']> {
    const { refreshToken } = input;

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if token is blacklisted
    const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      logAuth('refresh', payload.userId, false, { reason: 'token_blacklisted' });
      throw new UnauthorizedError('Token has been revoked');
    }

    // Check if session exists
    const session = await db
      .selectFrom('sessions')
      .selectAll()
      .where('token', '=', refreshToken)
      .where('userId', '=', payload.userId)
      .where('expiresAt', '>', new Date())
      .executeTakeFirst();

    if (!session) {
      logAuth('refresh', payload.userId, false, { reason: 'session_not_found' });
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Get user
    const user = await db
      .selectFrom('users')
      .select(['id', 'email'])
      .where('id', '=', payload.userId)
      .executeTakeFirst();

    if (!user) {
      logAuth('refresh', payload.userId, false, { reason: 'user_not_found' });
      throw new UnauthorizedError('User not found');
    }

    // Generate new tokens
    const tokens = generateTokenPair(user.id, user.email);

    // Update session with new refresh token
    await db
      .updateTable('sessions')
      .set({
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(),
      })
      .where('id', '=', session.id)
      .execute();

    // Blacklist old refresh token
    await cacheSet(`blacklist:${refreshToken}`, true, 7 * 24 * 60 * 60);

    logAuth('refresh', user.id, true);

    return tokens;
  }

  /**
   * Check if a refresh token is blacklisted
   *
   * @param token - Refresh token to check
   * @returns true if blacklisted, false otherwise
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const { cacheGet } = await import('../../config/redis');
    const blacklisted = await cacheGet<boolean>(`blacklist:${token}`);
    return blacklisted === true;
  }

  /**
   * Cleanup expired sessions
   *
   * This should be run periodically (e.g., daily cron job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await db
      .deleteFrom('sessions')
      .where('expiresAt', '<', new Date())
      .executeTakeFirst();

    const count = Number(result.numDeletedRows || 0);
    logEvent('sessions_cleaned', { count });
    return count;
  }
}

export const authService = new AuthService();
