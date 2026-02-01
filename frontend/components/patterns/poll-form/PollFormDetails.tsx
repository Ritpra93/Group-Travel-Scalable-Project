/**
 * PollFormDetails Component
 * Step 1: Poll type selection, title, description
 */

'use client';

import {
  UseFormRegister,
  UseFormSetValue,
  FieldErrors,
} from 'react-hook-form';
import {
  Vote,
  MapPin,
  Calendar,
  Compass,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  POLL_TYPES,
  POLL_TYPE_LABELS,
  POLL_TYPE_DESCRIPTIONS,
} from '@/lib/schemas/polls.schema';
import type { PollType } from '@/types/models.types';

// Using any for form types to maintain compatibility with useForm's inferred types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface PollFormDetailsProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
  pollType: PollType;
}

const POLL_TYPE_ICONS: Record<PollType, typeof Vote> = {
  PLACE: MapPin,
  ACTIVITY: Compass,
  DATE: Calendar,
  CUSTOM: HelpCircle,
};

export function PollFormDetails({
  register,
  setValue,
  errors,
  pollType,
}: PollFormDetailsProps) {
  return (
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
            <p className="mt-2 text-sm text-red-600">
              {errors.type.message as string}
            </p>
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
            error={errors.title?.message as string | undefined}
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
  );
}
