import { z } from 'zod';
import { GroupRole } from '@prisma/client';

/**
 * Create Group Schema
 *
 * Validates input for creating a new group
 */
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(3, 'Group name must be at least 3 characters')
    .max(100, 'Group name must not exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional(),
  imageUrl: z
    .string()
    .url('Image URL must be a valid URL')
    .optional(),
  isPrivate: z
    .boolean()
    .optional()
    .default(true),
  settings: z
    .record(z.unknown())  // JSON object with any key-value pairs
    .optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

/**
 * Update Group Schema
 *
 * Validates input for updating an existing group
 * All fields are optional (partial update)
 */
export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(3, 'Group name must be at least 3 characters')
    .max(100, 'Group name must not exceed 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .nullable()
    .optional(),
  imageUrl: z
    .string()
    .url('Image URL must be a valid URL')
    .nullable()
    .optional(),
  isPrivate: z
    .boolean()
    .optional(),
  settings: z
    .record(z.unknown())
    .nullable()
    .optional(),
});

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

/**
 * Group Role Schema
 *
 * Validates group member role assignments
 */
export const groupRoleSchema = z.nativeEnum(GroupRole, {
  errorMap: () => ({ message: 'Invalid role. Must be OWNER, ADMIN, MEMBER, or VIEWER' }),
});

/**
 * Update Member Role Schema
 *
 * Validates input for changing a group member's role
 */
export const updateMemberRoleSchema = z.object({
  role: groupRoleSchema,
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

/**
 * Pagination Schema
 *
 * Standard pagination parameters for list endpoints
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform(Number)
    .pipe(z.number().int().positive().max(100)),
  sortBy: z
    .string()
    .optional()
    .default('createdAt'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Group Response Type
 *
 * Shape of group data returned from the API
 */
export interface GroupResponse {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount?: number;
  userRole?: GroupRole;
}

/**
 * Group Member Response Type
 *
 * Shape of group member data returned from the API
 */
export interface GroupMemberResponse {
  id: string;
  userId: string;
  role: GroupRole;
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

/**
 * Paginated Response Type
 *
 * Generic paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Group List Query Schema
 *
 * Validates query parameters for listing groups
 */
export const groupListQuerySchema = paginationSchema.extend({
  search: z
    .string()
    .trim()
    .optional(),
  isPrivate: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      return val === 'true';
    })
    .pipe(z.boolean().optional()),
});

export type GroupListQuery = z.infer<typeof groupListQuerySchema>;
