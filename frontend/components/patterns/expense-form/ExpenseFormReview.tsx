/**
 * ExpenseFormReview Component
 * Step 3: Review and submit
 */

'use client';

import { UseFormWatch } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ExpenseCategoryIcon,
  getCategoryLabel,
} from '@/components/patterns/expense-category-icon';
import type { User, ExpenseCategory } from '@/types/models.types';

// Using any for form types to maintain compatibility with useForm's inferred types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ExpenseFormReviewProps {
  watch: UseFormWatch<any>;
  members: Array<{ userId: string; user?: User }>;
  amount: number;
  splitType: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
  splitWith: string[];
  customSplits: { userId: string; amount: number }[];
  percentageSplits: { userId: string; percentage: number }[];
}

export function ExpenseFormReview({
  watch,
  members,
  amount,
  splitType,
  splitWith,
  customSplits,
  percentageSplits,
}: ExpenseFormReviewProps) {
  const category = watch('category');
  const title = watch('title');
  const description = watch('description');
  const paidAt = watch('paidAt');

  // Calculate equal split amount
  const equalSplitAmount = splitWith.length > 0 ? amount / splitWith.length : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review & Submit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Expense Summary */}
        <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl">
          <ExpenseCategoryIcon
            category={category as ExpenseCategory}
            size="lg"
          />
          <div>
            <h3 className="font-semibold text-zinc-900">{title}</h3>
            <p className="text-sm text-zinc-500">
              {getCategoryLabel(category as ExpenseCategory)}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xl font-semibold text-zinc-900">
              ${amount.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500">{paidAt}</p>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="p-3 bg-zinc-50 rounded-lg">
            <p className="text-sm text-zinc-600">{description}</p>
          </div>
        )}

        {/* Split Details */}
        <div>
          <p className="text-sm font-medium text-zinc-700 mb-2">
            {splitType === 'EQUAL'
              ? 'Equal split'
              : splitType === 'CUSTOM'
                ? 'Custom split'
                : 'Percentage split'}
          </p>
          <div className="space-y-1">
            {splitType === 'EQUAL' &&
              splitWith.map((userId) => {
                const member = members.find((m) => m.userId === userId);
                return (
                  <div
                    key={userId}
                    className="flex items-center justify-between py-2 px-3 bg-zinc-50 rounded-lg"
                  >
                    <span className="text-sm text-zinc-700">
                      {member?.user?.name || 'Unknown'}
                    </span>
                    <span className="text-sm font-medium text-zinc-900">
                      ${equalSplitAmount.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            {splitType === 'CUSTOM' &&
              customSplits.map((split) => {
                const member = members.find((m) => m.userId === split.userId);
                return (
                  <div
                    key={split.userId}
                    className="flex items-center justify-between py-2 px-3 bg-zinc-50 rounded-lg"
                  >
                    <span className="text-sm text-zinc-700">
                      {member?.user?.name || 'Unknown'}
                    </span>
                    <span className="text-sm font-medium text-zinc-900">
                      ${split.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            {splitType === 'PERCENTAGE' &&
              percentageSplits.map((split) => {
                const member = members.find((m) => m.userId === split.userId);
                const calculatedAmount = (amount * split.percentage) / 100;
                return (
                  <div
                    key={split.userId}
                    className="flex items-center justify-between py-2 px-3 bg-zinc-50 rounded-lg"
                  >
                    <span className="text-sm text-zinc-700">
                      {member?.user?.name || 'Unknown'}
                      <span className="ml-1 text-zinc-500">
                        ({split.percentage}%)
                      </span>
                    </span>
                    <span className="text-sm font-medium text-zinc-900">
                      ${calculatedAmount.toFixed(2)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
