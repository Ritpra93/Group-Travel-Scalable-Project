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
import { TripStatus } from '@/types';

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
  return response.data.data;
}

/**
 * Create new trip
 */
export async function createTrip(data: CreateTripDTO): Promise<Trip> {
  // Transform frontend field names to match backend expectations
  const { budget, description, imageUrl, ...rest } = data as any;

  // Build backend data - only include totalBudget if it's a valid number
  const backendData: any = {
    ...rest,
    currency: 'USD', // Default currency
  };

  // Only add totalBudget if budget is a valid number (not NaN, not undefined)
  if (typeof budget === 'number' && !isNaN(budget)) {
    backendData.totalBudget = budget;
  }

  // Only add description if it's not empty
  if (description && description.trim() !== '') {
    backendData.description = description;
  }

  // Only add imageUrl if it's not empty
  if (imageUrl && imageUrl.trim() !== '') {
    backendData.imageUrl = imageUrl;
  }

  console.log('[createTrip] Sending to backend:', backendData);

  const response = await apiClient.post('/trips', backendData);
  return response.data.data;
}

/**
 * Update existing trip
 */
export async function updateTrip(
  tripId: string,
  data: UpdateTripDTO
): Promise<Trip> {
  const response = await apiClient.patch(`/trips/${tripId}`, data);
  return response.data.data;
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
  return response.data.data;
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
