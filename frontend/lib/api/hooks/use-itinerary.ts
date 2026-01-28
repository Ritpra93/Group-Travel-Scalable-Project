/**
 * Itinerary Hooks
 * TanStack Query hooks for itinerary operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  itineraryService,
  type ListItineraryParams,
} from '../services/itinerary.service';
import type { CreateItineraryItemDTO, UpdateItineraryItemDTO } from '@/types/api.types';

// ============================================================================
// Query Keys
// ============================================================================

export const itineraryKeys = {
  all: ['itinerary'] as const,
  lists: () => [...itineraryKeys.all, 'list'] as const,
  list: (tripId: string, filters?: Record<string, unknown>) =>
    [...itineraryKeys.lists(), tripId, filters] as const,
  details: () => [...itineraryKeys.all, 'detail'] as const,
  detail: (tripId: string, itemId: string) =>
    [...itineraryKeys.details(), tripId, itemId] as const,
};

// ============================================================================
// Itinerary Queries
// ============================================================================

/**
 * Get all itinerary items for a trip
 */
export function useItinerary(tripId: string, params?: ListItineraryParams) {
  return useQuery({
    queryKey: itineraryKeys.list(tripId, params as Record<string, unknown>),
    queryFn: () => itineraryService.getItineraryItems(tripId, params),
    enabled: !!tripId,
  });
}

/**
 * Get single itinerary item by ID
 */
export function useItineraryItem(tripId: string, itemId: string) {
  return useQuery({
    queryKey: itineraryKeys.detail(tripId, itemId),
    queryFn: () => itineraryService.getItineraryItem(tripId, itemId),
    enabled: !!tripId && !!itemId,
  });
}

// ============================================================================
// Itinerary Mutations
// ============================================================================

/**
 * Create new itinerary item
 */
export function useCreateItineraryItem(tripId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateItineraryItemDTO) =>
      itineraryService.createItineraryItem(tripId, data),
    onSuccess: () => {
      // Invalidate itinerary list for this trip
      queryClient.invalidateQueries({ queryKey: itineraryKeys.list(tripId) });
      // Navigate back to itinerary page
      router.push(`/trips/${tripId}/itinerary`);
    },
  });
}

/**
 * Update existing itinerary item
 */
export function useUpdateItineraryItem(tripId: string, itemId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: UpdateItineraryItemDTO) =>
      itineraryService.updateItineraryItem(tripId, itemId, data),
    onSuccess: (updatedItem) => {
      // Update item detail cache
      queryClient.setQueryData(
        itineraryKeys.detail(tripId, itemId),
        updatedItem
      );
      // Invalidate itinerary list
      queryClient.invalidateQueries({ queryKey: itineraryKeys.list(tripId) });
      // Navigate back to itinerary page
      router.push(`/trips/${tripId}/itinerary`);
    },
  });
}

/**
 * Delete itinerary item
 */
export function useDeleteItineraryItem(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) =>
      itineraryService.deleteItineraryItem(tripId, itemId),
    onSuccess: (_, itemId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: itineraryKeys.detail(tripId, itemId),
      });
      // Invalidate itinerary list
      queryClient.invalidateQueries({ queryKey: itineraryKeys.list(tripId) });
    },
  });
}
