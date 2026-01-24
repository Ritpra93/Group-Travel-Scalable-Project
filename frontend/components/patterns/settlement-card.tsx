/**
 * SettlementCard Component
 * Displays settlement transactions to settle all debts
 */

'use client';

import { ArrowRight, Wallet, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SettlementResponse } from '@/lib/api/services/expenses.service';

// ============================================================================
// Types
// ============================================================================

export interface SettlementCardProps {
  settlements: SettlementResponse | undefined;
  isLoading?: boolean;
  onRefresh?: () => void;
  currentUserId?: string;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SettlementCard({
  settlements,
  isLoading = false,
  onRefresh,
  currentUserId,
  className,
}: SettlementCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Settlements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-zinc-100 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settlements || settlements.settlements.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Settlements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="font-medium text-zinc-900">All settled up!</p>
            <p className="text-sm text-zinc-500 mt-1">
              No payments needed between group members
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Settlements
        </CardTitle>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="bg-zinc-50 rounded-xl p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600">Total transactions</span>
            <span className="font-semibold text-zinc-900">
              {settlements.summary.totalTransactions}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-zinc-600">Total amount</span>
            <span className="font-semibold text-zinc-900">
              ${settlements.summary.totalAmount}
            </span>
          </div>
        </div>

        {/* Settlement list */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-700">Suggested payments</p>
          {settlements.settlements.map((settlement, index) => {
            const isFromCurrentUser = settlement.from.userId === currentUserId;
            const isToCurrentUser = settlement.to.userId === currentUserId;

            return (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border transition-colors',
                  isFromCurrentUser
                    ? 'border-amber-200 bg-amber-50'
                    : isToCurrentUser
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-zinc-200 bg-white'
                )}
              >
                {/* From user */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0',
                      isFromCurrentUser
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-zinc-200 text-zinc-700'
                    )}
                  >
                    {settlement.from.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 truncate">
                      {isFromCurrentUser ? 'You' : settlement.from.userName}
                    </p>
                    {isFromCurrentUser && (
                      <p className="text-xs text-amber-700">You owe</p>
                    )}
                  </div>
                </div>

                {/* Arrow and amount */}
                <div className="flex items-center gap-2 shrink-0">
                  <ArrowRight className="w-4 h-4 text-zinc-400" />
                  <span
                    className={cn(
                      'font-semibold text-lg',
                      isFromCurrentUser
                        ? 'text-amber-700'
                        : isToCurrentUser
                          ? 'text-emerald-700'
                          : 'text-zinc-900'
                    )}
                  >
                    ${settlement.amount}
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-400" />
                </div>

                {/* To user */}
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <div className="min-w-0 text-right">
                    <p className="font-medium text-zinc-900 truncate">
                      {isToCurrentUser ? 'You' : settlement.to.userName}
                    </p>
                    {isToCurrentUser && (
                      <p className="text-xs text-emerald-700">You receive</p>
                    )}
                  </div>
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0',
                      isToCurrentUser
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-zinc-200 text-zinc-700'
                    )}
                  >
                    {settlement.to.userName.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Help text */}
        <p className="text-xs text-zinc-500 text-center">
          These are the minimum payments needed to settle all debts
        </p>
      </CardContent>
    </Card>
  );
}
