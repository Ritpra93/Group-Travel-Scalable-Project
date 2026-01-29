import { z } from 'zod';
import type { ItineraryItemType as DBItineraryItemType } from '../../config/database.types';

// ============================================================================
// ENUMS
// ============================================================================

export const ItineraryItemTypeEnum = z.enum([
  'ACCOMMODATION',
  'TRANSPORT',
  'ACTIVITY',
  'MEAL',
  'CUSTOM',
]);

export type ItineraryItemType = z.infer<typeof ItineraryItemTypeEnum>;

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

/**
 * Coordinates schema for geographic locations
 * lat: -90 to 90 (latitude)
 * lng: -180 to 180 (longitude)
 */
const CoordinatesSchema = z.object({
  lat: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  lng: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
});

export type Coordinates = z.infer<typeof CoordinatesSchema>;

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

/**
 * Schema for creating a new itinerary item
 * POST /api/v1/trips/:tripId/itinerary
 */
export const CreateItineraryItemSchema = z
  .object({
    tripId: z.string().min(20, 'Invalid trip ID'),
    title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
    description: z.string().max(2000, 'Description must be at most 2000 characters').optional(),
    type: ItineraryItemTypeEnum,

    // Time & Location
    startTime: z.coerce.date({ required_error: 'Start time is required' }),
    endTime: z.coerce.date().optional(),
    location: z.string().max(500, 'Location must be at most 500 characters').optional(),
    coordinates: CoordinatesSchema.optional(),

    // Metadata
    cost: z
      .number()
      .positive('Cost must be positive')
      .multipleOf(0.01, 'Cost can have at most 2 decimal places')
      .optional(),
    url: z.string().url('Invalid URL').max(1000, 'URL must be at most 1000 characters').optional(),
    notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
  })
  .refine(
    (data) => {
      // Validate that endTime is after startTime
      if (data.endTime && data.startTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

export type CreateItineraryItemInput = z.infer<typeof CreateItineraryItemSchema>;

/**
 * Schema for updating an existing itinerary item
 * PUT /api/v1/trips/:tripId/itinerary/:itemId
 */
export const UpdateItineraryItemSchema = z
  .object({
    title: z.string().min(1, 'Title cannot be empty').max(200, 'Title must be at most 200 characters').optional(),
    description: z.string().max(2000, 'Description must be at most 2000 characters').optional(),
    type: ItineraryItemTypeEnum.optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    location: z.string().max(500, 'Location must be at most 500 characters').optional(),
    coordinates: CoordinatesSchema.optional(),
    cost: z
      .number()
      .positive('Cost must be positive')
      .multipleOf(0.01, 'Cost can have at most 2 decimal places')
      .optional(),
    url: z.string().url('Invalid URL').max(1000, 'URL must be at most 1000 characters').optional(),
    notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
    // Optimistic locking: client sends their version of updatedAt
    clientUpdatedAt: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      // Only validate if both are being updated
      if (data.endTime && data.startTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

export type UpdateItineraryItemInput = z.infer<typeof UpdateItineraryItemSchema>;

/**
 * Pagination schema (reusable)
 */
const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
});

/**
 * Schema for listing itinerary items with filters
 * GET /api/v1/trips/:tripId/itinerary
 */
export const ListItineraryItemsQuerySchema = PaginationSchema.extend({
  type: ItineraryItemTypeEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(['startTime', 'createdAt', 'type']).default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type ListItineraryItemsQuery = z.infer<typeof ListItineraryItemsQuerySchema>;

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

/**
 * Base itinerary item data from database
 */
export interface ItineraryItemData {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  type: ItineraryItemType;
  startTime: Date;
  endTime: Date | null;
  location: string | null;
  coordinates: Coordinates | null;
  cost: string | null; // Decimal as string from database
  url: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Full itinerary item response with related data
 */
export interface ItineraryItemResponse extends ItineraryItemData {
  creator: {
    id: string;
    name: string;
    email: string;
  };
  trip?: {
    id: string;
    name: string;
  };
}

/**
 * Paginated itinerary items response
 */
export interface PaginatedItineraryResponse {
  data: ItineraryItemResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
