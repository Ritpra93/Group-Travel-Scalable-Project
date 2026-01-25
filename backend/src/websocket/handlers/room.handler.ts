/**
 * Socket.IO Room Handler
 * Handles trip room join/leave with authorization
 */

import { Socket } from 'socket.io';
import { db } from '../../config/kysely';
import { logger } from '../../common/utils/logger';
import type { AuthenticatedSocket } from '../socket.types';

/**
 * Register room-related event handlers
 */
export function registerRoomHandlers(socket: Socket): void {
  const authSocket = socket as AuthenticatedSocket;

  /**
   * Join a trip room
   * Verifies user is a member of the trip's group before allowing
   */
  socket.on('trip:join', async (tripId: string) => {
    try {
      if (!tripId || typeof tripId !== 'string') {
        socket.emit('error', { message: 'Invalid trip ID' });
        return;
      }

      // Verify user is a member of the trip's group
      const membership = await db
        .selectFrom('trips as t')
        .innerJoin('group_members as gm', 'gm.groupId', 't.groupId')
        .select(['t.id', 't.name'])
        .where('t.id', '=', tripId)
        .where('gm.userId', '=', authSocket.userId)
        .executeTakeFirst();

      if (!membership) {
        logger.warn('Socket room join rejected: Not authorized', {
          socketId: socket.id,
          userId: authSocket.userId,
          tripId,
        });
        socket.emit('error', { message: 'Not authorized to join this trip' });
        return;
      }

      // Join the room
      await socket.join(`trip:${tripId}`);

      logger.debug('Socket joined trip room', {
        socketId: socket.id,
        userId: authSocket.userId,
        tripId,
        tripName: membership.name,
      });

      socket.emit('trip:joined', { tripId });
    } catch (error) {
      logger.error('Error joining trip room', {
        socketId: socket.id,
        userId: authSocket.userId,
        tripId,
        error: (error as Error).message,
      });
      socket.emit('error', { message: 'Failed to join trip room' });
    }
  });

  /**
   * Leave a trip room
   */
  socket.on('trip:leave', async (tripId: string) => {
    try {
      if (!tripId || typeof tripId !== 'string') {
        socket.emit('error', { message: 'Invalid trip ID' });
        return;
      }

      await socket.leave(`trip:${tripId}`);

      logger.debug('Socket left trip room', {
        socketId: socket.id,
        userId: authSocket.userId,
        tripId,
      });

      socket.emit('trip:left', { tripId });
    } catch (error) {
      logger.error('Error leaving trip room', {
        socketId: socket.id,
        userId: authSocket.userId,
        tripId,
        error: (error as Error).message,
      });
    }
  });
}
