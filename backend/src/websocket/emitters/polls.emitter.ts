/**
 * Poll Event Emitters
 * Emits real-time poll events to connected clients in trip rooms
 */

import { getIO, isSocketIOInitialized } from '../index';
import { logger } from '../../common/utils/logger';
import type { SocketEvent, PollVotedData, PollCreatedData, PollClosedData, PollDeletedData } from '../socket.types';

/**
 * Create a socket event payload
 */
function createEvent<T>(type: string, tripId: string, data: T, userId: string): SocketEvent<T> {
  return {
    type,
    tripId,
    data,
    userId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Emit when a vote is cast, changed, or removed
 */
export function emitPollVoted(
  tripId: string,
  pollId: string,
  optionId: string,
  action: 'cast' | 'change' | 'remove',
  userId: string
): void {
  if (!isSocketIOInitialized()) {
    logger.debug('Socket.IO not initialized, skipping poll:voted emit');
    return;
  }

  const io = getIO();
  const event = createEvent<PollVotedData>('poll:voted', tripId, {
    pollId,
    optionId,
    action,
  }, userId);

  io.to(`trip:${tripId}`).emit('poll:voted', event);
  logger.debug('Emitted poll:voted event', { tripId, pollId, action, userId });
}

/**
 * Emit when a new poll is created
 */
export function emitPollCreated(
  tripId: string,
  pollId: string,
  title: string,
  userId: string
): void {
  if (!isSocketIOInitialized()) {
    logger.debug('Socket.IO not initialized, skipping poll:created emit');
    return;
  }

  const io = getIO();
  const event = createEvent<PollCreatedData>('poll:created', tripId, {
    pollId,
    title,
  }, userId);

  io.to(`trip:${tripId}`).emit('poll:created', event);
  logger.debug('Emitted poll:created event', { tripId, pollId, userId });
}

/**
 * Emit when a poll is closed
 */
export function emitPollClosed(
  tripId: string,
  pollId: string,
  userId: string
): void {
  if (!isSocketIOInitialized()) {
    logger.debug('Socket.IO not initialized, skipping poll:closed emit');
    return;
  }

  const io = getIO();
  const event = createEvent<PollClosedData>('poll:closed', tripId, {
    pollId,
  }, userId);

  io.to(`trip:${tripId}`).emit('poll:closed', event);
  logger.debug('Emitted poll:closed event', { tripId, pollId, userId });
}

/**
 * Emit when a poll is deleted
 */
export function emitPollDeleted(
  tripId: string,
  pollId: string,
  userId: string
): void {
  if (!isSocketIOInitialized()) {
    logger.debug('Socket.IO not initialized, skipping poll:deleted emit');
    return;
  }

  const io = getIO();
  const event = createEvent<PollDeletedData>('poll:deleted', tripId, {
    pollId,
  }, userId);

  io.to(`trip:${tripId}`).emit('poll:deleted', event);
  logger.debug('Emitted poll:deleted event', { tripId, pollId, userId });
}
