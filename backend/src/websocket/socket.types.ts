/**
 * Socket.IO TypeScript Types
 * Defines event payloads and socket interfaces
 */

import { Socket } from 'socket.io';

/**
 * Authenticated socket with user info attached
 */
export interface AuthenticatedSocket extends Socket {
  userId: string;
  userEmail: string;
}

/**
 * Base event payload structure
 */
export interface SocketEvent<T = unknown> {
  type: string;
  tripId: string;
  data: T;
  userId: string;
  timestamp: string;
}

/**
 * Poll event data types
 */
export interface PollVotedData {
  pollId: string;
  optionId: string;
  action: 'cast' | 'change' | 'remove';
}

export interface PollCreatedData {
  pollId: string;
  title: string;
}

export interface PollClosedData {
  pollId: string;
}

export interface PollDeletedData {
  pollId: string;
}

/**
 * Expense event data types
 */
export interface ExpenseCreatedData {
  expenseId: string;
  title: string;
  amount: number;
}

export interface ExpenseUpdatedData {
  expenseId: string;
}

export interface ExpenseDeletedData {
  expenseId: string;
}

export interface SplitUpdatedData {
  expenseId: string;
  splitId: string;
  isPaid: boolean;
}

/**
 * Server to client event types
 */
export interface ServerToClientEvents {
  'poll:voted': (event: SocketEvent<PollVotedData>) => void;
  'poll:created': (event: SocketEvent<PollCreatedData>) => void;
  'poll:closed': (event: SocketEvent<PollClosedData>) => void;
  'poll:deleted': (event: SocketEvent<PollDeletedData>) => void;
  'expense:created': (event: SocketEvent<ExpenseCreatedData>) => void;
  'expense:updated': (event: SocketEvent<ExpenseUpdatedData>) => void;
  'expense:deleted': (event: SocketEvent<ExpenseDeletedData>) => void;
  'expense:split:updated': (event: SocketEvent<SplitUpdatedData>) => void;
  'trip:joined': (data: { tripId: string }) => void;
  'trip:left': (data: { tripId: string }) => void;
  'error': (data: { message: string }) => void;
}

/**
 * Client to server event types
 */
export interface ClientToServerEvents {
  'trip:join': (tripId: string) => void;
  'trip:leave': (tripId: string) => void;
}

/**
 * Inter-server event types (for Redis adapter)
 */
export interface InterServerEvents {
  ping: () => void;
}

/**
 * Socket data attached to each connection
 */
export interface SocketData {
  userId: string;
  userEmail: string;
}
