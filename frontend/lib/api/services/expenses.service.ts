/**
 * Expenses Service
 * API calls for expense management
 */

import { apiClient } from '../client';
import type {
  Expense,
  ExpenseSplit,
  ExpenseBalance,
  ExpenseCategory,
  SplitType,
} from '@/types/models.types';
import type { ApiResponse } from '@/types/api.types';

// ============================================================================
// Types
// ============================================================================

export interface CreateExpenseDTO {
  tripId: string;
  title: string;
  description?: string;
  category: ExpenseCategory;
  amount: number;
  currency?: string;
  paidAt?: string;
  receiptUrl?: string;
  splitType: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
  splitWith?: string[]; // Required for EQUAL
  customSplits?: { userId: string; amount: number }[]; // Required for CUSTOM
  percentageSplits?: { userId: string; percentage: number }[]; // Required for PERCENTAGE
}

export interface UpdateExpenseDTO {
  title?: string;
  description?: string;
  category?: ExpenseCategory;
  amount?: number;
  paidAt?: string;
  receiptUrl?: string;
}

export interface ListExpensesParams {
  page?: number;
  limit?: number;
  category?: ExpenseCategory;
  paidBy?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'createdAt' | 'paidAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedExpensesResponse {
  data: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface SettlementTransaction {
  from: {
    userId: string;
    userName: string;
  };
  to: {
    userId: string;
    userName: string;
  };
  amount: string;
}

export interface SettlementResponse {
  settlements: SettlementTransaction[];
  summary: {
    totalTransactions: number;
    totalAmount: string;
  };
}

// ============================================================================
// Expenses CRUD
// ============================================================================

/**
 * Create a new expense with splits
 */
export async function createExpense(data: CreateExpenseDTO): Promise<Expense> {
  const response = await apiClient.post<ApiResponse<Expense>>('/expenses', data);
  return response.data.data!;
}

/**
 * Get a single expense by ID
 */
export async function getExpense(expenseId: string): Promise<Expense> {
  const response = await apiClient.get<ApiResponse<Expense>>(`/expenses/${expenseId}`);
  return response.data.data!;
}

/**
 * List expenses for a trip with pagination and filters
 */
export async function getTripExpenses(
  tripId: string,
  params?: ListExpensesParams
): Promise<PaginatedExpensesResponse> {
  const response = await apiClient.get<PaginatedExpensesResponse>(
    `/trips/${tripId}/expenses`,
    { params }
  );
  return response.data;
}

/**
 * Update an expense
 */
export async function updateExpense(
  expenseId: string,
  data: UpdateExpenseDTO
): Promise<Expense> {
  const response = await apiClient.put<ApiResponse<Expense>>(
    `/expenses/${expenseId}`,
    data
  );
  return response.data.data!;
}

/**
 * Delete an expense
 */
export async function deleteExpense(expenseId: string): Promise<void> {
  await apiClient.delete(`/expenses/${expenseId}`);
}

// ============================================================================
// Expense Splits
// ============================================================================

/**
 * Update a split's payment status
 */
export async function updateSplitStatus(
  expenseId: string,
  splitId: string,
  isPaid: boolean
): Promise<ExpenseSplit> {
  const response = await apiClient.patch<ApiResponse<ExpenseSplit>>(
    `/expenses/${expenseId}/splits/${splitId}`,
    { isPaid }
  );
  return response.data.data!;
}

// ============================================================================
// Balances
// ============================================================================

/**
 * Get user balances for a trip
 */
export async function getTripBalances(tripId: string): Promise<ExpenseBalance[]> {
  const response = await apiClient.get<ApiResponse<ExpenseBalance[]>>(
    `/trips/${tripId}/expenses/balances`
  );
  return response.data.data!;
}

// ============================================================================
// Settlements
// ============================================================================

/**
 * Get optimal settlements to clear all debts
 */
export async function getTripSettlements(tripId: string): Promise<SettlementResponse> {
  const response = await apiClient.get<ApiResponse<SettlementResponse>>(
    `/trips/${tripId}/expenses/settlements`
  );
  return response.data.data!;
}

// ============================================================================
// Exports
// ============================================================================

export const expensesService = {
  createExpense,
  getExpense,
  getTripExpenses,
  updateExpense,
  deleteExpense,
  updateSplitStatus,
  getTripBalances,
  getTripSettlements,
};
