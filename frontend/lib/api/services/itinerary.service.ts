/**
 * Itinerary Service
 * API calls for itinerary item management
 */

import { apiClient } from '../client';
import type {
  ItineraryItem,
  CreateItineraryItemDTO,
  UpdateItineraryItemDTO,
  PaginatedResponse,
} from '@/types/api.types';
import type { ItineraryItemType } from '@/types/models.types';

// ============================================================================
// Types
// ============================================================================

export interface ListItineraryParams {
  type?: ItineraryItemType;
  startDate?: string;
  endDate?: string;
  sortBy?: 'startTime' | 'createdAt' | 'type';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================================================
// Itinerary CRUD
// ============================================================================

/**
 * Get all itinerary items for a trip
 */
export async function getItineraryItems(
  tripId: string,
  params?: ListItineraryParams
): Promise<PaginatedResponse<ItineraryItem>> {
  const response = await apiClient.get(`/trips/${tripId}/itinerary`, { params });
  return response.data;
}

/**
 * Get single itinerary item by ID
 */
export async function getItineraryItem(
  tripId: string,
  itemId: string
): Promise<ItineraryItem> {
  const response = await apiClient.get(`/trips/${tripId}/itinerary/${itemId}`);
  return response.data.data;
}

/**
 * Create new itinerary item
 */
export async function createItineraryItem(
  tripId: string,
  data: CreateItineraryItemDTO
): Promise<ItineraryItem> {
  const response = await apiClient.post(`/trips/${tripId}/itinerary`, data);
  return response.data.data;
}

/**
 * Update existing itinerary item
 */
export async function updateItineraryItem(
  tripId: string,
  itemId: string,
  data: UpdateItineraryItemDTO
): Promise<ItineraryItem> {
  const response = await apiClient.put(`/trips/${tripId}/itinerary/${itemId}`, data);
  return response.data.data;
}

/**
 * Delete itinerary item
 */
export async function deleteItineraryItem(
  tripId: string,
  itemId: string
): Promise<void> {
  await apiClient.delete(`/trips/${tripId}/itinerary/${itemId}`);
}

// ============================================================================
// Exports
// ============================================================================

export const itineraryService = {
  getItineraryItems,
  getItineraryItem,
  createItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
};
