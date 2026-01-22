/**
 * ExpenseBalanceCard Component
 * Displays a user's balance status for a trip
 */

import { ArrowUp, ArrowDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ExpenseBalance } from '@/types/models.types';

// ============================================================================
// Types
// ============================================================================

export interface ExpenseBalanceCardProps {
  balance: ExpenseBalance;
  currency?: string;
  isCurrentUser?: boolean;
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
  }).format(Math.abs(numAmount));
}

function getBalanceStatus(balance: string): 'positive' | 'negative' | 'settled' {
  const numBalance = parseFloat(balance);
  if (Math.abs(numBalance) < 0.01) return 'settled';
  return numBalance > 0 ? 'positive' : 'negative';
}

// ============================================================================
// Component
// ============================================================================

export function ExpenseBalanceCard({
  balance,
  currency = 'USD',
  isCurrentUser = false,
  className,
}: ExpenseBalanceCardProps) {
  const status = getBalanceStatus(balance.balance);
  const numBalance = parseFloat(balance.balance);

  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-colors',
        isCurrentUser && 'ring-2 ring-zinc-900 ring-offset-2',
        status === 'positive' && 'bg-emerald-50/50 border-emerald-100',
        status === 'negative' && 'bg-rose-50/50 border-rose-100',
        status === 'settled' && 'bg-zinc-50 border-zinc-100',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              status === 'positive' && 'bg-emerald-100 text-emerald-700',
              status === 'negative' && 'bg-rose-100 text-rose-700',
              status === 'settled' && 'bg-zinc-200 text-zinc-700'
            )}
          >
            {balance.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">
              {balance.userName}
              {isCurrentUser && (
                <span className="ml-1 text-xs text-zinc-500">(you)</span>
              )}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            status === 'positive' && 'bg-emerald-100 text-emerald-700',
            status === 'negative' && 'bg-rose-100 text-rose-700',
            status === 'settled' && 'bg-zinc-200 text-zinc-700'
          )}
        >
          {status === 'positive' && (
            <>
              <ArrowUp className="w-3 h-3" />
              <span>Gets back</span>
            </>
          )}
          {status === 'negative' && (
            <>
              <ArrowDown className="w-3 h-3" />
              <span>Owes</span>
            </>
          )}
          {status === 'settled' && (
            <>
              <Check className="w-3 h-3" />
              <span>Settled</span>
            </>
          )}
        </div>
      </div>

      {/* Balance amount */}
      <div className="flex items-baseline justify-between">
        <span
          className={cn(
            'text-2xl font-semibold',
            status === 'positive' && 'text-emerald-700',
            status === 'negative' && 'text-rose-700',
            status === 'settled' && 'text-zinc-500'
          )}
        >
          {status === 'settled' ? '$0.00' : formatCurrency(numBalance, currency)}
        </span>
      </div>

      {/* Details */}
      <div className="mt-3 pt-3 border-t border-zinc-200/50 grid grid-cols-2 gap-2 text-xs text-zinc-500">
        <div>
          <span className="block text-zinc-400">Paid</span>
          <span className="font-medium text-zinc-700">
            {formatCurrency(balance.totalPaid, currency)}
          </span>
        </div>
        <div>
          <span className="block text-zinc-400">Owed</span>
          <span className="font-medium text-zinc-700">
            {formatCurrency(balance.totalOwed, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Balance Summary Component
// ============================================================================

export interface BalanceSummaryProps {
  balances: ExpenseBalance[];
  currentUserId?: string;
  currency?: string;
  className?: string;
}

export function BalanceSummary({
  balances,
  currentUserId,
  currency = 'USD',
  className,
}: BalanceSummaryProps) {
  if (balances.length === 0) {
    return (
      <div className={cn('text-center py-8 text-zinc-500', className)}>
        <p>No expenses recorded yet</p>
      </div>
    );
  }

  // Sort: current user first, then by absolute balance
  const sortedBalances = [...balances].sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return Math.abs(parseFloat(b.balance)) - Math.abs(parseFloat(a.balance));
  });

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {sortedBalances.map((balance) => (
        <ExpenseBalanceCard
          key={balance.userId}
          balance={balance}
          currency={currency}
          isCurrentUser={balance.userId === currentUserId}
        />
      ))}
    </div>
  );
}
