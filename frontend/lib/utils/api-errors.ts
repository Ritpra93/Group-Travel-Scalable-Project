/**
 * API Error Utilities
 * Handle common API error patterns including conflict detection
 */

import type { AxiosError } from 'axios';

// ============================================================================
// Types
// ============================================================================

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ConflictDetails {
  serverUpdatedAt: string;
  clientUpdatedAt: string;
}

// ============================================================================
// Error Checking
// ============================================================================

/**
 * Check if an error is an Axios error with a response
 */
export function isApiError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

/**
 * Check if an error is a conflict error (409)
 */
export function isConflictError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.response?.status === 409;
}

/**
 * Get conflict details from an error
 */
export function getConflictDetails(error: unknown): ConflictDetails | null {
  if (!isConflictError(error)) return null;
  const details = (error as AxiosError<ApiErrorResponse>).response?.data?.error?.details;
  if (
    details &&
    typeof details === 'object' &&
    'serverUpdatedAt' in details &&
    'clientUpdatedAt' in details
  ) {
    return details as ConflictDetails;
  }
  return null;
}

/**
 * Get a user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    // Check for specific error codes
    if (isConflictError(error)) {
      return 'This item was modified by another user. Please refresh and try again.';
    }

    // Use API error message if available
    const apiMessage = error.response?.data?.error?.message;
    if (apiMessage) return apiMessage;

    // HTTP status-based messages
    switch (error.response?.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested item was not found.';
      case 500:
        return 'An unexpected error occurred. Please try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  // Generic error
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

/**
 * Get the error code from an API error
 */
export function getErrorCode(error: unknown): string | null {
  if (!isApiError(error)) return null;
  return error.response?.data?.error?.code || null;
}
