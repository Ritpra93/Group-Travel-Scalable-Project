import { z } from 'zod';
import type { ExpenseCategory, SplitType } from '../../config/database.types';

// ============================================================================
// ENUMS
// ============================================================================

export const ExpenseCategoryEnum = z.enum([
  'ACCOMMODATION',
  'TRANSPORT',
  'FOOD',
  'ACTIVITIES',
  'SHOPPING',
  'OTHER',
]);

export const SplitTypeEnum = z.enum(['EQUAL', 'CUSTOM', 'PERCENTAGE']);

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

/**
 * Schema for custom split input (used when splitType is CUSTOM)
 */
export const ExpenseSplitInputSchema = z.object({
  userId: z.string().min(20, 'Invalid user ID format'),
  amount: z.number().positive('Amount must be positive').multipleOf(0.01, 'Amount can have at most 2 decimal places'),
});

/**
 * Schema for percentage split input (used when splitType is PERCENTAGE)
 */
export const PercentageSplitInputSchema = z.object({
  userId: z.string().min(20, 'Invalid user ID format'),
  percentage: z.number().positive('Percentage must be positive').max(100, 'Percentage cannot exceed 100'),
});

/**
 * Schema for creating a new expense
 */
export const CreateExpenseSchema = z
  .object({
    tripId: z.string().min(20, 'Invalid trip ID format'),
    title: z.string().min(3, 'Title too short').max(200, 'Title too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    category: ExpenseCategoryEnum,
    amount: z.number().positive('Amount must be positive').multipleOf(0.01, 'Amount can have at most 2 decimal places'),
    currency: z.string().length(3, 'Currency must be 3-letter ISO code').default('USD'),
    paidAt: z.coerce.date().optional().default(() => new Date()),
    receiptUrl: z.string().url('Invalid receipt URL').optional(),

    // Split configuration
    splitType: SplitTypeEnum.default('EQUAL'),
    splitWith: z.array(z.string().min(20, 'Invalid user ID format')).min(1, 'At least one user required for split').optional(),
    customSplits: z.array(ExpenseSplitInputSchema).optional(),
    percentageSplits: z.array(PercentageSplitInputSchema).optional(),
  })
  .refine(
    (data) => {
      // If CUSTOM, must provide customSplits
      if (data.splitType === 'CUSTOM' && !data.customSplits) {
        return false;
      }
      // If EQUAL, must provide splitWith
      if (data.splitType === 'EQUAL' && !data.splitWith) {
        return false;
      }
      // If PERCENTAGE, must provide percentageSplits
      if (data.splitType === 'PERCENTAGE' && !data.percentageSplits) {
        return false;
      }
      return true;
    },
    {
      message: 'customSplits required for CUSTOM, splitWith required for EQUAL, percentageSplits required for PERCENTAGE',
      path: ['splitType'],
    }
  )
  .refine(
    (data) => {
      // If CUSTOM, sum of splits must equal total amount (within 1 cent tolerance for rounding)
      if (data.splitType === 'CUSTOM' && data.customSplits) {
        const total = data.customSplits.reduce((sum, s) => sum + s.amount, 0);
        return Math.abs(total - data.amount) < 0.01;
      }
      return true;
    },
    {
      message: 'Sum of custom splits must equal total amount',
      path: ['customSplits'],
    }
  )
  .refine(
    (data) => {
      // If PERCENTAGE, sum of percentages must equal 100 (within 0.01 tolerance for rounding)
      if (data.splitType === 'PERCENTAGE' && data.percentageSplits) {
        const totalPercentage = data.percentageSplits.reduce((sum, s) => sum + s.percentage, 0);
        return Math.abs(totalPercentage - 100) < 0.01;
      }
      return true;
    },
    {
      message: 'Sum of percentages must equal 100',
      path: ['percentageSplits'],
    }
  );

/**
 * Schema for updating an expense
 */
export const UpdateExpenseSchema = z.object({
  title: z.string().min(3, 'Title too short').max(200, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  category: ExpenseCategoryEnum.optional(),
  amount: z.number().positive('Amount must be positive').multipleOf(0.01, 'Amount can have at most 2 decimal places').optional(),
  paidAt: z.coerce.date().optional(),
  receiptUrl: z.string().url('Invalid receipt URL').optional(),
  // Optimistic locking: client sends their version of updatedAt
  clientUpdatedAt: z.coerce.date().optional(),
});

/**
 * Schema for updating an expense split (mark as paid/unpaid)
 */
export const UpdateSplitSchema = z.object({
  isPaid: z.boolean(),
});

/**
 * Pagination schema (reusable)
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema for listing expenses with filters
 */
export const ListExpensesQuerySchema = PaginationSchema.extend({
  category: ExpenseCategoryEnum.optional(),
  paidBy: z.string().min(20, 'Invalid user ID format').optional(),
  minAmount: z.coerce.number().positive('Min amount must be positive').optional(),
  maxAmount: z.coerce.number().positive('Max amount must be positive').optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ExpenseSplitInput = z.infer<typeof ExpenseSplitInputSchema>;
export type PercentageSplitInput = z.infer<typeof PercentageSplitInputSchema>;
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;
export type UpdateSplitInput = z.infer<typeof UpdateSplitSchema>;
export type ListExpensesQuery = z.infer<typeof ListExpensesQuerySchema>;

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

/**
 * Expense split data structure
 */
export interface ExpenseSplitData {
  id: string;
  expenseId: string;
  userId: string;
  splitType: SplitType;
  amount: string; // Decimal as string from Kysely
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Base expense data
 */
export interface ExpenseData {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  category: ExpenseCategory;
  amount: string; // Decimal as string from Kysely
  currency: string;
  paidBy: string;
  paidAt: Date;
  receiptUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Full expense response with splits and payer details
 */
export interface ExpenseResponse extends ExpenseData {
  splits: ExpenseSplitData[];
  payer: {
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
 * User balance for a trip (who owes whom)
 */
export interface UserBalanceResponse {
  userId: string;
  userName: string;
  totalPaid: string; // Decimal - total amount user has paid
  totalOwed: string; // Decimal - total amount user owes to others
  balance: string; // Decimal - net balance (positive = others owe them, negative = they owe others)
}

/**
 * Paginated expenses response
 */
export interface PaginatedExpensesResponse {
  data: ExpenseResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Settlement transaction - who pays whom to settle debts
 */
export interface SettlementTransaction {
  from: {
    userId: string;
    userName: string;
  };
  to: {
    userId: string;
    userName: string;
  };
  amount: string; // Decimal as string
}

/**
 * Settlement response - optimal transactions to settle all debts
 */
export interface SettlementResponse {
  settlements: SettlementTransaction[];
  summary: {
    totalTransactions: number;
    totalAmount: string; // Sum of all settlement amounts
  };
}
