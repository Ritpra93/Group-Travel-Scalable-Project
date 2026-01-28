/**
 * Edit Expense Page
 * Form for editing an existing expense's basic details
 */

'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, DollarSign, Info } from 'lucide-react';
import { useTrip } from '@/lib/api/hooks/use-trips';
import { useExpense, useUpdateExpense } from '@/lib/api/hooks/use-expenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ExpenseCategoryIcon,
  getCategoryLabel,
} from '@/components/patterns/expense-category-icon';
import { EXPENSE_CATEGORIES } from '@/lib/schemas/expenses.schema';
import { cn } from '@/lib/utils/cn';
import type { ExpenseCategory } from '@/types/models.types';

// ============================================================================
// Validation Schema
// ============================================================================

const updateExpenseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['ACCOMMODATION', 'TRANSPORT', 'FOOD', 'ACTIVITIES', 'SHOPPING', 'OTHER']),
  amount: z.number().positive('Amount must be positive'),
  paidAt: z.string(),
  receiptUrl: z.string().url().optional().or(z.literal('')),
});

type UpdateExpenseFormData = z.infer<typeof updateExpenseSchema>;

// ============================================================================
// Page Component
// ============================================================================

export default function EditExpensePage({
  params,
}: {
  params: Promise<{ tripId: string; expenseId: string }>;
}) {
  const { tripId, expenseId } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch trip data
  const { data: trip, isLoading: tripLoading } = useTrip(tripId);

  // Fetch expense data
  const { data: expense, isLoading: expenseLoading, error: expenseError } = useExpense(expenseId);

  // Update mutation
  const updateExpense = useUpdateExpense(expenseId, tripId);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateExpenseFormData>({
    resolver: zodResolver(updateExpenseSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'OTHER',
      amount: 0,
      paidAt: new Date().toISOString().split('T')[0],
      receiptUrl: '',
    },
  });

  const category = watch('category');

  // Populate form when expense loads
  useEffect(() => {
    if (expense) {
      reset({
        title: expense.title,
        description: expense.description || '',
        category: expense.category,
        amount: parseFloat(expense.amount),
        paidAt: expense.paidAt.split('T')[0],
        receiptUrl: expense.receiptUrl || '',
      });
    }
  }, [expense, reset]);

  // Loading state
  if (tripLoading || expenseLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-zinc-400">
        Loading expense...
      </div>
    );
  }

  // Error state
  if (expenseError || !expense || !trip) {
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

  // Handle form submission
  const onSubmit = async (data: UpdateExpenseFormData) => {
    setIsSubmitting(true);
    try {
      await updateExpense.mutateAsync({
        title: data.title,
        description: data.description || undefined,
        category: data.category as ExpenseCategory,
        amount: data.amount,
        paidAt: data.paidAt,
        receiptUrl: data.receiptUrl || undefined,
      });
      router.push(`/trips/${tripId}/expenses/${expenseId}`);
    } catch (error) {
      // Error is handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/trips/${tripId}/expenses/${expenseId}`}
              className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">Edit Expense</h1>
              <p className="text-sm text-zinc-500">{trip.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 pt-8">
        {/* Info banner about splits */}
        <div className="mb-6 flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Note about splits</p>
            <p className="mt-1">
              You can edit the expense details here, but the split configuration cannot be changed
              after creation. To change splits, delete this expense and create a new one.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
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
                error={errors.title?.message}
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
                      'placeholder:text-zinc-400',
                      'focus:outline-none focus:ring-4',
                      !errors.amount && 'border-zinc-200 focus:border-zinc-900 focus:ring-zinc-900/10',
                      errors.amount && 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                    )}
                    {...register('amount', { valueAsNumber: true })}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.amount.message}</p>
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
                      onClick={() => setValue('category', cat as ExpenseCategory, { shouldDirty: true })}
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
                  <p className="mt-1.5 text-sm text-red-600">{errors.category.message}</p>
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
                    'placeholder:text-zinc-400',
                    'focus:outline-none focus:ring-4',
                    'border-zinc-200 focus:border-zinc-900 focus:ring-zinc-900/10'
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

              {/* Receipt URL */}
              <Input
                type="url"
                label="Receipt URL"
                placeholder="https://..."
                error={errors.receiptUrl?.message}
                {...register('receiptUrl')}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/trips/${tripId}/expenses/${expenseId}`)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting || !isDirty}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </form>

        {/* Error message */}
        {updateExpense.isError && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
            Failed to update expense. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}
