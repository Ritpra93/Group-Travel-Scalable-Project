/**
 * Health Check API Service
 * Test backend connectivity and service health
 */

import apiClient from '@/lib/api/client';
import type { ApiResponse } from '@/types/api.types';

// ============================================================================
// Health Service
// ============================================================================

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

interface ReadinessStatus {
  status: string;
  timestamp: string;
  checks: {
    database: string;
    redis: string;
  };
}

export const healthService = {
  /**
   * Basic health check
   * GET /health
   */
  check: async (): Promise<HealthStatus> => {
    const response = await apiClient.get<ApiResponse<HealthStatus>>('/health');
    return response.data.data!;
  },

  /**
   * Readiness check (checks DB and Redis)
   * GET /health/ready
   */
  ready: async (): Promise<ReadinessStatus> => {
    const response = await apiClient.get<ApiResponse<ReadinessStatus>>(
      '/health/ready'
    );
    return response.data.data!;
  },
};
