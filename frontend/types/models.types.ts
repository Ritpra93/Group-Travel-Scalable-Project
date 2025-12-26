/**
 * TypeScript types matching backend database models
 * These types represent the data structures returned from the API
 */

// ============================================================================
// User & Authentication
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  timezone: string | null;
  bio: string | null;
  interests: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  emailVerifiedAt: string | null;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  lastUsedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

// ============================================================================
// Group & Membership
// ============================================================================

export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  creatorId: string;
  isPrivate: boolean;
  settings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
  invitedBy: string | null;
  user?: User;
}

// ============================================================================
// Trip
// ============================================================================

export type TripStatus = 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Trip {
  id: string;
  groupId: string;
  name: string;
  description: string | null;
  destination: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  totalBudget: string | null; // Decimal as string
  currency: string;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  group?: Group;
}

// ============================================================================
// Poll
// ============================================================================

export type PollType = 'PLACE' | 'ACTIVITY' | 'DATE' | 'CUSTOM';
export type PollStatus = 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export interface Poll {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  type: PollType;
  status: PollStatus;
  allowMultiple: boolean;
  maxVotes: number | null;
  closesAt: string | null;
  createdAt: string;
  updatedAt: string;
  options: PollOption[];
  votes?: Vote[];
}

export interface PollOption {
  id: string;
  pollId: string;
  label: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  displayOrder: number;
  votes?: Vote[];
}

export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  createdAt: string;
  user?: User;
}

export interface PollResults {
  pollId: string;
  totalVotes: number;
  options: {
    optionId: string;
    label: string;
    voteCount: number;
    percentage: number;
  }[];
}

// ============================================================================
// Expense
// ============================================================================

export type ExpenseCategory = 'ACCOMMODATION' | 'TRANSPORT' | 'FOOD' | 'ACTIVITIES' | 'SHOPPING' | 'OTHER';
export type SplitType = 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  category: ExpenseCategory;
  amount: string; // Decimal as string
  currency: string;
  paidBy: string;
  paidAt: string;
  receiptUrl: string | null;
  createdAt: string;
  updatedAt: string;
  payer?: User;
  splits: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  splitType: SplitType;
  amount: string; // Decimal as string
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  user?: User;
}

export interface ExpenseBalance {
  userId: string;
  userName: string;
  totalPaid: string; // Decimal as string
  totalOwed: string; // Decimal as string
  balance: string; // Decimal as string (positive = owed to them, negative = they owe)
}

// ============================================================================
// Itinerary
// ============================================================================

export type ItineraryItemType = 'ACCOMMODATION' | 'TRANSPORT' | 'ACTIVITY' | 'MEAL' | 'CUSTOM';

export interface ItineraryItem {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  type: ItineraryItemType;
  startTime: string;
  endTime: string | null;
  location: string | null;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  cost: string | null; // Decimal as string
  url: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: User;
}

// ============================================================================
// Invitation
// ============================================================================

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface Invitation {
  id: string;
  groupId: string;
  email: string;
  token: string;
  sentBy: string;
  recipientId: string | null;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  respondedAt: string | null;
  group?: Group;
  sender?: User;
  recipient?: User;
}

// ============================================================================
// Activity Log
// ============================================================================

export type ActivityType =
  | 'GROUP_CREATED'
  | 'MEMBER_JOINED'
  | 'TRIP_CREATED'
  | 'TRIP_UPDATED'
  | 'TRIP_DELETED'
  | 'TRIP_STATUS_CHANGED'
  | 'POLL_CREATED'
  | 'VOTE_CAST'
  | 'EXPENSE_ADDED'
  | 'EXPENSE_UPDATED'
  | 'ITINERARY_ADDED'
  | 'ITINERARY_UPDATED';

export interface ActivityLog {
  id: string;
  tripId: string | null;
  userId: string;
  type: ActivityType;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: User;
}
