/**
 * Expense Detail Page
 * View and manage a single expense
 */

'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  User,
  Receipt,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { useTrip } from '@/lib/api/hooks/use-trips';
import {
  useExpense,
  useDeleteExpense,
  useUpdateSplitStatus,
} from '@/lib/api/hooks/use-expenses';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ExpenseCategoryIcon,
  getCategoryLabel,
} from '@/components/patterns/expense-category-icon';
import { cn } from '@/lib/utils/cn';
import type { ExpenseSplit } from '@/types/models.types';

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(amount: string | number, currency: string = 'USD'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

// ============================================================================
// Page Component
// ============================================================================

export default function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ tripId: string; expenseId: string }>;
}) {
  const { tripId, expenseId } = use(params);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch trip data
  const { data: trip, isLoading: tripLoading } = useTrip(tripId);

  // Fetch expense data
  const { data: expense, isLoading: expenseLoading } = useExpense(expenseId);

  // Mutations
  const deleteExpense = useDeleteExpense(tripId);
  const updateSplitStatus = useUpdateSplitStatus(expenseId, tripId);

  // Loading state
  if (tripLoading || expenseLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-zinc-400">
        Loading expense...
      </div>
    );
  }

  // Error state
  if (!trip || !expense) {
    return (
      <div className="h-screen flex items-center justify-center">
        <EmptyState
          title="Expense not found"
          description="The expense you're looking for doesn't exist."
          action={{
            label: 'Back to Expenses',
            onClick: () => router.push(`/trips/${tripId}/expenses`),
          }}
        />
      </div>
    );
  }

  const currency = trip.currency || 'USD';
  const paidSplitsCount = expense.splits.filter((s) => s.isPaid).length;
  const allSplitsPaid = paidSplitsCount === expense.splits.length;

  // Handle delete
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      setIsDeleting(true);
      deleteExpense.mutate(expenseId);
    }
  };

  // Handle split toggle
  const handleToggleSplit = (split: ExpenseSplit) => {
    updateSplitStatus.mutate({ splitId: split.id, isPaid: !split.isPaid });
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/trips/${tripId}/expenses`}
                className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-600" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-zinc-900">
                  Expense Details
                </h1>
                <p className="text-sm text-zinc-500">{trip.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                loading={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-8">
        {/* Main expense card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <ExpenseCategoryIcon category={expense.category} size="lg" />
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-zinc-900">
                  {expense.title}
                </h2>
                <p className="text-zinc-500 mt-1">
                  {getCategoryLabel(expense.category)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-zinc-900">
                  {formatCurrency(expense.amount, currency)}
                </p>
                <p
                  className={cn(
                    'text-sm mt-1 px-2 py-0.5 rounded-full inline-block',
                    allSplitsPaid
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  )}
                >
                  {allSplitsPaid
                    ? 'All paid'
                    : `${paidSplitsCount}/${expense.splits.length} paid`}
                </p>
              </div>
            </div>

            {expense.description && (
              <div className="mt-4 p-4 bg-zinc-50 rounded-lg">
                <p className="text-zinc-600">{expense.description}</p>
              </div>
            )}

            {/* Meta info */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                <User className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-xs text-zinc-400">Paid by</p>
                  <p className="text-sm font-medium text-zinc-900">
                    {expense.payer?.name || 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                <Calendar className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-xs text-zinc-400">Date</p>
                  <p className="text-sm font-medium text-zinc-900">
                    {formatDate(expense.paidAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Receipt link */}
            {expense.receiptUrl && (
              <div className="mt-4">
                <a
                  href={expense.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Receipt className="w-4 h-4" />
                  View Receipt
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Splits section */}
        <Card>
          <CardHeader>
            <CardTitle>Splits</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {expense.splits.map((split, index) => {
              const isCurrentUser = split.userId === user?.id;
              const canToggle = isCurrentUser || expense.paidBy === user?.id;

              return (
                <div
                  key={split.id}
                  className={cn(
                    'flex items-center justify-between p-4',
                    index !== expense.splits.length - 1 && 'border-b border-zinc-100'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
                        split.isPaid
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-zinc-100 text-zinc-600'
                      )}
                    >
                      {split.user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">
                        {split.user?.name || 'Unknown'}
                        {isCurrentUser && (
                          <span className="ml-1 text-xs text-zinc-500">(you)</span>
                        )}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {split.splitType.toLowerCase()} split
                        {split.paidAt && (
                          <span className="ml-2 text-emerald-600">
                            &middot; Paid{' '}
                            {new Date(split.paidAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-zinc-900">
                      {formatCurrency(split.amount, currency)}
                    </span>

                    {canToggle && (
                      <button
                        onClick={() => handleToggleSplit(split)}
                        disabled={updateSplitStatus.isPending}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          split.isPaid
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        )}
                      >
                        {split.isPaid ? (
                          <>
                            <Check className="w-4 h-4" />
                            Paid
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            Mark Paid
                          </>
                        )}
                      </button>
                    )}

                    {!canToggle && (
                      <span
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm font-medium',
                          split.isPaid
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-zinc-100 text-zinc-500'
                        )}
                      >
                        {split.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
