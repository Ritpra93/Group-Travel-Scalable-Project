/**
 * Create New Poll Page
 * Form to create a new poll for a trip
 */

'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTrip } from '@/lib/api/hooks/use-trips';
import { useCreatePoll } from '@/lib/api/hooks/use-polls';
import { PollForm } from '@/components/patterns/poll-form';
import type { CreatePollFormData } from '@/lib/schemas/polls.schema';

interface NewPollPageProps {
  params: Promise<{ tripId: string }>;
}

export default function NewPollPage({ params }: NewPollPageProps) {
  const { tripId } = use(params);

  // Fetch trip for context
  const { data: trip, isLoading: isLoadingTrip } = useTrip(tripId);

  // Create poll mutation
  const createPoll = useCreatePoll(tripId);

  const handleSubmit = (data: CreatePollFormData & { tripId: string }) => {
    // Transform form data to API format
    const apiData = {
      tripId: data.tripId,
      title: data.title,
      description: data.description || undefined,
      type: data.type,
      allowMultiple: data.allowMultiple,
      maxVotes: data.maxVotes || undefined,
      closesAt: data.closesAt || undefined,
      options: data.options.map((opt, index) => ({
        label: opt.label,
        description: opt.description || undefined,
        displayOrder: index,
      })),
    };

    createPoll.mutate(apiData);
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
          href={`/trips/${tripId}/polls`}
          className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Create Poll</h1>
          <p className="text-zinc-500">{trip?.name}</p>
        </div>
      </div>

      {/* Error Display */}
      {createPoll.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            {(createPoll.error as Error).message || 'Failed to create poll'}
          </p>
        </div>
      )}

      {/* Form */}
      <PollForm
        tripId={tripId}
        onSubmit={handleSubmit}
        isSubmitting={createPoll.isPending}
      />
    </div>
  );
}
