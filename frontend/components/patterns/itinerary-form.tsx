/**
 * ItineraryForm Component
 * Form for creating and editing itinerary items
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  Car,
  Compass,
  UtensilsCrossed,
  MoreHorizontal,
  Clock,
  MapPin,
  DollarSign,
  Link as LinkIcon,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  createItineraryItemSchema,
  ITINERARY_ITEM_TYPES,
  ITEM_TYPE_LABELS,
  ITEM_TYPE_DESCRIPTIONS,
  type CreateItineraryItemFormData,
} from '@/lib/schemas/itinerary.schema';
import type { ItineraryItemType, ItineraryItem } from '@/types/models.types';

// ============================================================================
// Types
// ============================================================================

export interface ItineraryFormProps {
  tripId: string;
  onSubmit: (data: CreateItineraryItemFormData) => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<ItineraryItem>;
  mode?: 'create' | 'edit';
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

const ITEM_TYPE_ICONS: Record<ItineraryItemType, typeof Building2> = {
  ACCOMMODATION: Building2,
  TRANSPORT: Car,
  ACTIVITY: Compass,
  MEAL: UtensilsCrossed,
  CUSTOM: MoreHorizontal,
};

function formatDateTimeLocal(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  return date.toISOString().slice(0, 16);
}

// ============================================================================
// Component
// ============================================================================

export function ItineraryForm({
  tripId,
  onSubmit,
  isSubmitting = false,
  defaultValues,
  mode = 'create',
  className,
}: ItineraryFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateItineraryItemFormData>({
    resolver: zodResolver(createItineraryItemSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      type: defaultValues?.type || 'ACTIVITY',
      startTime: formatDateTimeLocal(defaultValues?.startTime) || '',
      endTime: formatDateTimeLocal(defaultValues?.endTime) || '',
      location: defaultValues?.location || '',
      cost: defaultValues?.cost ? parseFloat(defaultValues.cost) : undefined,
      url: defaultValues?.url || '',
      notes: defaultValues?.notes || '',
    },
    mode: 'onChange',
  });

  const itemType = watch('type');

  const onFormSubmit = (data: CreateItineraryItemFormData) => {
    // Clean up optional fields
    const cleanedData = {
      ...data,
      description: data.description?.trim() || undefined,
      endTime: data.endTime?.trim() || undefined,
      location: data.location?.trim() || undefined,
      url: data.url?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      cost: data.cost || undefined,
    };

    onSubmit(cleanedData);
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className={cn('space-y-6', className)}
    >
      {/* Item Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What type of item is this?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ITINERARY_ITEM_TYPES.map((type) => {
              const Icon = ITEM_TYPE_ICONS[type];
              const isSelected = itemType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue('type', type)}
                  className={cn(
                    'p-4 rounded-lg border-2 text-center transition-all',
                    isSelected
                      ? 'border-zinc-900 bg-zinc-50'
                      : 'border-zinc-200 hover:border-zinc-300'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-6 h-6 mx-auto mb-2',
                      isSelected ? 'text-zinc-900' : 'text-zinc-400'
                    )}
                  />
                  <p
                    className={cn(
                      'font-medium text-sm',
                      isSelected ? 'text-zinc-900' : 'text-zinc-600'
                    )}
                  >
                    {ITEM_TYPE_LABELS[type]}
                  </p>
                </button>
              );
            })}
          </div>
          {errors.type && (
            <p className="mt-2 text-sm text-red-600">{errors.type.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Basic Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('title')}
              placeholder={`e.g., ${
                itemType === 'ACCOMMODATION'
                  ? 'Hilton Tokyo Bay'
                  : itemType === 'TRANSPORT'
                    ? 'Flight to Tokyo'
                    : itemType === 'MEAL'
                      ? 'Dinner at Ichiran Ramen'
                      : 'Visit Senso-ji Temple'
              }`}
              error={errors.title?.message}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Description{' '}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Add more details about this item..."
              className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Time & Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            Time & Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Start Time <span className="text-red-500">*</span>
            </label>
            <Input
              type="datetime-local"
              {...register('startTime')}
              error={errors.startTime?.message}
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              End Time{' '}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <Input
              type="datetime-local"
              {...register('endTime')}
              error={errors.endTime?.message}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location{' '}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <Input
              {...register('location')}
              placeholder="e.g., 1-1 Maihama, Urayasu, Chiba, Japan"
              error={errors.location?.message}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            Additional Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cost */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Cost{' '}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register('cost')}
              placeholder="0.00"
              error={errors.cost?.message}
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              <LinkIcon className="w-4 h-4 inline mr-1" />
              Booking URL{' '}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <Input
              type="url"
              {...register('url')}
              placeholder="https://..."
              error={errors.url?.message}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Notes{' '}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Any additional notes or reminders..."
              className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? mode === 'create'
              ? 'Adding...'
              : 'Saving...'
            : mode === 'create'
              ? 'Add to Itinerary'
              : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
