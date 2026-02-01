/**
 * Test Fixtures
 *
 * Sample data for testing. These fixtures provide consistent test data
 * that matches the database schema types.
 */

import type {
  GroupRole,
  TripStatus,
  PollType,
  PollStatus,
  ItineraryItemType,
  ExpenseCategory,
  SplitType,
  InvitationStatus,
} from '../../config/enums';

// ============================================================================
// Users
// ============================================================================

export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: '$2b$10$hashedpassword',
  name: 'Test User',
  avatarUrl: null,
  timezone: 'UTC',
  bio: 'Test bio',
  interests: ['travel', 'food'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  lastLoginAt: new Date('2024-01-15'),
  emailVerifiedAt: new Date('2024-01-01'),
};

export const mockUser2 = {
  ...mockUser,
  id: 'user-2',
  email: 'test2@example.com',
  name: 'Test User 2',
};

export const mockUser3 = {
  ...mockUser,
  id: 'user-3',
  email: 'test3@example.com',
  name: 'Test User 3',
};

// ============================================================================
// Sessions
// ============================================================================

export const mockSession = {
  id: 'session-1',
  userId: mockUser.id,
  token: 'refresh-token-abc123',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  createdAt: new Date(),
  lastUsedAt: new Date(),
  ipAddress: '127.0.0.1',
  userAgent: 'Jest Test Agent',
};

// ============================================================================
// Groups
// ============================================================================

export const mockGroup = {
  id: 'group-1',
  name: 'Test Group',
  description: 'A test group for testing',
  imageUrl: null,
  creatorId: mockUser.id,
  isPrivate: true,
  settings: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockGroupMember = {
  id: 'gm-1',
  groupId: mockGroup.id,
  userId: mockUser.id,
  role: 'OWNER' as GroupRole,
  joinedAt: new Date('2024-01-01'),
  invitedBy: null,
};

export const mockGroupMember2 = {
  ...mockGroupMember,
  id: 'gm-2',
  userId: mockUser2.id,
  role: 'MEMBER' as GroupRole,
  invitedBy: mockUser.id,
};

// ============================================================================
// Trips
// ============================================================================

export const mockTrip = {
  id: 'trip-1',
  groupId: mockGroup.id,
  name: 'Test Trip',
  description: 'A test trip',
  destination: 'Paris, France',
  imageUrl: null,
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-07'),
  totalBudget: '5000.00',
  currency: 'USD',
  status: 'PLANNING' as TripStatus,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

// ============================================================================
// Polls
// ============================================================================

export const mockPoll = {
  id: 'poll-1',
  tripId: mockTrip.id,
  title: 'Where should we stay?',
  description: 'Vote for your preferred accommodation',
  type: 'PLACE' as PollType,
  status: 'ACTIVE' as PollStatus,
  allowMultiple: false,
  maxVotes: null,
  closesAt: new Date('2024-05-01'),
  createdAt: new Date('2024-01-20'),
  updatedAt: new Date('2024-01-20'),
};

export const mockPollOption1 = {
  id: 'option-1',
  pollId: mockPoll.id,
  label: 'Hotel A',
  description: 'Nice hotel in city center',
  metadata: null,
  displayOrder: 0,
};

export const mockPollOption2 = {
  id: 'option-2',
  pollId: mockPoll.id,
  label: 'Hotel B',
  description: 'Budget hotel near airport',
  metadata: null,
  displayOrder: 1,
};

export const mockVote = {
  id: 'vote-1',
  pollId: mockPoll.id,
  optionId: mockPollOption1.id,
  userId: mockUser.id,
  createdAt: new Date('2024-01-21'),
};

// ============================================================================
// Expenses
// ============================================================================

export const mockExpense = {
  id: 'expense-1',
  tripId: mockTrip.id,
  title: 'Dinner at Restaurant',
  description: 'Group dinner on day 1',
  category: 'FOOD' as ExpenseCategory,
  amount: '150.00',
  currency: 'USD',
  paidBy: mockUser.id,
  paidAt: new Date('2024-06-01'),
  receiptUrl: null,
  createdAt: new Date('2024-06-01'),
  updatedAt: new Date('2024-06-01'),
};

export const mockExpenseSplit = {
  id: 'split-1',
  expenseId: mockExpense.id,
  userId: mockUser.id,
  splitType: 'EQUAL' as SplitType,
  amount: '50.00',
  isPaid: true,
  createdAt: new Date('2024-06-01'),
  updatedAt: new Date('2024-06-01'),
  paidAt: new Date('2024-06-01'),
};

export const mockExpenseSplit2 = {
  ...mockExpenseSplit,
  id: 'split-2',
  userId: mockUser2.id,
  isPaid: false,
  paidAt: null,
};

// ============================================================================
// Itinerary
// ============================================================================

export const mockItineraryItem = {
  id: 'itinerary-1',
  tripId: mockTrip.id,
  title: 'Visit Eiffel Tower',
  description: 'Morning visit to the Eiffel Tower',
  type: 'ACTIVITY' as ItineraryItemType,
  startTime: new Date('2024-06-01T09:00:00'),
  endTime: new Date('2024-06-01T12:00:00'),
  location: 'Eiffel Tower, Paris',
  coordinates: { lat: 48.8584, lng: 2.2945 },
  cost: '25.00',
  url: 'https://www.toureiffel.paris',
  notes: 'Book tickets in advance',
  createdBy: mockUser.id,
  createdAt: new Date('2024-01-25'),
  updatedAt: new Date('2024-01-25'),
};

// ============================================================================
// Invitations
// ============================================================================

export const mockInvitation = {
  id: 'invitation-1',
  groupId: mockGroup.id,
  email: 'newuser@example.com',
  token: 'invite-token-xyz789',
  sentBy: mockUser.id,
  recipientId: null,
  status: 'PENDING' as InvitationStatus,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date('2024-01-10'),
  respondedAt: null,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a user with custom overrides
 */
export function createMockUser(overrides: Partial<typeof mockUser> = {}) {
  return { ...mockUser, ...overrides };
}

/**
 * Create a group with custom overrides
 */
export function createMockGroup(overrides: Partial<typeof mockGroup> = {}) {
  return { ...mockGroup, ...overrides };
}

/**
 * Create a trip with custom overrides
 */
export function createMockTrip(overrides: Partial<typeof mockTrip> = {}) {
  return { ...mockTrip, ...overrides };
}

/**
 * Create an expense with custom overrides
 */
export function createMockExpense(overrides: Partial<typeof mockExpense> = {}) {
  return { ...mockExpense, ...overrides };
}

/**
 * Create a poll with custom overrides
 */
export function createMockPoll(overrides: Partial<typeof mockPoll> = {}) {
  return { ...mockPoll, ...overrides };
}
