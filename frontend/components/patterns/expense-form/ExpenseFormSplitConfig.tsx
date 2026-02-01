/**
 * ExpenseFormSplitConfig Component
 * Step 2: Split configuration (equal, custom, percentage)
 */

'use client';

import { UseFormSetValue, FieldErrors } from 'react-hook-form';
import { DollarSign, Check, AlertCircle, Percent } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { User } from '@/types/models.types';

// Using any for form types to maintain compatibility with useForm's inferred types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ExpenseFormSplitConfigProps {
  members: Array<{ userId: string; user?: User }>;
  currentUserId: string;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
  splitType: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
  amount: number;
  splitWith: string[];
  customSplits: { userId: string; amount: number }[];
  percentageSplits: { userId: string; percentage: number }[];
  onToggleUserInSplit: (userId: string) => void;
  onUpdateCustomSplit: (userId: string, amount: number) => void;
  onUpdatePercentageSplit: (userId: string, percentage: number) => void;
}

export function ExpenseFormSplitConfig({
  members,
  currentUserId,
  setValue,
  errors,
  splitType,
  amount,
  splitWith,
  customSplits,
  percentageSplits,
  onToggleUserInSplit,
  onUpdateCustomSplit,
  onUpdatePercentageSplit,
}: ExpenseFormSplitConfigProps) {
  // Calculate equal split amount for preview
  const equalSplitAmount = splitWith.length > 0 ? amount / splitWith.length : 0;

  // Calculate custom split total
  const customSplitTotal = customSplits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const customSplitDifference = amount - customSplitTotal;

  // Calculate percentage split total
  const percentageSplitTotal = percentageSplits.reduce((sum, s) => sum + (s.percentage || 0), 0);
  const percentageSplitDifference = 100 - percentageSplitTotal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Split Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Split Type Toggle */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-900">
            How to split?
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setValue('splitType', 'EQUAL')}
              className={cn(
                'flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all',
                splitType === 'EQUAL'
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
              )}
            >
              Equal
            </button>
            <button
              type="button"
              onClick={() => setValue('splitType', 'CUSTOM')}
              className={cn(
                'flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all',
                splitType === 'CUSTOM'
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
              )}
            >
              Custom
            </button>
            <button
              type="button"
              onClick={() => setValue('splitType', 'PERCENTAGE')}
              className={cn(
                'flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all',
                splitType === 'PERCENTAGE'
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
              )}
            >
              Percentage
            </button>
          </div>
        </div>

        {/* Equal Split: User Selection */}
        {splitType === 'EQUAL' && (
          <EqualSplitSection
            members={members}
            currentUserId={currentUserId}
            splitWith={splitWith}
            equalSplitAmount={equalSplitAmount}
            onToggleUser={onToggleUserInSplit}
            error={errors.splitWith?.message as string | undefined}
          />
        )}

        {/* Custom Split: Amount inputs */}
        {splitType === 'CUSTOM' && (
          <CustomSplitSection
            members={members}
            currentUserId={currentUserId}
            customSplits={customSplits}
            customSplitDifference={customSplitDifference}
            onUpdateSplit={onUpdateCustomSplit}
            error={errors.customSplits?.message as string | undefined}
          />
        )}

        {/* Percentage Split: Percentage inputs */}
        {splitType === 'PERCENTAGE' && (
          <PercentageSplitSection
            members={members}
            currentUserId={currentUserId}
            percentageSplits={percentageSplits}
            percentageSplitDifference={percentageSplitDifference}
            amount={amount}
            onUpdateSplit={onUpdatePercentageSplit}
            error={errors.percentageSplits?.message as string | undefined}
          />
        )}

        {/* Preview */}
        <div className="bg-zinc-50 rounded-xl p-4">
          <p className="text-sm font-medium text-zinc-700 mb-2">Summary</p>
          <div className="flex items-center justify-between">
            <span className="text-zinc-600">Total amount</span>
            <span className="font-semibold text-zinc-900">
              ${amount.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-zinc-600">Split between</span>
            <span className="font-medium text-zinc-900">
              {splitType === 'EQUAL'
                ? splitWith.length
                : splitType === 'CUSTOM'
                  ? customSplits.length
                  : percentageSplits.length}{' '}
              people
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sub-components for each split type
interface EqualSplitSectionProps {
  members: Array<{ userId: string; user?: User }>;
  currentUserId: string;
  splitWith: string[];
  equalSplitAmount: number;
  onToggleUser: (userId: string) => void;
  error?: string;
}

function EqualSplitSection({
  members,
  currentUserId,
  splitWith,
  equalSplitAmount,
  onToggleUser,
  error,
}: EqualSplitSectionProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-900">
        Split with
      </label>
      <div className="space-y-2">
        {members.map((member) => {
          const isSelected = splitWith.includes(member.userId);
          const userName = member.user?.name || 'Unknown';
          const isCurrentUser = member.userId === currentUserId;

          return (
            <button
              key={member.userId}
              type="button"
              onClick={() => onToggleUser(member.userId)}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-xl border transition-all',
                isSelected
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-zinc-200 hover:border-zinc-300'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    isSelected
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-100 text-zinc-600'
                  )}
                >
                  {isSelected ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    userName.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="font-medium text-zinc-900">
                  {userName}
                  {isCurrentUser && (
                    <span className="ml-1 text-xs text-zinc-500">(you)</span>
                  )}
                </span>
              </div>
              {isSelected && splitWith.length > 0 && (
                <span className="text-sm text-emerald-700 font-medium">
                  ${equalSplitAmount.toFixed(2)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

interface CustomSplitSectionProps {
  members: Array<{ userId: string; user?: User }>;
  currentUserId: string;
  customSplits: { userId: string; amount: number }[];
  customSplitDifference: number;
  onUpdateSplit: (userId: string, amount: number) => void;
  error?: string;
}

function CustomSplitSection({
  members,
  currentUserId,
  customSplits,
  customSplitDifference,
  onUpdateSplit,
  error,
}: CustomSplitSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-zinc-900">
          Custom amounts
        </label>
        {Math.abs(customSplitDifference) > 0.01 && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <AlertCircle className="w-3 h-3" />
            {customSplitDifference > 0
              ? `$${customSplitDifference.toFixed(2)} remaining`
              : `$${Math.abs(customSplitDifference).toFixed(2)} over`}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {members.map((member) => {
          const userName = member.user?.name || 'Unknown';
          const isCurrentUser = member.userId === currentUserId;
          const currentSplit = customSplits.find(
            (s) => s.userId === member.userId
          );

          return (
            <div
              key={member.userId}
              className="flex items-center justify-between p-3 rounded-xl border border-zinc-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-medium text-zinc-600">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-zinc-900">
                  {userName}
                  {isCurrentUser && (
                    <span className="ml-1 text-xs text-zinc-500">(you)</span>
                  )}
                </span>
              </div>
              <div className="relative w-28">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentSplit?.amount || 0}
                  onChange={(e) =>
                    onUpdateSplit(
                      member.userId,
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full h-10 rounded-lg border border-zinc-200 pl-7 pr-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>
          );
        })}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

interface PercentageSplitSectionProps {
  members: Array<{ userId: string; user?: User }>;
  currentUserId: string;
  percentageSplits: { userId: string; percentage: number }[];
  percentageSplitDifference: number;
  amount: number;
  onUpdateSplit: (userId: string, percentage: number) => void;
  error?: string;
}

function PercentageSplitSection({
  members,
  currentUserId,
  percentageSplits,
  percentageSplitDifference,
  amount,
  onUpdateSplit,
  error,
}: PercentageSplitSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-zinc-900">
          Percentage allocation
        </label>
        {Math.abs(percentageSplitDifference) > 0.01 && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <AlertCircle className="w-3 h-3" />
            {percentageSplitDifference > 0
              ? `${percentageSplitDifference.toFixed(1)}% remaining`
              : `${Math.abs(percentageSplitDifference).toFixed(1)}% over`}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {members.map((member) => {
          const userName = member.user?.name || 'Unknown';
          const isCurrentUser = member.userId === currentUserId;
          const currentSplit = percentageSplits.find(
            (s) => s.userId === member.userId
          );
          const calculatedAmount = currentSplit
            ? (amount * currentSplit.percentage) / 100
            : 0;

          return (
            <div
              key={member.userId}
              className="flex items-center justify-between p-3 rounded-xl border border-zinc-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-medium text-zinc-600">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-medium text-zinc-900">
                    {userName}
                    {isCurrentUser && (
                      <span className="ml-1 text-xs text-zinc-500">(you)</span>
                    )}
                  </span>
                  <p className="text-xs text-zinc-500">
                    ${calculatedAmount.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="relative w-24">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={currentSplit?.percentage || 0}
                  onChange={(e) =>
                    onUpdateSplit(
                      member.userId,
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full h-10 rounded-lg border border-zinc-200 pl-3 pr-8 text-sm text-right focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              </div>
            </div>
          );
        })}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
