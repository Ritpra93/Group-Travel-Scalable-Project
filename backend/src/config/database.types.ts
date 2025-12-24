/**
 * Kysely Database Types
 *
 * Generated from Prisma schema for use with Kysely
 * When migrating back to Prisma, delete this file
 */

import type { ColumnType } from 'kysely';

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type TripStatus = 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PollType = 'PLACE' | 'ACTIVITY' | 'DATE' | 'CUSTOM';
export type PollStatus = 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type ItineraryItemType = 'ACCOMMODATION' | 'TRANSPORT' | 'ACTIVITY' | 'MEAL' | 'CUSTOM';
export type ExpenseCategory = 'ACCOMMODATION' | 'TRANSPORT' | 'FOOD' | 'ACTIVITIES' | 'SHOPPING' | 'OTHER';
export type SplitType = 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type ActivityType =
  | 'GROUP_CREATED'
  | 'MEMBER_JOINED'
  | 'MEMBER_LEFT'
  | 'TRIP_CREATED'
  | 'TRIP_UPDATED'
  | 'POLL_CREATED'
  | 'VOTE_CAST'
  | 'EXPENSE_ADDED'
  | 'EXPENSE_UPDATED'
  | 'ITINERARY_ADDED'
  | 'ITINERARY_UPDATED';

export interface UsersTable {
  id: Generated<string>;
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl: string | null;
  timezone: Generated<string>;
  bio: string | null;
  interests: string[];
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp | null;
  emailVerifiedAt: Timestamp | null;
}

export interface SessionsTable {
  id: Generated<string>;
  userId: string;
  token: string;
  expiresAt: Timestamp;
  createdAt: Generated<Timestamp>;
  lastUsedAt: Generated<Timestamp>;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface GroupsTable {
  id: Generated<string>;
  name: string;
  description: string | null;
  imageUrl: string | null;
  creatorId: string;
  isPrivate: Generated<boolean>;
  settings: unknown | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
}

export interface GroupMembersTable {
  id: Generated<string>;
  groupId: string;
  userId: string;
  role: Generated<GroupRole>;
  joinedAt: Generated<Timestamp>;
  invitedBy: string | null;
}

export interface TripsTable {
  id: Generated<string>;
  groupId: string;
  name: string;
  description: string | null;
  destination: string | null;
  imageUrl: string | null;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  totalBudget: string | null;
  currency: Generated<string>;
  status: Generated<TripStatus>;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
}

export interface PollsTable {
  id: Generated<string>;
  tripId: string;
  title: string;
  description: string | null;
  type: PollType;
  status: Generated<PollStatus>;
  allowMultiple: Generated<boolean>;
  maxVotes: number | null;
  closesAt: Timestamp | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
}

export interface PollOptionsTable {
  id: Generated<string>;
  pollId: string;
  label: string;
  description: string | null;
  metadata: unknown | null;
  displayOrder: Generated<number>;
}

export interface VotesTable {
  id: Generated<string>;
  pollId: string;
  optionId: string;
  userId: string;
  createdAt: Generated<Timestamp>;
}

export interface ItineraryItemsTable {
  id: Generated<string>;
  tripId: string;
  title: string;
  description: string | null;
  type: ItineraryItemType;
  startTime: Timestamp;
  endTime: Timestamp | null;
  location: string | null;
  coordinates: unknown | null;
  cost: string | null;
  url: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
}

export interface ExpensesTable {
  id: Generated<string>;
  tripId: string;
  title: string;
  description: string | null;
  category: ExpenseCategory;
  amount: string;
  currency: Generated<string>;
  paidBy: string;
  paidAt: Generated<Timestamp>;
  receiptUrl: string | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
}

export interface ExpenseSplitsTable {
  id: Generated<string>;
  expenseId: string;
  userId: string;
  splitType: Generated<SplitType>;
  amount: string;
  isPaid: Generated<boolean>;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
  paidAt: Timestamp | null;
}

export interface InvitationsTable {
  id: Generated<string>;
  groupId: string;
  email: string;
  token: string;
  sentBy: string;
  recipientId: string | null;
  status: Generated<InvitationStatus>;
  expiresAt: Timestamp;
  createdAt: Generated<Timestamp>;
  respondedAt: Timestamp | null;
}

export interface ActivityLogsTable {
  id: Generated<string>;
  tripId: string | null;
  userId: string;
  type: ActivityType;
  metadata: unknown | null;
  createdAt: Generated<Timestamp>;
}

export interface DB {
  users: UsersTable;
  sessions: SessionsTable;
  groups: GroupsTable;
  group_members: GroupMembersTable;
  trips: TripsTable;
  polls: PollsTable;
  poll_options: PollOptionsTable;
  votes: VotesTable;
  itinerary_items: ItineraryItemsTable;
  expenses: ExpensesTable;
  expense_splits: ExpenseSplitsTable;
  invitations: InvitationsTable;
  activity_logs: ActivityLogsTable;
}
