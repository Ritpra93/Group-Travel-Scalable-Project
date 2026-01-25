/**
 * Polls Validation Schemas
 * Zod schemas for poll-related forms
 */

import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

export const POLL_TYPES = ['PLACE', 'ACTIVITY', 'DATE', 'CUSTOM'] as const;
export const POLL_STATUSES = ['ACTIVE', 'CLOSED', 'ARCHIVED'] as const;

export const POLL_TYPE_LABELS: Record<(typeof POLL_TYPES)[number], string> = {
  PLACE: 'Destination',
  ACTIVITY: 'Activity',
  DATE: 'Date',
  CUSTOM: 'Custom',
};

export const POLL_TYPE_DESCRIPTIONS: Record<(typeof POLL_TYPES)[number], string> = {
  PLACE: 'Vote on where to go',
  ACTIVITY: 'Vote on what to do',
  DATE: 'Vote on when to go',
  CUSTOM: 'Custom poll question',
};

// ============================================================================
// Sub-schemas
// ============================================================================

/**
 * Poll option input schema
 */
export const pollOptionSchema = z.object({
  label: z
    .string()
    .min(1, 'Option label is required')
    .max(200, 'Option label must not exceed 200 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
});

export type PollOptionInput = z.infer<typeof pollOptionSchema>;

// ============================================================================
// Create Poll Schema
// ============================================================================

export const createPollSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title must not exceed 200 characters')
      .trim(),
    description: z
      .string()
      .max(1000, 'Description must not exceed 1000 characters')
      .optional()
      .or(z.literal('')),
    type: z.enum(POLL_TYPES, {
      message: 'Please select a poll type',
    }),
    allowMultiple: z.boolean().default(false),
    maxVotes: z
      .number()
      .int('Max votes must be a whole number')
      .positive('Max votes must be positive')
      .optional()
      .nullable(),
    closesAt: z.string().optional().or(z.literal('')), // ISO date string, validated separately
    options: z
      .array(pollOptionSchema)
      .min(2, 'At least 2 options are required')
      .max(10, 'Maximum 10 options allowed'),
  })
  .refine(
    (data) => {
      // maxVotes only allowed if allowMultiple is true
      if (data.maxVotes && !data.allowMultiple) {
        return false;
      }
      return true;
    },
    {
      message: 'Max votes can only be set when "Allow multiple choices" is enabled',
      path: ['maxVotes'],
    }
  )
  .refine(
    (data) => {
      // closesAt must be in the future
      if (data.closesAt && data.closesAt.trim() !== '') {
        const closesAtDate = new Date(data.closesAt);
        if (closesAtDate <= new Date()) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Close date must be in the future',
      path: ['closesAt'],
    }
  );

export type CreatePollFormData = z.infer<typeof createPollSchema>;

// ============================================================================
// Update Poll Schema
// ============================================================================

export const updatePollSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional()
    .or(z.literal('')),
  closesAt: z.string().optional().or(z.literal('')),
});

export type UpdatePollFormData = z.infer<typeof updatePollSchema>;
