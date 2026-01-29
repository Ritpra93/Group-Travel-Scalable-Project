/**
 * Edit Itinerary Item Page
 * Form to edit an existing item in the trip itinerary
 */

'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTrip } from '@/lib/api/hooks/use-trips';
import { useItineraryItem, useUpdateItineraryItem } from '@/lib/api/hooks/use-itinerary';
import { ItineraryForm } from '@/components/patterns/itinerary-form';
import { Button } from '@/components/ui/button';
import { isConflictError, getErrorMessage } from '@/lib/utils/api-errors';
import type { CreateItineraryItemFormData } from '@/lib/schemas/itinerary.schema';

interface EditItineraryItemPageProps {
  params: Promise<{ tripId: string; itemId: string }>;
}

export default function EditItineraryItemPage({ params }: EditItineraryItemPageProps) {
  const { tripId, itemId } = use(params);
  const router = useRouter();
  const [showConflict, setShowConflict] = useState(false);

  // Fetch trip for context
  const { data: trip, isLoading: isLoadingTrip } = useTrip(tripId);

  // Fetch existing item
  const { data: item, isLoading: isLoadingItem, error: itemError, refetch } = useItineraryItem(tripId, itemId);

  // Update mutation
  const updateItem = useUpdateItineraryItem(tripId, itemId);

  const handleSubmit = (data: CreateItineraryItemFormData) => {
    // Clear any previous conflict state
    setShowConflict(false);

    // Transform form data to API format, including clientUpdatedAt for optimistic locking
    const apiData = {
      title: data.title,
      description: data.description || undefined,
      type: data.type,
      startTime: data.startTime,
      endTime: data.endTime || undefined,
      location: data.location || undefined,
      cost: data.cost,
      url: data.url || undefined,
      notes: data.notes || undefined,
      // Send the item's updatedAt for conflict detection
      clientUpdatedAt: item?.updatedAt,
    };

    updateItem.mutate(apiData, {
      onError: (error) => {
        if (isConflictError(error)) {
          setShowConflict(true);
        }
      },
    });
  };

  const handleRefresh = async () => {
    setShowConflict(false);
    await refetch();
  };

  const isLoading = isLoadingTrip || isLoadingItem;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent mx-auto mb-4" />
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (itemError || !item) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/trips/${tripId}/itinerary`}
            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Item Not Found</h1>
          </div>
        </div>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">
            {(itemError as Error)?.message || 'The itinerary item could not be found.'}
          </p>
          <Link
            href={`/trips/${tripId}/itinerary`}
            className="mt-4 inline-block text-sm text-red-700 hover:text-red-800 underline"
          >
            Back to Itinerary
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/trips/${tripId}/itinerary`}
          className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Edit Item</h1>
          <p className="text-zinc-500">{trip?.name}</p>
        </div>
      </div>

      {/* Conflict Error Display */}
      {showConflict && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-amber-800">
                This item was modified by another user
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                Someone else updated this item while you were editing. Please refresh to see their changes, then make your updates.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/trips/${tripId}/itinerary`)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General Error Display */}
      {updateItem.error && !showConflict && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            {getErrorMessage(updateItem.error)}
          </p>
        </div>
      )}

      {/* Form */}
      <ItineraryForm
        tripId={tripId}
        onSubmit={handleSubmit}
        isSubmitting={updateItem.isPending}
        defaultValues={item}
        mode="edit"
      />
    </div>
  );
}
