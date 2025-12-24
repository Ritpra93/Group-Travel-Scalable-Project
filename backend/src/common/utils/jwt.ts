import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError } from './errors';

/**
 * JWT payload interface
 */
export interface JwtPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

/**
 * Token pair (access + refresh)
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Generate access token
 *
 * @param userId - User ID
 * @param email - User email
 * @returns Signed JWT access token
 */
export function generateAccessToken(userId: string, email: string): string {
  const payload: JwtPayload = {
    userId,
    email,
    type: 'access',
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRY,
    issuer: 'trip-hub-api',
    audience: 'trip-hub-client',
  });
}

/**
 * Generate refresh token
 *
 * @param userId - User ID
 * @param email - User email
 * @returns Signed JWT refresh token
 */
export function generateRefreshToken(userId: string, email: string): string {
  const payload: JwtPayload = {
    userId,
    email,
    type: 'refresh',
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
    issuer: 'trip-hub-api',
    audience: 'trip-hub-client',
  });
}

/**
 * Generate both access and refresh tokens
 *
 * @param userId - User ID
 * @param email - User email
 * @returns Token pair with expiry information
 */
export function generateTokenPair(userId: string, email: string): TokenPair {
  return {
    accessToken: generateAccessToken(userId, email),
    refreshToken: generateRefreshToken(userId, email),
    expiresIn: env.JWT_EXPIRY,
  };
}

/**
 * Verify access token
 *
 * @param token - JWT token to verify
 * @returns Decoded payload
 * @throws UnauthorizedError if token is invalid
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'trip-hub-api',
      audience: 'trip-hub-client',
    }) as JwtPayload;

    if (decoded.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw error;
  }
}

/**
 * Verify refresh token
 *
 * @param token - JWT token to verify
 * @returns Decoded payload
 * @throws UnauthorizedError if token is invalid
 */
export function verifyRefreshToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'trip-hub-api',
      audience: 'trip-hub-client',
    }) as JwtPayload;

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Decode token without verification (for debugging only)
 *
 * @param token - JWT token to decode
 * @returns Decoded payload or null
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}
