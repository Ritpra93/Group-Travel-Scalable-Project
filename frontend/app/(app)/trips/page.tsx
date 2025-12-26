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
import { TripStatus } from '@/types/models.types';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-dark">Trips</h1>
          <p className="text-stone-600 mt-1">
            Plan and manage your adventures
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push('/trips/new')}
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Trip
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <SearchBar
          placeholder="Search trips..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />

        {/* Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-stone-700">Status:</span>
          {statusFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === filter.value
                  ? 'bg-primary text-white'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-96 rounded-xl bg-stone-100 animate-pulse"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}

      {/* Pagination Info */}
      {!isLoading && !error && hasTrips && data && (
        <div className="flex items-center justify-between pt-4 border-t border-stone-200">
          <p className="text-sm text-stone-600">
            Showing {trips.length} of {data.total} trips
          </p>
        </div>
      )}
    </div>
  );
}
