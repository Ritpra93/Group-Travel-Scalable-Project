/**
 * PollForm Component
 * Form for creating and editing polls
 */

'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  X,
  Vote,
  MapPin,
  Calendar,
  Compass,
  HelpCircle,
  Clock,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  createPollSchema,
  POLL_TYPES,
  POLL_TYPE_LABELS,
  POLL_TYPE_DESCRIPTIONS,
  type CreatePollFormData,
} from '@/lib/schemas/polls.schema';
import type { PollType } from '@/types/models.types';

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
// Helpers
// ============================================================================

const POLL_TYPE_ICONS: Record<PollType, typeof Vote> = {
  PLACE: MapPin,
  ACTIVITY: Compass,
  DATE: Calendar,
  CUSTOM: HelpCircle,
};

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
  } = useForm<CreatePollFormData>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'CUSTOM',
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  const pollType = watch('type');
  const allowMultiple = watch('allowMultiple');
  const options = watch('options');

  // Step validation
  const validateStep = async (stepNum: number): Promise<boolean> => {
    const fieldsToValidate: (keyof CreatePollFormData)[] =
      stepNum === 1
        ? ['title', 'type']
        : stepNum === 2
          ? ['options']
          : [];

    if (fieldsToValidate.length === 0) return true;
    const result = await trigger(fieldsToValidate);
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="w-5 h-5" />
              Poll Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Poll Type Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-3">
                What are you polling about?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {POLL_TYPES.map((type) => {
                  const Icon = POLL_TYPE_ICONS[type];
                  const isSelected = pollType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue('type', type)}
                      className={cn(
                        'p-4 rounded-lg border-2 text-left transition-all',
                        isSelected
                          ? 'border-zinc-900 bg-zinc-50'
                          : 'border-zinc-200 hover:border-zinc-300'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            'w-5 h-5',
                            isSelected ? 'text-zinc-900' : 'text-zinc-400'
                          )}
                        />
                        <div>
                          <p
                            className={cn(
                              'font-medium text-sm',
                              isSelected ? 'text-zinc-900' : 'text-zinc-700'
                            )}
                          >
                            {POLL_TYPE_LABELS[type]}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {POLL_TYPE_DESCRIPTIONS[type]}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.type && (
                <p className="mt-2 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Poll Question
              </label>
              <Input
                {...register('title')}
                placeholder="e.g., Where should we stay in Tokyo?"
                error={errors.title?.message}
              />
            </div>

            {/* Description (optional) */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Description{' '}
                <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Add more context about this poll..."
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Options */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Poll Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-500 mb-4">
              Add at least 2 options for people to vote on
            </p>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 rounded-lg border border-zinc-200 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <Input
                      {...register(`options.${index}.label`)}
                      placeholder={`Option ${index + 1}`}
                      error={errors.options?.[index]?.label?.message}
                    />
                  </div>
                  {fields.length > 2 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Input
                  {...register(`options.${index}.description`)}
                  placeholder="Add description (optional)"
                  className="text-sm"
                />
              </div>
            ))}

            {errors.options?.message && (
              <p className="text-sm text-red-600">{errors.options.message}</p>
            )}

            {fields.length < 10 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ label: '', description: '' })}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Settings */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Poll Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Allow Multiple */}
            <div className="flex items-start gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('allowMultiple')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
              <div>
                <p className="font-medium text-zinc-900">Allow multiple choices</p>
                <p className="text-sm text-zinc-500">
                  Let people vote for more than one option
                </p>
              </div>
            </div>

            {/* Max Votes (only if allowMultiple) */}
            {allowMultiple && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Maximum votes per person{' '}
                  <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <Input
                  type="number"
                  {...register('maxVotes', { valueAsNumber: true })}
                  placeholder="No limit"
                  min={1}
                  max={options.length}
                  error={errors.maxVotes?.message}
                />
              </div>
            )}

            {/* Close Date */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Automatically close poll{' '}
                <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <Input
                type="datetime-local"
                {...register('closesAt')}
                error={errors.closesAt?.message}
              />
              <p className="text-xs text-zinc-500 mt-1">
                Leave empty for no automatic closing
              </p>
            </div>

            {/* Preview */}
            <div className="pt-4 border-t border-zinc-200">
              <h4 className="font-medium text-zinc-900 mb-3">Preview</h4>
              <div className="p-4 rounded-lg bg-zinc-50 space-y-2">
                <p className="font-medium text-zinc-900">{watch('title') || 'Your poll question'}</p>
                {watch('description') && (
                  <p className="text-sm text-zinc-600">{watch('description')}</p>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-2 py-1 text-xs bg-zinc-200 text-zinc-700 rounded">
                    {POLL_TYPE_LABELS[pollType]}
                  </span>
                  {allowMultiple && (
                    <span className="px-2 py-1 text-xs bg-zinc-200 text-zinc-700 rounded">
                      Multiple choice
                    </span>
                  )}
                  <span className="px-2 py-1 text-xs bg-zinc-200 text-zinc-700 rounded">
                    {options.filter((o) => o.label.trim()).length} options
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
