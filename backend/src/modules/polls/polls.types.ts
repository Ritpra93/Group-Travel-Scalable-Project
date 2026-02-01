import { z } from 'zod';
import type { PollType, PollStatus } from '../../config/enums';

// ============================================================================
// ENUMS
// ============================================================================

export const PollTypeEnum = z.enum(['PLACE', 'ACTIVITY', 'DATE', 'CUSTOM']);
export const PollStatusEnum = z.enum(['ACTIVE', 'CLOSED', 'ARCHIVED']);

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

/**
 * Schema for creating a poll option
 */
export const PollOptionInputSchema = z.object({
  label: z.string().min(1, 'Label is required').max(200, 'Label too long'),
  description: z.string().max(500, 'Description too long').optional(),
  metadata: z.record(z.unknown()).optional(), // Flexible JSON object
  displayOrder: z.number().int().min(0).optional(),
});

/**
 * Schema for creating a new poll
 */
export const CreatePollSchema = z
  .object({
    tripId: z.string().min(20, 'Invalid trip ID format'),
    title: z.string().min(3, 'Title too short').max(200, 'Title too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    type: PollTypeEnum.default('CUSTOM'),
    allowMultiple: z.boolean().default(false),
    maxVotes: z.number().int().positive('Max votes must be positive').optional(),
    closesAt: z.coerce.date().optional(),
    options: z
      .array(PollOptionInputSchema)
      .min(2, 'At least 2 options required')
      .max(10, 'Maximum 10 options allowed'),
  })
  .refine(
    (data) => {
      // maxVotes only allowed if allowMultiple is true
      if (data.maxVotes !== undefined && !data.allowMultiple) {
        return false;
      }
      return true;
    },
    {
      message: 'maxVotes can only be set when allowMultiple is true',
      path: ['maxVotes'],
    }
  )
  .refine(
    (data) => {
      // closesAt must be in the future
      if (data.closesAt && data.closesAt <= new Date()) {
        return false;
      }
      return true;
    },
    {
      message: 'Close date must be in the future',
      path: ['closesAt'],
    }
  );

/**
 * Schema for updating a poll
 */
export const UpdatePollSchema = z
  .object({
    title: z.string().min(3, 'Title too short').max(200, 'Title too long').optional(),
    description: z.string().max(1000, 'Description too long').optional(),
    closesAt: z.coerce.date().optional(),
    status: PollStatusEnum.optional(),
  })
  .refine(
    (data) => {
      // closesAt must be in the future if provided
      if (data.closesAt && data.closesAt <= new Date()) {
        return false;
      }
      return true;
    },
    {
      message: 'Close date must be in the future',
      path: ['closesAt'],
    }
  )
  .refine(
    (data) => {
      // Can't manually set status to ACTIVE (only CLOSED or ARCHIVED)
      if (data.status === 'ACTIVE') {
        return false;
      }
      return true;
    },
    {
      message: 'Cannot manually set status to ACTIVE. Use CLOSED or ARCHIVED only.',
      path: ['status'],
    }
  );

/**
 * Schema for casting a vote
 */
export const CastVoteSchema = z.object({
  optionId: z.string().min(20, 'Invalid option ID format'),
});

/**
 * Schema for changing a vote
 */
export const ChangeVoteSchema = z.object({
  oldOptionId: z.string().min(20, 'Invalid old option ID format'),
  newOptionId: z.string().min(20, 'Invalid new option ID format'),
});

/**
 * Pagination schema (reusable)
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema for listing polls with filters
 */
export const ListPollsQuerySchema = PaginationSchema.extend({
  status: PollStatusEnum.optional(),
  type: PollTypeEnum.optional(),
  isActive: z.coerce.boolean().optional(), // Quick filter for ACTIVE status
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PollOptionInput = z.infer<typeof PollOptionInputSchema>;
export type CreatePollInput = z.infer<typeof CreatePollSchema>;
export type UpdatePollInput = z.infer<typeof UpdatePollSchema>;
export type CastVoteInput = z.infer<typeof CastVoteSchema>;
export type ChangeVoteInput = z.infer<typeof ChangeVoteSchema>;
export type ListPollsQuery = z.infer<typeof ListPollsQuerySchema>;

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

/**
 * Poll option data structure
 */
export interface PollOptionData {
  id: string;
  pollId: string;
  label: string;
  description: string | null;
  metadata: unknown | null; // JSON field
  displayOrder: number;
}

/**
 * Poll option with vote count
 */
export interface PollOptionWithVotes extends PollOptionData {
  voteCount: number;
  hasVoted?: boolean; // Did current user vote for this option?
}

/**
 * Base poll data
 */
export interface PollData {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  type: PollType;
  status: PollStatus;
  allowMultiple: boolean;
  maxVotes: number | null;
  closesAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Full poll response with options and vote data
 */
export interface PollResponse extends PollData {
  options: PollOptionWithVotes[];
  totalVotes: number;
  userVotes?: string[]; // Option IDs user has voted for
  trip?: {
    id: string;
    name: string;
  };
}

/**
 * Poll results response
 */
export interface PollResultsResponse {
  pollId: string;
  totalVotes: number;
  options: PollOptionWithVotes[];
  status: PollStatus;
}

/**
 * Vote response
 */
export interface VoteResponse {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  createdAt: Date;
}

/**
 * Paginated polls response
 */
export interface PaginatedPollsResponse {
  data: PollResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
