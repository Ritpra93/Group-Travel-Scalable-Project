/**
 * Users Hooks
 * TanStack Query hooks for user profile and interest operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  usersService,
  type UpdateProfileDTO,
  type UpdateInterestsDTO,
} from '../services/users.service';

// ============================================================================
// Query Keys
// ============================================================================

export const usersKeys = {
  all: ['users'] as const,
  profile: () => [...usersKeys.all, 'profile'] as const,
  myProfile: () => [...usersKeys.profile(), 'me'] as const,
  userProfile: (userId: string) => [...usersKeys.profile(), userId] as const,
  interests: () => [...usersKeys.all, 'interests'] as const,
  categories: () => [...usersKeys.interests(), 'categories'] as const,
  groupInterests: (groupId: string) => [...usersKeys.interests(), 'group', groupId] as const,
  groupMembers: (groupId: string) => [...usersKeys.interests(), 'group', groupId, 'members'] as const,
};

// ============================================================================
// Profile Queries
// ============================================================================

/**
 * Get current user's profile
 */
export function useMyProfile() {
  return useQuery({
    queryKey: usersKeys.myProfile(),
    queryFn: () => usersService.getMyProfile(),
  });
}

/**
 * Get user profile by ID
 */
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: usersKeys.userProfile(userId),
    queryFn: () => usersService.getUserProfile(userId),
    enabled: !!userId,
  });
}

// ============================================================================
// Profile Mutations
// ============================================================================

/**
 * Update current user's profile
 */
export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileDTO) => usersService.updateMyProfile(data),
    onSuccess: (updatedUser) => {
      // Update profile cache
      queryClient.setQueryData(usersKeys.myProfile(), updatedUser);
      // Invalidate any user profile cache that might exist
      queryClient.invalidateQueries({ queryKey: usersKeys.userProfile(updatedUser.id) });
    },
  });
}

/**
 * Update current user's interests
 */
export function useUpdateMyInterests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateInterestsDTO) => usersService.updateMyInterests(data),
    onSuccess: (updatedUser) => {
      // Update profile cache
      queryClient.setQueryData(usersKeys.myProfile(), updatedUser);
      // Invalidate any user profile cache
      queryClient.invalidateQueries({ queryKey: usersKeys.userProfile(updatedUser.id) });
      // Invalidate group interest analysis caches (interests may affect overlap)
      queryClient.invalidateQueries({ queryKey: usersKeys.interests() });
    },
  });
}

// ============================================================================
// Interest Categories Query
// ============================================================================

/**
 * Get available interest categories
 */
export function useInterestCategories() {
  return useQuery({
    queryKey: usersKeys.categories(),
    queryFn: () => usersService.getInterestCategories(),
    staleTime: 1000 * 60 * 60, // Categories don't change often, cache for 1 hour
  });
}

// ============================================================================
// Group Interest Queries
// ============================================================================

/**
 * Get interest analysis for a group
 */
export function useGroupInterestAnalysis(groupId: string) {
  return useQuery({
    queryKey: usersKeys.groupInterests(groupId),
    queryFn: () => usersService.getGroupInterestAnalysis(groupId),
    enabled: !!groupId,
  });
}

/**
 * Get group members with their interests
 */
export function useGroupMembersWithInterests(groupId: string) {
  return useQuery({
    queryKey: usersKeys.groupMembers(groupId),
    queryFn: () => usersService.getGroupMembersWithInterests(groupId),
    enabled: !!groupId,
  });
}
