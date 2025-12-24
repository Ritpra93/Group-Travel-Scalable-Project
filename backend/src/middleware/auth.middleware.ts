import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../common/utils/jwt';
import { UnauthorizedError } from '../common/utils/errors';
import { prisma } from '../config/database';

/**
 * Authentication middleware
 *
 * Verifies JWT access token and attaches user to request
 * Usage: Apply to routes that require authentication
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyAccessToken(token);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware
 *
 * Similar to authenticate, but doesn't fail if no token is provided
 * Useful for routes that work differently for authenticated vs unauthenticated users
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const payload = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (user) {
        req.user = user;
      }
    } catch {
      // Invalid token, continue without user
    }

    next();
  } catch (error) {
    next(error);
  }
}
