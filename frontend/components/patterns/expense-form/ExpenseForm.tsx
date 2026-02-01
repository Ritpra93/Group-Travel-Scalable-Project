/**
 * ExpenseForm Component
 * Multi-step form for creating and editing expenses
 *
 * This is the main orchestrator component that manages form state
 * and renders the appropriate step component.
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { ExpenseFormBasicInfo } from './ExpenseFormBasicInfo';
import { ExpenseFormSplitConfig } from './ExpenseFormSplitConfig';
import { ExpenseFormReview } from './ExpenseFormReview';
import {
  createExpenseSchema,
  type CreateExpenseFormData,
} from '@/lib/schemas/expenses.schema';
import type { User } from '@/types/models.types';

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

  const handleFormSubmit = (data: CreateExpenseFormData) => {
    onSubmit({ ...data, tripId });
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
          <ExpenseFormBasicInfo
            register={register}
            setValue={setValue}
            errors={errors}
            category={category}
          />
        )}

        {/* Step 2: Split Configuration */}
        {step === 2 && (
          <ExpenseFormSplitConfig
            members={members}
            currentUserId={currentUserId}
            setValue={setValue}
            errors={errors}
            splitType={splitType}
            amount={amount}
            splitWith={splitWith}
            customSplits={customSplits}
            percentageSplits={percentageSplits}
            onToggleUserInSplit={toggleUserInSplit}
            onUpdateCustomSplit={updateCustomSplit}
            onUpdatePercentageSplit={updatePercentageSplit}
          />
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <ExpenseFormReview
            watch={watch}
            members={members}
            amount={amount}
            splitType={splitType}
            splitWith={splitWith}
            customSplits={customSplits}
            percentageSplits={percentageSplits}
          />
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
