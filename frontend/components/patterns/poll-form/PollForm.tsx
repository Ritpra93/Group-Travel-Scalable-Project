/**
 * PollForm Component
 * Single-page form for creating polls
 */

'use client';

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
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    mode: 'onSubmit',
  });

  const fieldArray = useFieldArray({
    control,
    name: 'options',
  });

  const pollType = watch('type');
  const allowMultiple = watch('allowMultiple');
  const options = watch('options');

  const onFormSubmit = (data: CreatePollFormData) => {
    const cleanedData = {
      ...data,
      options: data.options.map((opt) => ({
        label: opt.label,
        description: opt.description?.trim() || undefined,
      })),
      closesAt: data.closesAt?.trim()
        ? new Date(data.closesAt).toISOString()
        : undefined,
      description: data.description?.trim() || undefined,
      maxVotes: data.allowMultiple && data.maxVotes ? data.maxVotes : undefined,
    };

    onSubmit({ ...cleanedData, tripId });
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className={cn('space-y-8', className)}
    >
      {/* Poll Details */}
      <PollFormDetails
        register={register}
        setValue={setValue}
        errors={errors}
        pollType={pollType}
      />

      {/* Options */}
      <PollFormOptions
        register={register}
        errors={errors}
        fieldArray={fieldArray}
      />

      {/* Settings */}
      <PollFormSettings
        register={register}
        watch={watch}
        errors={errors}
        pollType={pollType}
        allowMultiple={allowMultiple}
        options={options}
      />

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
        </Button>
      </div>
    </form>
  );
}
