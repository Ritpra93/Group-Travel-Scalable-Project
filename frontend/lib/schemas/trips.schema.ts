/**
 * Trips Validation Schemas
 * Zod schemas for trip-related forms
 */

import { z } from 'zod';

// ============================================================================
// Trip Schemas
// ============================================================================

/**
 * Create Trip Schema
 */
export const createTripSchema = z
  .object({
    groupId: z.string().min(1, 'Must select a valid group'),
    name: z
      .string()
      .min(2, 'Trip name must be at least 2 characters')
      .max(100, 'Trip name must not exceed 100 characters')
      .trim(),
    description: z
      .string()
      .max(1000, 'Description must not exceed 1000 characters')
      .optional()
      .or(z.literal('')),
    destination: z
      .string()
      .min(2, 'Destination is required')
      .max(200, 'Destination must not exceed 200 characters')
      .trim(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    budget: z
      .number()
      .min(0, 'Budget must be a positive number')
      .optional()
      .or(z.nan()),
    imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

/**
 * Update Trip Schema
 */
export const updateTripSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Trip name must be at least 2 characters')
      .max(100, 'Trip name must not exceed 100 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(1000, 'Description must not exceed 1000 characters')
      .optional()
      .or(z.literal('')),
    destination: z
      .string()
      .min(2, 'Destination is required')
      .max(200, 'Destination must not exceed 200 characters')
      .trim()
      .optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    budget: z
      .number()
      .min(0, 'Budget must be a positive number')
      .optional()
      .or(z.nan()),
    imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    status: z.enum(['PLANNING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

/**
 * Update Trip Status Schema
 */
export const updateTripStatusSchema = z.object({
  status: z.enum(['PLANNING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], {
    message: 'Please select a valid status',
  }),
});

// ============================================================================
// Type Inference
// ============================================================================

export type CreateTripFormData = z.infer<typeof createTripSchema>;
export type UpdateTripFormData = z.infer<typeof updateTripSchema>;
export type UpdateTripStatusFormData = z.infer<typeof updateTripStatusSchema>;
