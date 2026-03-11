/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import apiClient from '@/lib/api/client';
import type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '@/types/api.types';
import type { User } from '@/types/models.types';

// ============================================================================
// Auth Service
// ============================================================================

export const authService = {
  /**
   * Register a new user
   * POST /auth/register
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      data
    );
    return response.data.data!;
  },

  /**
   * Login with email and password
   * POST /auth/login
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      data
    );
    return response.data.data!;
  },

  /**
   * Logout current user
   * POST /auth/logout
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  /**
   * Refresh access token using refresh token cookie
   * POST /auth/refresh
   */
  refresh: async (): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/refresh'
    );
    return response.data.data!;
  },

  /**
   * Get current authenticated user
   * GET /auth/me
   */
  me: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },

  /**
   * Request a password reset link
   * POST /auth/forgot-password
   */
  forgotPassword: async (data: { email: string }): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/forgot-password',
      data
    );
    return response.data.data!;
  },

  /**
   * Reset password using a valid token
   * POST /auth/reset-password
   */
  resetPassword: async (data: { token: string; password: string }): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/reset-password',
      data
    );
    return response.data.data!;
  },
};
