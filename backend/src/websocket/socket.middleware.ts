/**
 * Socket.IO Authentication Middleware
 * Validates JWT token and attaches user info to socket
 */

import { Socket } from 'socket.io';
import { verifyAccessToken } from '../common/utils/jwt';
import { db } from '../config/kysely';
import { logger } from '../common/utils/logger';
import type { AuthenticatedSocket } from './socket.types';

/**
 * JWT authentication middleware for Socket.IO
 * Validates token from handshake and attaches user info to socket
 */
export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    // Extract token from auth object or authorization header
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      logger.warn('Socket connection rejected: No token provided', {
        socketId: socket.id,
      });
      return next(new Error('Authentication required'));
    }

    // Verify JWT token
    const payload = verifyAccessToken(token);

    // Verify user exists in database
    const user = await db
      .selectFrom('users')
      .select(['id', 'email'])
      .where('id', '=', payload.userId)
      .executeTakeFirst();

    if (!user) {
      logger.warn('Socket connection rejected: User not found', {
        socketId: socket.id,
        userId: payload.userId,
      });
      return next(new Error('User not found'));
    }

    // Attach user info to socket
    (socket as AuthenticatedSocket).userId = user.id;
    (socket as AuthenticatedSocket).userEmail = user.email;

    logger.debug('Socket authenticated', {
      socketId: socket.id,
      userId: user.id,
    });

    next();
  } catch (error) {
    logger.warn('Socket authentication failed', {
      socketId: socket.id,
      error: (error as Error).message,
    });
    next(new Error('Invalid token'));
  }
}
