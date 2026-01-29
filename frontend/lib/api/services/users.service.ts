/**
 * Users Service
 * API calls for user profile and interest operations
 */

import { apiClient } from '../client';
import type { User } from '@/types/models.types';

// ============================================================================
// Types
// ============================================================================

export interface UpdateProfileDTO {
  name?: string;
  bio?: string;
  timezone?: string;
  avatarUrl?: string;
  interests?: string[];
}

export interface UpdateInterestsDTO {
  interests: string[];
}

export interface InterestOverlap {
  userId: string;
  userName: string;
  userAvatar: string | null;
  interests: string[];
  commonInterests: string[];
  overlapScore: number;
}

export interface GroupInterestAnalysis {
  members: InterestOverlap[];
  topInterests: { interest: string; count: number }[];
  totalMembers: number;
  averageOverlap: number;
}

export interface InterestCategories {
  categories: string[];
}

// ============================================================================
// User Profile
// ============================================================================

/**
 * Get current user's profile
 */
export async function getMyProfile(): Promise<User> {
  const response = await apiClient.get('/users/me');
  return response.data.data;
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<User> {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data.data;
}

/**
 * Update current user's profile
 */
export async function updateMyProfile(data: UpdateProfileDTO): Promise<User> {
  const response = await apiClient.put('/users/me', data);
  return response.data.data;
}

/**
 * Update current user's interests
 */
export async function updateMyInterests(data: UpdateInterestsDTO): Promise<User> {
  const response = await apiClient.put('/users/me/interests', data);
  return response.data.data;
}

// ============================================================================
// Interest Categories
// ============================================================================

/**
 * Get available interest categories
 */
export async function getInterestCategories(): Promise<InterestCategories> {
  const response = await apiClient.get('/users/interests/categories');
  return response.data.data;
}

// ============================================================================
// Group Interest Analysis
// ============================================================================

/**
 * Get interest analysis for a group
 */
export async function getGroupInterestAnalysis(groupId: string): Promise<GroupInterestAnalysis> {
  const response = await apiClient.get(`/groups/${groupId}/interests`);
  return response.data.data;
}

/**
 * Get group members with their interests
 */
export async function getGroupMembersWithInterests(groupId: string): Promise<User[]> {
  const response = await apiClient.get(`/groups/${groupId}/interests/members`);
  return response.data.data;
}

// ============================================================================
// Exports
// ============================================================================

export const usersService = {
  getMyProfile,
  getUserProfile,
  updateMyProfile,
  updateMyInterests,
  getInterestCategories,
  getGroupInterestAnalysis,
  getGroupMembersWithInterests,
};
