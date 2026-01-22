/**
 * ExpenseListItem Component
 * Displays a single expense in a list with expandable splits
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import {
  ExpenseCategoryIcon,
  getCategoryLabel,
} from '@/components/patterns/expense-category-icon';
import type { Expense, ExpenseSplit } from '@/types/models.types';

// ============================================================================
// Types
// ============================================================================

export interface ExpenseListItemProps {
  expense: Expense;
  currency?: string;
  currentUserId?: string;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  onToggleSplitPaid?: (expense: Expense, split: ExpenseSplit, isPaid: boolean) => void;
  className?: string;
}

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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

// ============================================================================
// Component
// ============================================================================

export function ExpenseListItem({
  expense,
  currency = 'USD',
  currentUserId,
  onEdit,
  onDelete,
  onToggleSplitPaid,
  className,
}: ExpenseListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const paidSplitsCount = expense.splits.filter((s) => s.isPaid).length;
  const allSplitsPaid = paidSplitsCount === expense.splits.length;

  return (
    <div
      className={cn(
        'bg-white border border-zinc-100 rounded-xl overflow-hidden transition-shadow hover:shadow-sm',
        className
      )}
    >
      {/* Main content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Category icon */}
          <ExpenseCategoryIcon category={expense.category} size="md" />

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium text-zinc-900 truncate">
                  {expense.title}
                </h3>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {getCategoryLabel(expense.category)} &middot;{' '}
                  {formatDate(expense.paidAt)}
                </p>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-zinc-900">
                  {formatCurrency(expense.amount, currency)}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  paid by {expense.payer?.name || 'Unknown'}
                </p>
              </div>
            </div>

            {/* Description if present */}
            {expense.description && (
              <p className="text-sm text-zinc-600 mt-2 line-clamp-2">
                {expense.description}
              </p>
            )}

            {/* Split summary & actions */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <span>
                  {expense.splits.length} split{expense.splits.length !== 1 && 's'}
                </span>
                {allSplitsPaid ? (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">
                    All paid
                  </span>
                ) : (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                    {paidSplitsCount}/{expense.splits.length} paid
                  </span>
                )}
              </button>

              <div className="flex items-center gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(expense)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(expense)}
                    className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded splits section */}
      {isExpanded && (
        <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-3">
          <div className="space-y-2">
            {expense.splits.map((split) => (
              <div
                key={split.id}
                className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-zinc-100"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
                      split.isPaid
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-zinc-100 text-zinc-600'
                    )}
                  >
                    {split.user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {split.user?.name || 'Unknown'}
                      {split.userId === currentUserId && (
                        <span className="ml-1 text-xs text-zinc-500">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {split.splitType.toLowerCase()} split
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-medium text-zinc-900">
                    {formatCurrency(split.amount, currency)}
                  </span>

                  {onToggleSplitPaid && (
                    <button
                      onClick={() => onToggleSplitPaid(expense, split, !split.isPaid)}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
                        split.isPaid
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      )}
                    >
                      {split.isPaid ? (
                        <>
                          <Check className="w-3 h-3" />
                          Paid
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" />
                          Unpaid
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Expense List Component
// ============================================================================

export interface ExpenseListProps {
  expenses: Expense[];
  currency?: string;
  currentUserId?: string;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  onToggleSplitPaid?: (expense: Expense, split: ExpenseSplit, isPaid: boolean) => void;
  emptyMessage?: string;
  className?: string;
}

export function ExpenseList({
  expenses,
  currency = 'USD',
  currentUserId,
  onEdit,
  onDelete,
  onToggleSplitPaid,
  emptyMessage = 'No expenses yet',
  className,
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className={cn('text-center py-12 text-zinc-500', className)}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {expenses.map((expense) => (
        <ExpenseListItem
          key={expense.id}
          expense={expense}
          currency={currency}
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleSplitPaid={onToggleSplitPaid}
        />
      ))}
    </div>
  );
}
