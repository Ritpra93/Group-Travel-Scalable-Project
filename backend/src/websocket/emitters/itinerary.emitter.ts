/**
 * Itinerary Event Emitters
 * Emits real-time itinerary events to connected clients in trip rooms
 */

import { getIO, isSocketIOInitialized } from '../index';
import { logger } from '../../common/utils/logger';
import type {
  SocketEvent,
  ItineraryItemCreatedData,
  ItineraryItemUpdatedData,
  ItineraryItemDeletedData,
} from '../socket.types';

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
 * Emit when a new itinerary item is created
 */
export function emitItineraryItemCreated(
  tripId: string,
  itemId: string,
  title: string,
  type: string,
  userId: string
): void {
  if (!isSocketIOInitialized()) {
    logger.debug('Socket.IO not initialized, skipping itinerary:created emit');
    return;
  }

  const io = getIO();
  const event = createEvent<ItineraryItemCreatedData>('itinerary:created', tripId, {
    itemId,
    title,
    type,
  }, userId);

  io.to(`trip:${tripId}`).emit('itinerary:created', event);
  logger.debug('Emitted itinerary:created event', { tripId, itemId, userId });
}

/**
 * Emit when an itinerary item is updated
 */
export function emitItineraryItemUpdated(
  tripId: string,
  itemId: string,
  userId: string
): void {
  if (!isSocketIOInitialized()) {
    logger.debug('Socket.IO not initialized, skipping itinerary:updated emit');
    return;
  }

  const io = getIO();
  const event = createEvent<ItineraryItemUpdatedData>('itinerary:updated', tripId, {
    itemId,
  }, userId);

  io.to(`trip:${tripId}`).emit('itinerary:updated', event);
  logger.debug('Emitted itinerary:updated event', { tripId, itemId, userId });
}

/**
 * Emit when an itinerary item is deleted
 */
export function emitItineraryItemDeleted(
  tripId: string,
  itemId: string,
  userId: string
): void {
  if (!isSocketIOInitialized()) {
    logger.debug('Socket.IO not initialized, skipping itinerary:deleted emit');
    return;
  }

  const io = getIO();
  const event = createEvent<ItineraryItemDeletedData>('itinerary:deleted', tripId, {
    itemId,
  }, userId);

  io.to(`trip:${tripId}`).emit('itinerary:deleted', event);
  logger.debug('Emitted itinerary:deleted event', { tripId, itemId, userId });
}
