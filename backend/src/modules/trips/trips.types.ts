import { z } from 'zod';

/**
 * Trips Module - Type Definitions
 *
 * This file contains Zod schemas and TypeScript types for trip operations.
 *
 * ## Business Rules:
 * - Only group members can create trips
 * - MEMBER or higher can update trip details
 * - ADMIN or higher can delete trips
 * - Trips belong to groups and cascade delete with group
 * - Default status is PLANNING
 * - Budget tracking supports multiple currencies (ISO 4217)
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Trip status enum matching Prisma schema
 */
export const TripStatusEnum = z.enum([
  'PLANNING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

export type TripStatus = z.infer<typeof TripStatusEnum>;

// ============================================================================
// Zod Validation Schemas
// ============================================================================

/**
 * Schema for creating a new trip
 */
export const CreateTripSchema = z
  .object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name cannot exceed 100 characters'),
    groupId: z.string().min(20, 'Invalid group ID format'),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    destination: z.string().max(200, 'Destination cannot exceed 200 characters').optional(),
    imageUrl: z.string().url('Must be a valid URL').optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    totalBudget: z.number().positive('Budget must be positive').multipleOf(0.01, 'Budget can have at most 2 decimal places').optional(),
    currency: z.string().length(3, 'Currency must be ISO 4217 code (3 letters)').default('USD'),
  })
  .refine(
    (data) => {
      // If both dates are provided, endDate must be after startDate
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

/**
 * Schema for updating an existing trip
 */
export const UpdateTripSchema = z
  .object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().max(1000).optional().nullable(),
    destination: z.string().max(200).optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    totalBudget: z.number().positive().multipleOf(0.01).optional().nullable(),
    currency: z.string().length(3).optional(),
    status: TripStatusEnum.optional(),
  })
  .refine(
    (data) => {
      // If both dates are provided, endDate must be after startDate
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

/**
 * Schema for updating trip status only
 */
export const UpdateTripStatusSchema = z.object({
  status: TripStatusEnum,
});

/**
 * Pagination schema (reusable across modules)
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema for listing trips with filters
 */
export const ListTripsQuerySchema = PaginationSchema.extend({
  groupId: z.string().min(20).optional(),
  status: TripStatusEnum.optional(),
  search: z.string().optional(), // Search in name/destination
  startDateAfter: z.coerce.date().optional(), // Filter trips starting after this date
  endDateBefore: z.coerce.date().optional(), // Filter trips ending before this date
});

// ============================================================================
// TypeScript Types
// ============================================================================

/**
 * Input type for creating a trip
 */
export type CreateTripInput = z.infer<typeof CreateTripSchema>;

/**
 * Input type for updating a trip
 */
export type UpdateTripInput = z.infer<typeof UpdateTripSchema>;

/**
 * Input type for updating trip status
 */
export type UpdateTripStatusInput = z.infer<typeof UpdateTripStatusSchema>;

/**
 * Input type for pagination
 */
export type PaginationInput = z.infer<typeof PaginationSchema>;

/**
 * Input type for listing trips with query params
 */
export type ListTripsQuery = z.infer<typeof ListTripsQuerySchema>;

/**
 * Trip data returned from database
 */
export interface TripData {
  id: string;
  groupId: string;
  name: string;
  description: string | null;
  destination: string | null;
  imageUrl: string | null;
  startDate: Date | null;
  endDate: Date | null;
  totalBudget: string | null; // Decimal as string from Kysely
  currency: string;
  status: TripStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Trip response with computed fields
 */
export interface TripResponse extends TripData {
  // Optional group info
  group?: {
    id: string;
    name: string;
  };
  // Optional counts
  pollCount?: number;
  expenseCount?: number;
  itineraryItemCount?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedTripsResponse {
  data: TripResponse[];
  pagination: PaginationMeta;
}
