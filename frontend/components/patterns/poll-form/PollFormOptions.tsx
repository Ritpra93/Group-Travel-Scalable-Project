/**
 * PollFormOptions Component
 * Step 2: Poll options management
 */

'use client';

import {
  UseFormRegister,
  FieldErrors,
  UseFieldArrayReturn,
} from 'react-hook-form';
import { Plus, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// Using any for form types to maintain compatibility with useForm's inferred types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface PollFormOptionsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  fieldArray: UseFieldArrayReturn<any, 'options', 'id'>;
}

export function PollFormOptions({
  register,
  errors,
  fieldArray,
}: PollFormOptionsProps) {
  const { fields, append, remove } = fieldArray;

  return (
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
                  error={(errors.options as any)?.[index]?.label?.message as string | undefined}
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
          <p className="text-sm text-red-600">
            {errors.options.message as string}
          </p>
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
  );
}
