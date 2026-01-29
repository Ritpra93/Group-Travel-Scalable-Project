/**
 * Users Module Types
 * Zod schemas and TypeScript types for user operations
 */

import { z } from 'zod';

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * Schema for updating user interests
 */
export const UpdateInterestsSchema = z.object({
  interests: z
    .array(z.string().min(1, 'Interest cannot be empty').max(50, 'Interest too long'))
    .min(0)
    .max(20, 'Maximum 20 interests allowed'),
});

export type UpdateInterestsInput = z.infer<typeof UpdateInterestsSchema>;

/**
 * Schema for updating user profile
 */
export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name too short').max(100, 'Name too long').optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  timezone: z.string().max(50).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  interests: z
    .array(z.string().min(1).max(50))
    .max(20, 'Maximum 20 interests allowed')
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// ============================================================================
// Response Types
// ============================================================================

/**
 * User profile response
 */
export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  timezone: string | null;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User summary for group member views
 */
export interface UserSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  interests: string[];
}

/**
 * Interest overlap result
 */
export interface InterestOverlap {
  userId: string;
  userName: string;
  userAvatar: string | null;
  interests: string[];
  commonInterests: string[];
  overlapScore: number; // 0-100 percentage
}

/**
 * Group interest analysis
 */
export interface GroupInterestAnalysis {
  members: InterestOverlap[];
  topInterests: { interest: string; count: number }[];
  totalMembers: number;
  averageOverlap: number;
}

// ============================================================================
// Constants Export
// ============================================================================

export { INTEREST_CATEGORIES, INTEREST_GROUPS } from '../../common/constants/interests';
export type { InterestCategory, InterestGroup } from '../../common/constants/interests';
