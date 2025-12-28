/**
 * Trips List Page
 * Browse and filter all trips
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MapPin } from 'lucide-react';
import { useTrips } from '@/lib/api/hooks/use-trips';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/ui/search-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { TripCard } from '@/components/patterns/trip-card';
import { TripStatus } from '@/types';

// ============================================================================
// Trips Page Component
// ============================================================================

const statusFilters = [
  { label: 'All', value: undefined },
  { label: 'Planning', value: TripStatus.PLANNING },
  { label: 'Upcoming', value: TripStatus.UPCOMING },
  { label: 'Ongoing', value: TripStatus.ONGOING },
  { label: 'Completed', value: TripStatus.COMPLETED },
];

export default function TripsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TripStatus | undefined>(
    undefined
  );

  // Fetch trips with filters
  const { data, isLoading, error } = useTrips({
    search: search || undefined,
    status: statusFilter,
  });

  const trips = data?.data || [];
  const hasTrips = trips.length > 0;
  const isFiltering = search.length > 0 || statusFilter !== undefined;

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-5xl font-semibold text-stone-900 mb-3 tracking-tight">
            Trips
          </h1>
          <p className="text-lg text-stone-600 font-light leading-relaxed">
            Plan and manage your adventures
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => router.push('/trips/new')}
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Trip
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="max-w-2xl">
          <SearchBar
            placeholder="Search trips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-stone-600">Filter:</span>
          {statusFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                statusFilter === filter.value
                  ? 'bg-stone-900 text-white shadow-soft'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-120 rounded-2xl bg-stone-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">
            Failed to load trips. Please try again.
          </p>
        </div>
      )}

      {/* Empty State - No Trips */}
      {!isLoading && !error && !hasTrips && !isFiltering && (
        <EmptyState
          icon={MapPin}
          title="No trips yet"
          description="Create your first trip to start planning your next adventure."
          action={{
            label: 'Plan Your First Trip',
            onClick: () => router.push('/trips/new'),
          }}
        />
      )}

      {/* Empty State - No Search/Filter Results */}
      {!isLoading && !error && !hasTrips && isFiltering && (
        <EmptyState
          icon={MapPin}
          title="No trips found"
          description="No trips match your current filters. Try adjusting your search or filters."
          action={{
            label: 'Clear Filters',
            onClick: () => {
              setSearch('');
              setStatusFilter(undefined);
            },
          }}
        />
      )}

      {/* Trips Grid */}
      {!isLoading && !error && hasTrips && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}

      {/* Pagination Info */}
      {!isLoading && !error && hasTrips && data && (
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-stone-200">
          <p className="text-sm text-stone-500 font-light">
            Showing {trips.length} of {data.total} trips
          </p>
        </div>
      )}
    </div>
  );
}
