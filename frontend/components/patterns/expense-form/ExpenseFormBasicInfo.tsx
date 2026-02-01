/**
 * ExpenseFormBasicInfo Component
 * Step 1: Basic expense details (title, amount, category, description, date)
 */

'use client';

import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ExpenseCategoryIcon,
  getCategoryLabel,
} from '@/components/patterns/expense-category-icon';
import { EXPENSE_CATEGORIES } from '@/lib/schemas/expenses.schema';
import type { ExpenseCategory } from '@/types/models.types';

// Using any for form types to maintain compatibility with useForm's inferred types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ExpenseFormBasicInfoProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
  category: string;
}

export function ExpenseFormBasicInfo({
  register,
  setValue,
  errors,
  category,
}: ExpenseFormBasicInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title */}
        <Input
          label="Title"
          placeholder="e.g., Dinner at restaurant"
          required
          error={errors.title?.message as string | undefined}
          {...register('title')}
        />

        {/* Amount */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-900">
            Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className={cn(
                'w-full h-14 rounded-xl border px-4 pl-12 text-base',
                'transition-all duration-300',
                'placeholder:text-slate-400',
                'focus:outline-none focus:ring-4',
                !errors.amount && 'border-slate-200 focus:border-primary focus:ring-primary/10',
                errors.amount && 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
              )}
              {...register('amount', { valueAsNumber: true })}
            />
          </div>
          {errors.amount && (
            <p className="mt-1.5 text-sm text-red-600">{errors.amount.message as string}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-900">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setValue('category', cat)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all',
                  category === cat
                    ? 'border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900'
                    : 'border-zinc-200 hover:border-zinc-300'
                )}
              >
                <ExpenseCategoryIcon
                  category={cat as ExpenseCategory}
                  size="sm"
                  showBackground={category === cat}
                />
                <span className="text-xs font-medium text-zinc-700">
                  {getCategoryLabel(cat as ExpenseCategory)}
                </span>
              </button>
            ))}
          </div>
          {errors.category && (
            <p className="mt-1.5 text-sm text-red-600">{errors.category.message as string}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-900">
            Description
          </label>
          <textarea
            placeholder="Add any notes..."
            rows={2}
            className={cn(
              'w-full rounded-xl border px-4 py-3 text-base resize-none',
              'transition-all duration-300',
              'placeholder:text-slate-400',
              'focus:outline-none focus:ring-4',
              'border-slate-200 focus:border-primary focus:ring-primary/10'
            )}
            {...register('description')}
          />
        </div>

        {/* Date */}
        <Input
          type="date"
          label="Date"
          {...register('paidAt')}
        />
      </CardContent>
    </Card>
  );
}
