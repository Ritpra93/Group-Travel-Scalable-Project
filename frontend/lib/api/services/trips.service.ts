/**
 * Trips Service
 * API calls for trip management
 */

import { apiClient } from '../client';
import type {
  Trip,
  CreateTripDTO,
  UpdateTripDTO,
  PaginatedResponse,
} from '@/types/api.types';
import { TripStatus } from '@/types/models.types';

// ============================================================================
// Trips CRUD
// ============================================================================

/**
 * Get all trips with optional filters
 */
export async function getTrips(params?: {
  groupId?: string;
  status?: TripStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Trip>> {
  const response = await apiClient.get('/trips', { params });
  return response.data;
}

/**
 * Get single trip by ID
 */
export async function getTrip(tripId: string): Promise<Trip> {
  const response = await apiClient.get(`/trips/${tripId}`);
  return response.data;
}

/**
 * Create new trip
 */
export async function createTrip(data: CreateTripDTO): Promise<Trip> {
  const response = await apiClient.post('/trips', data);
  return response.data;
}

/**
 * Update existing trip
 */
export async function updateTrip(
  tripId: string,
  data: UpdateTripDTO
): Promise<Trip> {
  const response = await apiClient.patch(`/trips/${tripId}`, data);
  return response.data;
}

/**
 * Delete trip
 */
export async function deleteTrip(tripId: string): Promise<void> {
  await apiClient.delete(`/trips/${tripId}`);
}

/**
 * Update trip status
 */
export async function updateTripStatus(
  tripId: string,
  status: TripStatus
): Promise<Trip> {
  const response = await apiClient.patch(`/trips/${tripId}/status`, {
    status,
  });
  return response.data;
}

// ============================================================================
// Exports
// ============================================================================

export const tripsService = {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  updateTripStatus,
};
