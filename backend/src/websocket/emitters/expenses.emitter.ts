/**
 * Expense Event Emitters
 * Emits real-time expense events to connected clients in trip rooms
 */

import { getIO, isSocketIOInitialized } from '../index';
import { logger } from '../../common/utils/logger';
import type {
  SocketEvent,
  ExpenseCreatedData,
  ExpenseUpdatedData,
  ExpenseDeletedData,
  SplitUpdatedData,
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
 * Emit when a new expense is created
 */
export function emitExpenseCreated(
  tripId: string,
  expenseId: string,
  title: string,
  amount: number,
  userId: string
): void {
  if (!isSocketIOInitialized()) {
    logger.debug('Socket.IO not initialized, skipping expense:created emit');
    return;
  }

  const io = getIO();
  const event = createEvent<ExpenseCreatedData>('expense:created', tripId, {
    expenseId,
    title,
    amount,
  }, userId);

  io.to(`trip:${tripId}`).emit('expense:created', event);
  logger.debug('Emitted expense:created event', { tripId, expenseId, userId });
}

/**
 * Emit when an expense is updated
 */
export function emitExpenseUpdated(
  tripId: string,
  expenseId: string,
  userId: string
): void {
  if (!isSocketIOInitialized()) {
    logger.debug('Socket.IO not initialized, skipping expense:updated emit');
    return;
  }

  const io = getIO();
  const event = createEvent<ExpenseUpdatedData>('expense:updated', tripId, {
    expenseId,
  }, userId);

  io.to(`trip:${tripId}`).emit('expense:updated', event);
  logger.debug('Emitted expense:updated event', { tripId, expenseId, userId });
}

/**
 * Emit when an expense is deleted
 */
export function emitExpenseDeleted(
  tripId: string,
  expenseId: string,
  userId: string
): void {
  if (!isSocketIOInitialized()) {
    logger.debug('Socket.IO not initialized, skipping expense:deleted emit');
    return;
  }

  const io = getIO();
  const event = createEvent<ExpenseDeletedData>('expense:deleted', tripId, {
    expenseId,
  }, userId);

  io.to(`trip:${tripId}`).emit('expense:deleted', event);
  logger.debug('Emitted expense:deleted event', { tripId, expenseId, userId });
}

/**
 * Emit when an expense split is updated (e.g., marked as paid)
 */
export function emitSplitUpdated(
  tripId: string,
  expenseId: string,
  splitId: string,
  isPaid: boolean,
  userId: string
): void {
  if (!isSocketIOInitialized()) {
    logger.debug('Socket.IO not initialized, skipping expense:split:updated emit');
    return;
  }

  const io = getIO();
  const event = createEvent<SplitUpdatedData>('expense:split:updated', tripId, {
    expenseId,
    splitId,
    isPaid,
  }, userId);

  io.to(`trip:${tripId}`).emit('expense:split:updated', event);
  logger.debug('Emitted expense:split:updated event', { tripId, expenseId, splitId, userId });
}
