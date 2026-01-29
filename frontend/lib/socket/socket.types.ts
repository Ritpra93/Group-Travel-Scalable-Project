/**
 * Socket.IO Event Types (Frontend)
 * TypeScript types matching backend socket events
 */

/**
 * Base socket event structure
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
 * Itinerary event data types
 */
export interface ItineraryItemCreatedData {
  itemId: string;
  title: string;
  type: string;
}

export interface ItineraryItemUpdatedData {
  itemId: string;
}

export interface ItineraryItemDeletedData {
  itemId: string;
}

/**
 * Server to client events
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
  'itinerary:created': (event: SocketEvent<ItineraryItemCreatedData>) => void;
  'itinerary:updated': (event: SocketEvent<ItineraryItemUpdatedData>) => void;
  'itinerary:deleted': (event: SocketEvent<ItineraryItemDeletedData>) => void;
  'trip:joined': (data: { tripId: string }) => void;
  'trip:left': (data: { tripId: string }) => void;
  'error': (data: { message: string }) => void;
}

/**
 * Client to server events
 */
export interface ClientToServerEvents {
  'trip:join': (tripId: string) => void;
  'trip:leave': (tripId: string) => void;
}
