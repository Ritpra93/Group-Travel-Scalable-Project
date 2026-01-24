/**
 * Expenses Validation Schemas
 * Zod schemas for expense-related forms
 */

import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

export const EXPENSE_CATEGORIES = [
  'ACCOMMODATION',
  'TRANSPORT',
  'FOOD',
  'ACTIVITIES',
  'SHOPPING',
  'OTHER',
] as const;

export const SPLIT_TYPES = ['EQUAL', 'CUSTOM', 'PERCENTAGE'] as const;

export const CATEGORY_LABELS: Record<(typeof EXPENSE_CATEGORIES)[number], string> = {
  ACCOMMODATION: 'Accommodation',
  TRANSPORT: 'Transport',
  FOOD: 'Food & Drinks',
  ACTIVITIES: 'Activities',
  SHOPPING: 'Shopping',
  OTHER: 'Other',
};

// ============================================================================
// Expense Schemas
// ============================================================================

/**
 * Custom split input schema
 */
export const customSplitSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  amount: z
    .number()
    .positive('Amount must be positive')
    .multipleOf(0.01, 'Amount can have at most 2 decimal places'),
});

/**
 * Percentage split input schema
 */
export const percentageSplitSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  percentage: z
    .number()
    .positive('Percentage must be positive')
    .max(100, 'Percentage cannot exceed 100'),
});

/**
 * Create Expense Schema
 */
export const createExpenseSchema = z
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
    category: z.enum(EXPENSE_CATEGORIES, {
      message: 'Please select a category',
    }),
    amount: z
      .number()
      .positive('Amount must be positive')
      .multipleOf(0.01, 'Amount can have at most 2 decimal places'),
    currency: z.string().length(3, 'Currency must be 3-letter ISO code').default('USD'),
    paidAt: z.string().optional().default(() => new Date().toISOString()),
    receiptUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    splitType: z.enum(SPLIT_TYPES, {
      message: 'Please select a split type',
    }),
    splitWith: z
      .array(z.string().min(1, 'Invalid user ID'))
      .min(1, 'At least one user required')
      .optional(),
    customSplits: z.array(customSplitSchema).optional(),
    percentageSplits: z.array(percentageSplitSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.splitType === 'EQUAL') {
        return data.splitWith && data.splitWith.length > 0;
      }
      return true;
    },
    {
      message: 'Select at least one person to split with',
      path: ['splitWith'],
    }
  )
  .refine(
    (data) => {
      if (data.splitType === 'CUSTOM') {
        return data.customSplits && data.customSplits.length > 0;
      }
      return true;
    },
    {
      message: 'Add at least one custom split',
      path: ['customSplits'],
    }
  )
  .refine(
    (data) => {
      if (data.splitType === 'CUSTOM' && data.customSplits) {
        const total = data.customSplits.reduce((sum, s) => sum + s.amount, 0);
        return Math.abs(total - data.amount) < 0.01;
      }
      return true;
    },
    {
      message: 'Split amounts must equal the total expense amount',
      path: ['customSplits'],
    }
  )
  .refine(
    (data) => {
      if (data.splitType === 'PERCENTAGE') {
        return data.percentageSplits && data.percentageSplits.length > 0;
      }
      return true;
    },
    {
      message: 'Add at least one percentage split',
      path: ['percentageSplits'],
    }
  )
  .refine(
    (data) => {
      if (data.splitType === 'PERCENTAGE' && data.percentageSplits) {
        const total = data.percentageSplits.reduce((sum, s) => sum + s.percentage, 0);
        return Math.abs(total - 100) < 0.01;
      }
      return true;
    },
    {
      message: 'Percentages must add up to 100%',
      path: ['percentageSplits'],
    }
  );

/**
 * Update Expense Schema
 */
export const updateExpenseSchema = z.object({
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
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  amount: z
    .number()
    .positive('Amount must be positive')
    .multipleOf(0.01, 'Amount can have at most 2 decimal places')
    .optional(),
  paidAt: z.string().optional(),
  receiptUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

/**
 * Update Split Status Schema
 */
export const updateSplitStatusSchema = z.object({
  isPaid: z.boolean(),
});

// ============================================================================
// Type Inference
// ============================================================================

export type CreateExpenseFormData = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseFormData = z.infer<typeof updateExpenseSchema>;
export type UpdateSplitStatusFormData = z.infer<typeof updateSplitStatusSchema>;
export type CustomSplitInput = z.infer<typeof customSplitSchema>;
export type PercentageSplitInput = z.infer<typeof percentageSplitSchema>;
