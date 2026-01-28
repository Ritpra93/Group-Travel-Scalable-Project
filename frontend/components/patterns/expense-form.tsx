/**
 * ExpenseForm Component
 * Multi-step form for creating and editing expenses
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users, DollarSign, Check, AlertCircle, Percent } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ExpenseCategoryIcon,
  getCategoryLabel,
} from '@/components/patterns/expense-category-icon';
import {
  createExpenseSchema,
  EXPENSE_CATEGORIES,
  type CreateExpenseFormData,
} from '@/lib/schemas/expenses.schema';
import type { User, ExpenseCategory } from '@/types/models.types';

// ============================================================================
// Types
// ============================================================================

export interface ExpenseFormProps {
  tripId: string;
  members: Array<{ userId: string; user?: User }>;
  currentUserId: string;
  onSubmit: (data: CreateExpenseFormData & { tripId: string }) => void;
  isSubmitting?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ExpenseForm({
  tripId,
  members,
  currentUserId,
  onSubmit,
  isSubmitting = false,
  className,
}: ExpenseFormProps) {
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'OTHER' as const,
      amount: 0,
      currency: 'USD',
      paidAt: new Date().toISOString().split('T')[0],
      receiptUrl: '',
      splitType: 'EQUAL' as const,
      splitWith: members.map((m) => m.userId),
      customSplits: [] as { userId: string; amount: number }[],
      percentageSplits: [] as { userId: string; percentage: number }[],
    },
    mode: 'onChange',
  });

  const splitType = watch('splitType');
  const amount = watch('amount');
  const splitWith = watch('splitWith') || [];
  const customSplits = watch('customSplits') || [];
  const percentageSplits = watch('percentageSplits') || [];
  const category = watch('category');

  // Calculate equal split amount for preview
  const equalSplitAmount = splitWith.length > 0 ? amount / splitWith.length : 0;

  // Calculate custom split total
  const customSplitTotal = customSplits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const customSplitDifference = amount - customSplitTotal;

  // Calculate percentage split total
  const percentageSplitTotal = percentageSplits.reduce((sum, s) => sum + (s.percentage || 0), 0);
  const percentageSplitDifference = 100 - percentageSplitTotal;

  // Step validation
  const validateStep = async (stepNum: number): Promise<boolean> => {
    const fieldsToValidate =
      stepNum === 1
        ? (['title', 'category', 'amount'] as const)
        : (['splitType', 'splitWith', 'customSplits'] as const);

    const result = await trigger(fieldsToValidate as any);
    return result;
  };

  const goToNextStep = async () => {
    const isValid = await validateStep(step);
    if (isValid && step < 3) {
      setStep(step + 1);
    }
  };

  const goToPrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFormSubmit = (data: any) => {
    onSubmit({ ...data, tripId } as CreateExpenseFormData & { tripId: string });
  };

  // Toggle user in splitWith array
  const toggleUserInSplit = (userId: string) => {
    const current = splitWith;
    if (current.includes(userId)) {
      setValue(
        'splitWith',
        current.filter((id) => id !== userId)
      );
    } else {
      setValue('splitWith', [...current, userId]);
    }
  };

  // Update custom split amount for a user
  const updateCustomSplit = (userId: string, splitAmount: number) => {
    const current = customSplits;
    const existing = current.findIndex((s) => s.userId === userId);
    if (existing >= 0) {
      const updated = [...current];
      updated[existing] = { userId, amount: splitAmount };
      setValue('customSplits', updated);
    } else {
      setValue('customSplits', [...current, { userId, amount: splitAmount }]);
    }
  };

  // Update percentage split for a user
  const updatePercentageSplit = (userId: string, percentage: number) => {
    const current = percentageSplits;
    const existing = current.findIndex((s) => s.userId === userId);
    if (existing >= 0) {
      const updated = [...current];
      updated[existing] = { userId, percentage };
      setValue('percentageSplits', updated);
    } else {
      setValue('percentageSplits', [...current, { userId, percentage }]);
    }
  };

  // Initialize custom splits when switching to CUSTOM mode
  useEffect(() => {
    if (splitType === 'CUSTOM' && customSplits.length === 0 && members.length > 0) {
      const equalAmount = amount / members.length;
      setValue(
        'customSplits',
        members.map((m) => ({ userId: m.userId, amount: equalAmount }))
      );
    }
  }, [splitType, members, amount, customSplits.length, setValue]);

  // Initialize percentage splits when switching to PERCENTAGE mode
  useEffect(() => {
    if (splitType === 'PERCENTAGE' && percentageSplits.length === 0 && members.length > 0) {
      const equalPercentage = 100 / members.length;
      setValue(
        'percentageSplits',
        members.map((m) => ({ userId: m.userId, percentage: Math.round(equalPercentage * 100) / 100 }))
      );
    }
  }, [splitType, members, percentageSplits.length, setValue]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-colors',
              s === step
                ? 'bg-zinc-900'
                : s < step
                  ? 'bg-emerald-500'
                  : 'bg-zinc-200'
            )}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
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
                      'placeholder:text-slate-400',
                      'focus:outline-none focus:ring-4',
                      !errors.amount && 'border-slate-200 focus:border-primary focus:ring-primary/10',
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
        )}

        {/* Step 2: Split Configuration */}
        {step === 2 && (
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
                          onClick={() => toggleUserInSplit(member.userId)}
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
                  {errors.splitWith && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.splitWith.message}</p>
                  )}
                </div>
              )}

              {/* Custom Split: Amount inputs */}
              {splitType === 'CUSTOM' && (
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
                                updateCustomSplit(
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
                  {errors.customSplits && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {errors.customSplits.message}
                    </p>
                  )}
                </div>
              )}

              {/* Percentage Split: Percentage inputs */}
              {splitType === 'PERCENTAGE' && (
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
                                updatePercentageSplit(
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
                  {errors.percentageSplits && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {errors.percentageSplits.message}
                    </p>
                  )}
                </div>
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
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl">
                <ExpenseCategoryIcon
                  category={category as ExpenseCategory}
                  size="lg"
                />
                <div>
                  <h3 className="font-semibold text-zinc-900">{watch('title')}</h3>
                  <p className="text-sm text-zinc-500">
                    {getCategoryLabel(category as ExpenseCategory)}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xl font-semibold text-zinc-900">
                    ${amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-zinc-500">{watch('paidAt')}</p>
                </div>
              </div>

              {watch('description') && (
                <div className="p-3 bg-zinc-50 rounded-lg">
                  <p className="text-sm text-zinc-600">{watch('description')}</p>
                </div>
              )}

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
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={goToPrevStep}
              className="flex-1"
            >
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" onClick={goToNextStep} className="flex-1">
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1"
            >
              Create Expense
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
