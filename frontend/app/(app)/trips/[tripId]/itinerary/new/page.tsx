/**
 * Add New Itinerary Item Page
 * Form to add a new item to the trip itinerary
 */

'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTrip } from '@/lib/api/hooks/use-trips';
import { useCreateItineraryItem } from '@/lib/api/hooks/use-itinerary';
import { ItineraryForm } from '@/components/patterns/itinerary-form';
import type { CreateItineraryItemFormData } from '@/lib/schemas/itinerary.schema';

interface NewItineraryItemPageProps {
  params: Promise<{ tripId: string }>;
}

export default function NewItineraryItemPage({ params }: NewItineraryItemPageProps) {
  const { tripId } = use(params);

  // Fetch trip for context
  const { data: trip, isLoading: isLoadingTrip } = useTrip(tripId);

  // Create mutation
  const createItem = useCreateItineraryItem(tripId);

  const handleSubmit = (data: CreateItineraryItemFormData) => {
    // Transform form data to API format
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
    };

    createItem.mutate(apiData);
  };

  if (isLoadingTrip) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent mx-auto mb-4" />
          <p className="text-zinc-500">Loading...</p>
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
          <h1 className="text-2xl font-semibold text-zinc-900">Add to Itinerary</h1>
          <p className="text-zinc-500">{trip?.name}</p>
        </div>
      </div>

      {/* Error Display */}
      {createItem.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            {(createItem.error as Error).message || 'Failed to add item'}
          </p>
        </div>
      )}

      {/* Form */}
      <ItineraryForm
        tripId={tripId}
        onSubmit={handleSubmit}
        isSubmitting={createItem.isPending}
        mode="create"
      />
    </div>
  );
}
