/**
 * Expenses Hooks
 * TanStack Query hooks for expense operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  expensesService,
  type CreateExpenseDTO,
  type UpdateExpenseDTO,
  type ListExpensesParams,
} from '../services/expenses.service';

// ============================================================================
// Query Keys
// ============================================================================

export const expensesKeys = {
  all: ['expenses'] as const,
  lists: () => [...expensesKeys.all, 'list'] as const,
  list: (tripId: string, filters?: ListExpensesParams) =>
    [...expensesKeys.lists(), tripId, filters] as const,
  details: () => [...expensesKeys.all, 'detail'] as const,
  detail: (id: string) => [...expensesKeys.details(), id] as const,
  balances: (tripId: string) => [...expensesKeys.all, 'balances', tripId] as const,
  settlements: (tripId: string) => [...expensesKeys.all, 'settlements', tripId] as const,
};

// ============================================================================
// Expenses Queries
// ============================================================================

/**
 * Get paginated expenses for a trip
 */
export function useTripExpenses(tripId: string, params?: ListExpensesParams) {
  return useQuery({
    queryKey: expensesKeys.list(tripId, params),
    queryFn: () => expensesService.getTripExpenses(tripId, params),
    enabled: !!tripId,
  });
}

/**
 * Get a single expense by ID
 */
export function useExpense(expenseId: string) {
  return useQuery({
    queryKey: expensesKeys.detail(expenseId),
    queryFn: () => expensesService.getExpense(expenseId),
    enabled: !!expenseId,
  });
}

/**
 * Get user balances for a trip
 */
export function useTripBalances(tripId: string) {
  return useQuery({
    queryKey: expensesKeys.balances(tripId),
    queryFn: () => expensesService.getTripBalances(tripId),
    enabled: !!tripId,
  });
}

/**
 * Get optimal settlements to clear all debts
 */
export function useTripSettlements(tripId: string) {
  return useQuery({
    queryKey: expensesKeys.settlements(tripId),
    queryFn: () => expensesService.getTripSettlements(tripId),
    enabled: !!tripId,
  });
}

// ============================================================================
// Expenses Mutations
// ============================================================================

/**
 * Create a new expense
 */
export function useCreateExpense(tripId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateExpenseDTO) => expensesService.createExpense(data),
    onSuccess: (newExpense) => {
      // Invalidate expenses list for this trip
      queryClient.invalidateQueries({ queryKey: expensesKeys.lists() });
      // Invalidate balances since they may have changed
      queryClient.invalidateQueries({ queryKey: expensesKeys.balances(tripId) });
      // Navigate to expenses list
      router.push(`/trips/${tripId}/expenses`);
    },
  });
}

/**
 * Update an expense
 */
export function useUpdateExpense(expenseId: string, tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateExpenseDTO) =>
      expensesService.updateExpense(expenseId, data),
    onSuccess: (updatedExpense) => {
      // Update expense detail cache
      queryClient.setQueryData(expensesKeys.detail(expenseId), updatedExpense);
      // Invalidate expenses list
      queryClient.invalidateQueries({ queryKey: expensesKeys.lists() });
      // Invalidate balances since amounts may have changed
      queryClient.invalidateQueries({ queryKey: expensesKeys.balances(tripId) });
    },
  });
}

/**
 * Delete an expense
 */
export function useDeleteExpense(tripId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (expenseId: string) => expensesService.deleteExpense(expenseId),
    onSuccess: (_, expenseId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: expensesKeys.detail(expenseId) });
      // Invalidate expenses list
      queryClient.invalidateQueries({ queryKey: expensesKeys.lists() });
      // Invalidate balances
      queryClient.invalidateQueries({ queryKey: expensesKeys.balances(tripId) });
      // Navigate back to expenses list
      router.push(`/trips/${tripId}/expenses`);
    },
  });
}

/**
 * Update a split's payment status
 */
export function useUpdateSplitStatus(expenseId: string, tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ splitId, isPaid }: { splitId: string; isPaid: boolean }) =>
      expensesService.updateSplitStatus(expenseId, splitId, isPaid),
    onSuccess: () => {
      // Invalidate expense detail to refresh splits
      queryClient.invalidateQueries({ queryKey: expensesKeys.detail(expenseId) });
      // Invalidate expenses list
      queryClient.invalidateQueries({ queryKey: expensesKeys.lists() });
      // Invalidate balances since payment status affects calculations
      queryClient.invalidateQueries({ queryKey: expensesKeys.balances(tripId) });
    },
  });
}
