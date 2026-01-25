/**
 * Itinerary Validation Schemas
 * Zod schemas for itinerary-related forms
 */

import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

export const ITINERARY_ITEM_TYPES = [
  'ACCOMMODATION',
  'TRANSPORT',
  'ACTIVITY',
  'MEAL',
  'CUSTOM',
] as const;

export const ITEM_TYPE_LABELS: Record<(typeof ITINERARY_ITEM_TYPES)[number], string> = {
  ACCOMMODATION: 'Accommodation',
  TRANSPORT: 'Transport',
  ACTIVITY: 'Activity',
  MEAL: 'Meal',
  CUSTOM: 'Other',
};

export const ITEM_TYPE_DESCRIPTIONS: Record<(typeof ITINERARY_ITEM_TYPES)[number], string> = {
  ACCOMMODATION: 'Hotel, Airbnb, hostel, etc.',
  TRANSPORT: 'Flight, train, car rental, etc.',
  ACTIVITY: 'Tour, attraction, experience, etc.',
  MEAL: 'Restaurant, cafe, food experience',
  CUSTOM: 'Anything else',
};

// ============================================================================
// Create Itinerary Item Schema
// ============================================================================

export const createItineraryItemSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must not exceed 200 characters')
      .trim(),
    description: z
      .string()
      .max(2000, 'Description must not exceed 2000 characters')
      .optional()
      .or(z.literal('')),
    type: z.enum(ITINERARY_ITEM_TYPES, {
      message: 'Please select an item type',
    }),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().optional().or(z.literal('')),
    location: z
      .string()
      .max(500, 'Location must not exceed 500 characters')
      .optional()
      .or(z.literal('')),
    cost: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === '' || val === undefined) return undefined;
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(num) ? undefined : num;
      }),
    url: z
      .string()
      .url('Please enter a valid URL')
      .max(1000, 'URL must not exceed 1000 characters')
      .optional()
      .or(z.literal('')),
    notes: z
      .string()
      .max(2000, 'Notes must not exceed 2000 characters')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.endTime && data.startTime) {
        return new Date(data.endTime) > new Date(data.startTime);
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

export type CreateItineraryItemFormData = z.infer<typeof createItineraryItemSchema>;

// ============================================================================
// Update Itinerary Item Schema
// ============================================================================

export const updateItineraryItemSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must not exceed 200 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(2000, 'Description must not exceed 2000 characters')
      .optional()
      .or(z.literal('')),
    type: z.enum(ITINERARY_ITEM_TYPES).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional().or(z.literal('')),
    location: z
      .string()
      .max(500, 'Location must not exceed 500 characters')
      .optional()
      .or(z.literal('')),
    cost: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === '' || val === undefined) return undefined;
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(num) ? undefined : num;
      }),
    url: z
      .string()
      .url('Please enter a valid URL')
      .max(1000, 'URL must not exceed 1000 characters')
      .optional()
      .or(z.literal('')),
    notes: z
      .string()
      .max(2000, 'Notes must not exceed 2000 characters')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.endTime && data.startTime) {
        return new Date(data.endTime) > new Date(data.startTime);
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

export type UpdateItineraryItemFormData = z.infer<typeof updateItineraryItemSchema>;
