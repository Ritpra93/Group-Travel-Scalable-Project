/**
 * Groups Validation Schemas
 * Zod schemas for group-related forms
 */

import { z } from 'zod';
import { GroupRole } from '@/types/models.types';

// ============================================================================
// Group Schemas
// ============================================================================

/**
 * Create Group Schema
 */
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'Group name must be at least 2 characters')
    .max(100, 'Group name must not exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

/**
 * Update Group Schema
 */
export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'Group name must be at least 2 characters')
    .max(100, 'Group name must not exceed 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

// ============================================================================
// Member Schemas
// ============================================================================

/**
 * Add Member Schema
 */
export const addMemberSchema = z.object({
  userId: z.string().uuid('Must be a valid user ID'),
  role: z.nativeEnum(GroupRole, {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
});

/**
 * Update Member Role Schema
 */
export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(GroupRole, {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
});

// ============================================================================
// Type Inference
// ============================================================================

export type CreateGroupFormData = z.infer<typeof createGroupSchema>;
export type UpdateGroupFormData = z.infer<typeof updateGroupSchema>;
export type AddMemberFormData = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleFormData = z.infer<typeof updateMemberRoleSchema>;
