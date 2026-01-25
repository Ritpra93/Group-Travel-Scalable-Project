/**
 * Socket.IO Connection Handler
 * Handles connect/disconnect events and logging
 */

import { Socket } from 'socket.io';
import { logger } from '../../common/utils/logger';
import type { AuthenticatedSocket } from '../socket.types';

/**
 * Register connection-related event handlers
 */
export function registerConnectionHandlers(socket: Socket): void {
  const authSocket = socket as AuthenticatedSocket;

  logger.info('Socket connected', {
    socketId: socket.id,
    userId: authSocket.userId,
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    logger.info('Socket disconnected', {
      socketId: socket.id,
      userId: authSocket.userId,
      reason,
    });
  });

  // Handle errors
  socket.on('error', (error) => {
    logger.error('Socket error', {
      socketId: socket.id,
      userId: authSocket.userId,
      error: error.message,
    });
  });
}
