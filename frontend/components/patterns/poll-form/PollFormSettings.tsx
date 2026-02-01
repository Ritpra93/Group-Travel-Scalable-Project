/**
 * PollFormSettings Component
 * Step 3: Settings like allow multiple, max votes, close date, and preview
 */

'use client';

import { UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';
import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { POLL_TYPE_LABELS } from '@/lib/schemas/polls.schema';
import type { PollType } from '@/types/models.types';

// Using any for form types to maintain compatibility with useForm's inferred types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface PollFormSettingsProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  errors: FieldErrors<any>;
  pollType: PollType;
  allowMultiple: boolean;
  options: Array<{ label: string; description?: string }>;
}

export function PollFormSettings({
  register,
  watch,
  errors,
  pollType,
  allowMultiple,
  options,
}: PollFormSettingsProps) {
  return (
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
              error={errors.maxVotes?.message as string | undefined}
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
            error={errors.closesAt?.message as string | undefined}
          />
          <p className="text-xs text-zinc-500 mt-1">
            Leave empty for no automatic closing
          </p>
        </div>

        {/* Preview */}
        <div className="pt-4 border-t border-zinc-200">
          <h4 className="font-medium text-zinc-900 mb-3">Preview</h4>
          <div className="p-4 rounded-lg bg-zinc-50 space-y-2">
            <p className="font-medium text-zinc-900">
              {watch('title') || 'Your poll question'}
            </p>
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
  );
}
