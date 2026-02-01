/**
 * PollForm Component
 * Multi-step form for creating and editing polls
 *
 * This is the main orchestrator component that manages form state
 * and renders the appropriate step component.
 */

'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { PollFormDetails } from './PollFormDetails';
import { PollFormOptions } from './PollFormOptions';
import { PollFormSettings } from './PollFormSettings';
import {
  createPollSchema,
  type CreatePollFormData,
} from '@/lib/schemas/polls.schema';

// ============================================================================
// Types
// ============================================================================

export interface PollFormProps {
  tripId: string;
  onSubmit: (data: CreatePollFormData & { tripId: string }) => void;
  isSubmitting?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function PollForm({
  tripId,
  onSubmit,
  isSubmitting = false,
  className,
}: PollFormProps) {
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
    resolver: zodResolver(createPollSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      type: 'CUSTOM' as const,
      allowMultiple: false,
      maxVotes: null,
      closesAt: '',
      options: [
        { label: '', description: '' },
        { label: '', description: '' },
      ],
    },
    mode: 'onChange',
  });

  const fieldArray = useFieldArray({
    control,
    name: 'options',
  });

  const pollType = watch('type');
  const allowMultiple = watch('allowMultiple');
  const options = watch('options');

  // Step validation
  const validateStep = async (stepNum: number): Promise<boolean> => {
    const fieldsToValidate =
      stepNum === 1
        ? (['title', 'type'] as const)
        : stepNum === 2
          ? (['options'] as const)
          : [];

    if (fieldsToValidate.length === 0) return true;
    const result = await trigger(fieldsToValidate as any);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(step);
    if (isValid && step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const onFormSubmit = (data: CreatePollFormData) => {
    // Filter out empty option descriptions
    const cleanedData = {
      ...data,
      options: data.options.map((opt) => ({
        label: opt.label,
        description: opt.description?.trim() || undefined,
      })),
      closesAt: data.closesAt?.trim() || undefined,
      description: data.description?.trim() || undefined,
      maxVotes: data.allowMultiple && data.maxVotes ? data.maxVotes : undefined,
    };

    onSubmit({ ...cleanedData, tripId });
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className={cn('space-y-6', className)}
    >
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                s === step
                  ? 'bg-zinc-900 text-white'
                  : s < step
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-100 text-zinc-400'
              )}
            >
              {s < step ? '✓' : s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  'w-12 h-0.5 mx-1',
                  s < step ? 'bg-emerald-500' : 'bg-zinc-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Poll Details */}
      {step === 1 && (
        <PollFormDetails
          register={register}
          setValue={setValue}
          errors={errors}
          pollType={pollType}
        />
      )}

      {/* Step 2: Options */}
      {step === 2 && (
        <PollFormOptions
          register={register}
          errors={errors}
          fieldArray={fieldArray}
        />
      )}

      {/* Step 3: Settings */}
      {step === 3 && (
        <PollFormSettings
          register={register}
          watch={watch}
          errors={errors}
          pollType={pollType}
          allowMultiple={allowMultiple}
          options={options}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={handleBack}>
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <Button type="button" onClick={handleNext}>
            Continue
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
          </Button>
        )}
      </div>
    </form>
  );
}
