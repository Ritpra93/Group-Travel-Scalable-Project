/**
 * API request and response types
 * These types represent the data structures for API communication
 */

// ============================================================================
// Generic API Response
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  pagination?: PaginationMeta;
  error?: ApiError;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// ============================================================================
// Authentication DTOs
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

// ============================================================================
// Group DTOs
// ============================================================================

export interface CreateGroupRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  isPrivate?: boolean;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  imageUrl?: string;
  isPrivate?: boolean;
  settings?: Record<string, unknown>;
}

export interface UpdateMemberRoleRequest {
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

// ============================================================================
// Trip DTOs
// ============================================================================

export interface CreateTripRequest {
  groupId: string;
  name: string;
  description?: string;
  destination: string;
  imageUrl?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  totalBudget?: number;
  currency?: string;
}

export interface UpdateTripRequest {
  name?: string;
  description?: string;
  destination?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  totalBudget?: number;
  currency?: string;
}

export interface UpdateTripStatusRequest {
  status: 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface GetTripsParams {
  page?: number;
  limit?: number;
  status?: string;
  groupId?: string;
}

// ============================================================================
// Expense DTOs
// ============================================================================

export interface CreateExpenseRequest {
  tripId: string;
  title: string;
  description?: string;
  category: 'ACCOMMODATION' | 'TRANSPORT' | 'FOOD' | 'ACTIVITIES' | 'SHOPPING' | 'OTHER';
  amount: number;
  currency: string;
  paidBy: string;
  paidAt: string; // ISO date string
  receiptUrl?: string;
  splits: {
    userId: string;
    splitType: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
    amount?: number; // Required for CUSTOM and PERCENTAGE
  }[];
}

export interface UpdateExpenseRequest {
  title?: string;
  description?: string;
  category?: 'ACCOMMODATION' | 'TRANSPORT' | 'FOOD' | 'ACTIVITIES' | 'SHOPPING' | 'OTHER';
  amount?: number;
  currency?: string;
  paidBy?: string;
  paidAt?: string;
  receiptUrl?: string;
}

export interface UpdateExpenseSplitRequest {
  isPaid: boolean;
}

// ============================================================================
// Poll DTOs
// ============================================================================

export interface CreatePollRequest {
  tripId: string;
  title: string;
  description?: string;
  type: 'PLACE' | 'ACTIVITY' | 'DATE' | 'CUSTOM';
  allowMultiple: boolean;
  maxVotes?: number;
  closesAt?: string; // ISO date string
  options: {
    label: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }[];
}

export interface UpdatePollRequest {
  title?: string;
  description?: string;
  allowMultiple?: boolean;
  maxVotes?: number;
  closesAt?: string;
}

export interface VoteRequest {
  optionId: string;
}

// ============================================================================
// Itinerary DTOs
// ============================================================================

export interface CreateItineraryItemRequest {
  title: string;
  description?: string;
  type: 'ACCOMMODATION' | 'TRANSPORT' | 'ACTIVITY' | 'MEAL' | 'CUSTOM';
  startTime: string; // ISO date string
  endTime?: string; // ISO date string
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  cost?: number;
  url?: string;
  notes?: string;
}

export interface UpdateItineraryItemRequest {
  title?: string;
  description?: string;
  type?: 'ACCOMMODATION' | 'TRANSPORT' | 'ACTIVITY' | 'MEAL' | 'CUSTOM';
  startTime?: string;
  endTime?: string;
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  cost?: number;
  url?: string;
  notes?: string;
}

// ============================================================================
// Invitation DTOs
// ============================================================================

export interface CreateInvitationRequest {
  groupId: string;
  email: string;
}

export interface RespondToInvitationRequest {
  token: string;
  accept: boolean;
}

export interface GetInvitationsParams {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
}

// ============================================================================
// Paginated Response
// ============================================================================

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ============================================================================
// Re-exports for convenience (DTOs)
// ============================================================================

// Groups
export type CreateGroupDTO = CreateGroupRequest;
export type UpdateGroupDTO = UpdateGroupRequest;
export type AddMemberDTO = { email: string };
export type UpdateMemberRoleDTO = UpdateMemberRoleRequest;

// Trips
export type CreateTripDTO = CreateTripRequest;
export type UpdateTripDTO = UpdateTripRequest;

// Polls
export type CreatePollDTO = CreatePollRequest;
export type UpdatePollDTO = UpdatePollRequest;
export type VoteDTO = VoteRequest;

// Itinerary
export type CreateItineraryItemDTO = CreateItineraryItemRequest;
export type UpdateItineraryItemDTO = UpdateItineraryItemRequest;

// Expenses
export type CreateExpenseDTO = CreateExpenseRequest;
export type UpdateExpenseDTO = UpdateExpenseRequest;

// Re-export model types
export type { Group, GroupMember, Trip, Poll, PollOption, Vote, Expense, ExpenseSplit, ItineraryItem } from './models.types';
