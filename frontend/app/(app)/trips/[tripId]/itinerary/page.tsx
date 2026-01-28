/**
 * Trip Itinerary Page
 * List all itinerary items for a trip
 */

'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Calendar, ArrowLeft, Filter, List, LayoutGrid } from 'lucide-react';
import { useTrip } from '@/lib/api/hooks/use-trips';
import { useItinerary, useDeleteItineraryItem } from '@/lib/api/hooks/use-itinerary';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ItineraryItemCard } from '@/components/patterns/itinerary-item-card';
import { ITEM_TYPE_LABELS, ITINERARY_ITEM_TYPES } from '@/lib/schemas/itinerary.schema';
import { cn } from '@/lib/utils/cn';
import type { ItineraryItemType, ItineraryItem } from '@/types/models.types';

interface ItineraryPageProps {
  params: Promise<{ tripId: string }>;
}

// Group items by date
function groupByDate(items: ItineraryItem[]): Record<string, ItineraryItem[]> {
  const groups: Record<string, ItineraryItem[]> = {};

  items.forEach((item) => {
    const date = new Date(item.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
  });

  return groups;
}

export default function ItineraryPage({ params }: ItineraryPageProps) {
  const { tripId } = use(params);
  const [typeFilter, setTypeFilter] = useState<ItineraryItemType | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');

  // Fetch trip and itinerary
  const { data: trip, isLoading: isLoadingTrip } = useTrip(tripId);
  const { data: itineraryData, isLoading: isLoadingItinerary } = useItinerary(tripId, {
    type: typeFilter === 'ALL' ? undefined : typeFilter,
    sortBy: 'startTime',
    sortOrder: 'asc',
  });

  // Delete mutation
  const deleteItem = useDeleteItineraryItem(tripId);

  const items = itineraryData?.data || [];
  const isLoading = isLoadingTrip || isLoadingItinerary;

  // Group items by date for grouped view
  const groupedItems = useMemo(() => groupByDate(items), [items]);
  const sortedDates = useMemo(
    () =>
      Object.keys(groupedItems).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      ),
    [groupedItems]
  );

  // Track which item is being deleted
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setDeletingItemId(itemId);
    try {
      await deleteItem.mutateAsync(itemId);
    } finally {
      setDeletingItemId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent mx-auto mb-4" />
          <p className="text-zinc-500">Loading itinerary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href={`/trips/${tripId}`}
            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Itinerary</h1>
            <p className="text-zinc-500">{trip?.name}</p>
          </div>
        </div>
        <Link href={`/trips/${tripId}/itinerary/new`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </Link>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-full transition-colors',
                typeFilter === 'ALL'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              )}
            >
              All
            </button>
            {ITINERARY_ITEM_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-full transition-colors',
                  typeFilter === type
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                )}
              >
                {ITEM_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grouped')}
            className={cn(
              'p-1.5 rounded transition-colors',
              viewMode === 'grouped' ? 'bg-white shadow-sm' : 'hover:bg-zinc-200'
            )}
            title="Group by date"
          >
            <LayoutGrid className="w-4 h-4 text-zinc-600" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-1.5 rounded transition-colors',
              viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-zinc-200'
            )}
            title="List view"
          >
            <List className="w-4 h-4 text-zinc-600" />
          </button>
        </div>
      </div>

      {/* Itinerary Items */}
      {items.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No itinerary items yet"
          description={
            typeFilter === 'ALL'
              ? "Start building your trip itinerary by adding activities, accommodations, and more"
              : `No ${ITEM_TYPE_LABELS[typeFilter].toLowerCase()} items found`
          }
          action={
            typeFilter !== 'ALL'
              ? { label: 'View All Items', onClick: () => setTypeFilter('ALL') }
              : undefined
          }
        >
          {typeFilter === 'ALL' && (
            <Link href={`/trips/${tripId}/itinerary/new`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            </Link>
          )}
        </EmptyState>
      ) : viewMode === 'grouped' ? (
        // Grouped by Date View
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <div key={date}>
              <h2 className="text-lg font-medium text-zinc-900 mb-4 sticky top-0 bg-zinc-50 py-2 -mx-2 px-2">
                {date}
              </h2>
              <div className="space-y-3">
                {(groupedItems[date] || [])
                  .sort(
                    (a, b) =>
                      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                  )
                  .map((item) => (
                    <ItineraryItemCard
                      key={item.id}
                      item={item}
                      tripId={tripId}
                      onDelete={handleDelete}
                      isDeleting={deletingItemId === item.id}
                      canManage={true}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Simple List View
        <div className="space-y-3">
          {items.map((item) => (
            <ItineraryItemCard
              key={item.id}
              item={item}
              tripId={tripId}
              onDelete={handleDelete}
              isDeleting={deletingItemId === item.id}
              canManage={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
