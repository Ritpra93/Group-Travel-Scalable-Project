/**
 * Expenses List Page
 * Lists all expenses for a trip with filtering and balance summary
 */

'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Filter,
  X,
} from 'lucide-react';
import { useTrip } from '@/lib/api/hooks/use-trips';
import {
  useTripExpenses,
  useTripBalances,
  useTripSettlements,
  useDeleteExpense,
  useUpdateSplitStatus,
} from '@/lib/api/hooks/use-expenses';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ExpenseList } from '@/components/patterns/expense-list-item';
import { BalanceSummary } from '@/components/patterns/expense-balance-card';
import { SettlementCard } from '@/components/patterns/settlement-card';
import {
  ExpenseCategoryIcon,
  getCategoryLabel,
} from '@/components/patterns/expense-category-icon';
import { EXPENSE_CATEGORIES } from '@/lib/schemas/expenses.schema';
import type { Expense, ExpenseSplit, ExpenseCategory } from '@/types/models.types';

// ============================================================================
// Types
// ============================================================================

interface FilterState {
  category?: ExpenseCategory;
  page: number;
}

// ============================================================================
// Page Component
// ============================================================================

export default function TripExpensesPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({ page: 1 });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch trip data
  const { data: trip, isLoading: tripLoading } = useTrip(tripId);

  // Fetch expenses
  const {
    data: expensesData,
    isLoading: expensesLoading,
  } = useTripExpenses(tripId, {
    page: filters.page,
    limit: 20,
    category: filters.category,
  });

  // Fetch balances
  const { data: balances, isLoading: balancesLoading } = useTripBalances(tripId);

  // Fetch settlements
  const {
    data: settlements,
    isLoading: settlementsLoading,
    refetch: refetchSettlements,
  } = useTripSettlements(tripId);

  // Mutations
  const deleteExpense = useDeleteExpense(tripId);
  const updateSplitStatus = useUpdateSplitStatus(tripId);

  // Loading state
  if (tripLoading || expensesLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-zinc-400">
        Loading expenses...
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="h-screen flex items-center justify-center">
        <EmptyState
          title="Trip not found"
          description="The trip you're looking for doesn't exist."
          action={{
            label: 'Go to Trips',
            onClick: () => router.push('/trips'),
          }}
        />
      </div>
    );
  }

  const expenses = expensesData?.data || [];
  const pagination = expensesData?.pagination;

  // Event handlers
  const handleEditExpense = (expense: Expense) => {
    router.push(`/trips/${tripId}/expenses/${expense.id}`);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteExpense.mutate(expense.id);
    }
  };

  const handleToggleSplitPaid = async (
    expense: Expense,
    split: ExpenseSplit,
    isPaid: boolean
  ) => {
    updateSplitStatus.mutate({ expenseId: expense.id, splitId: split.id, isPaid });
  };

  const handleCategoryFilter = (category?: ExpenseCategory) => {
    setFilters({ ...filters, category, page: 1 });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ page: 1 });
  };

  // Calculate totals
  const totalExpenses = expenses.reduce(
    (sum, e) => sum + parseFloat(e.amount),
    0
  );

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/trips/${tripId}`}
                className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-600" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-zinc-900">Expenses</h1>
                <p className="text-sm text-zinc-500">{trip.name}</p>
              </div>
            </div>
            <Link href={`/trips/${tripId}/expenses/new`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-8">
        {/* Balances & Settlements Section */}
        <section className="mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Balances */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">
                  Balances
                </h2>
                {!balancesLoading && balances && balances.length > 0 && (
                  <span className="text-sm text-zinc-500">
                    {balances.length} member{balances.length !== 1 && 's'}
                  </span>
                )}
              </div>

              {balancesLoading ? (
                <div className="text-center py-8 text-zinc-400">
                  Loading balances...
                </div>
              ) : balances && balances.length > 0 ? (
                <BalanceSummary
                  balances={balances}
                  currentUserId={user?.id}
                  currency={trip.currency || 'USD'}
                />
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-zinc-500">
                    No expenses yet. Add an expense to see balances.
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Settlements */}
            <div>
              <div className="mb-4">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">
                  Settle Up
                </h2>
              </div>
              <SettlementCard
                settlements={settlements}
                isLoading={settlementsLoading}
                onRefresh={() => refetchSettlements()}
                currentUserId={user?.id}
                currency={trip.currency || 'USD'}
              />
            </div>
          </div>
        </section>

        {/* Expenses Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">
                All Expenses
              </h2>
              {pagination && (
                <span className="text-sm text-zinc-500">
                  {pagination.total} expense{pagination.total !== 1 && 's'} &middot; $
                  {totalExpenses.toFixed(2)} total
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {filters.category && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-100 text-zinc-600 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  <ExpenseCategoryIcon
                    category={filters.category}
                    size="sm"
                    showBackground={false}
                  />
                  {getCategoryLabel(filters.category)}
                  <X className="w-3 h-3 ml-1" />
                </button>
              )}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Filter
                </Button>

                {/* Filter dropdown */}
                {showFilters && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-zinc-100 shadow-lg py-2 z-20">
                    <div className="px-3 py-1.5 text-xs font-medium text-zinc-400 uppercase">
                      Category
                    </div>
                    <button
                      onClick={() => handleCategoryFilter(undefined)}
                      className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      All categories
                    </button>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryFilter(cat as ExpenseCategory)}
                        className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                      >
                        <ExpenseCategoryIcon
                          category={cat as ExpenseCategory}
                          size="sm"
                        />
                        {getCategoryLabel(cat as ExpenseCategory)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {expenses.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  title="No expenses yet"
                  description="Start tracking your trip expenses by adding the first one."
                  action={{
                    label: 'Add First Expense',
                    onClick: () => router.push(`/trips/${tripId}/expenses/new`),
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <ExpenseList
                expenses={expenses}
                currency={trip.currency || 'USD'}
                currentUserId={user?.id}
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense}
                onToggleSplitPaid={handleToggleSplitPaid}
              />

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page <= 1}
                    onClick={() =>
                      setFilters({ ...filters, page: filters.page - 1 })
                    }
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-zinc-500">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasMore}
                    onClick={() =>
                      setFilters({ ...filters, page: filters.page + 1 })
                    }
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
