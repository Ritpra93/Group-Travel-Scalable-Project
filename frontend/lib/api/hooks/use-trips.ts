/**
 * Trips Hooks
 * TanStack Query hooks for trip operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { tripsService } from '../services/trips.service';
import type { CreateTripDTO, UpdateTripDTO } from '@/types/api.types';
import type { TripStatus } from '@/types';

// ============================================================================
// Query Keys
// ============================================================================

export const tripsKeys = {
  all: ['trips'] as const,
  lists: () => [...tripsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...tripsKeys.lists(), filters] as const,
  details: () => [...tripsKeys.all, 'detail'] as const,
  detail: (id: string) => [...tripsKeys.details(), id] as const,
};

// ============================================================================
// Trips Queries
// ============================================================================

/**
 * Get all trips with optional filters
 */
export function useTrips(params?: {
  groupId?: string;
  status?: TripStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: tripsKeys.list(params || {}),
    queryFn: () => tripsService.getTrips(params),
  });
}

/**
 * Get single trip by ID
 */
export function useTrip(tripId: string) {
  return useQuery({
    queryKey: tripsKeys.detail(tripId),
    queryFn: () => tripsService.getTrip(tripId),
    enabled: !!tripId,
  });
}

// ============================================================================
// Trips Mutations
// ============================================================================

/**
 * Create new trip
 */
export function useCreateTrip() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateTripDTO) => tripsService.createTrip(data),
    onSuccess: (newTrip) => {
      // Invalidate trips list
      queryClient.invalidateQueries({ queryKey: tripsKeys.lists() });
      // Navigate to new trip
      router.push(`/trips/${newTrip.id}`);
    },
  });
}

/**
 * Update existing trip
 */
export function useUpdateTrip(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTripDTO) => tripsService.updateTrip(tripId, data),
    onSuccess: (updatedTrip) => {
      // Update trip detail cache
      queryClient.setQueryData(tripsKeys.detail(tripId), updatedTrip);
      // Invalidate trips list
      queryClient.invalidateQueries({ queryKey: tripsKeys.lists() });
    },
  });
}

/**
 * Delete trip
 */
export function useDeleteTrip() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (tripId: string) => tripsService.deleteTrip(tripId),
    onSuccess: (_, tripId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: tripsKeys.detail(tripId) });
      // Invalidate trips list
      queryClient.invalidateQueries({ queryKey: tripsKeys.lists() });
      // Navigate back to trips list
      router.push('/trips');
    },
  });
}

/**
 * Update trip status
 */
export function useUpdateTripStatus(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: TripStatus) =>
      tripsService.updateTripStatus(tripId, status),
    onSuccess: (updatedTrip) => {
      // Update trip detail cache
      queryClient.setQueryData(tripsKeys.detail(tripId), updatedTrip);
      // Invalidate trips list
      queryClient.invalidateQueries({ queryKey: tripsKeys.lists() });
    },
  });
}
