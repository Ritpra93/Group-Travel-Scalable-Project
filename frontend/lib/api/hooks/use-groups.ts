/**
 * Groups Hooks
 * TanStack Query hooks for group operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { groupsService } from '../services/groups.service';
import type {
  CreateGroupDTO,
  UpdateGroupDTO,
  AddMemberDTO,
  UpdateMemberRoleDTO,
} from '@/types/api.types';

// ============================================================================
// Query Keys
// ============================================================================

export const groupsKeys = {
  all: ['groups'] as const,
  lists: () => [...groupsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...groupsKeys.lists(), filters] as const,
  details: () => [...groupsKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupsKeys.details(), id] as const,
  members: (id: string) => [...groupsKeys.detail(id), 'members'] as const,
};

// ============================================================================
// Groups Queries
// ============================================================================

/**
 * Get all groups with optional filters
 */
export function useGroups(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: groupsKeys.list(params || {}),
    queryFn: () => groupsService.getGroups(params),
  });
}

/**
 * Get single group by ID
 */
export function useGroup(groupId: string) {
  return useQuery({
    queryKey: groupsKeys.detail(groupId),
    queryFn: () => groupsService.getGroup(groupId),
    enabled: !!groupId,
  });
}

/**
 * Get group members
 */
export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: groupsKeys.members(groupId),
    queryFn: () => groupsService.getGroupMembers(groupId),
    enabled: !!groupId,
  });
}

// ============================================================================
// Groups Mutations
// ============================================================================

/**
 * Create new group
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateGroupDTO) => groupsService.createGroup(data),
    onSuccess: (newGroup) => {
      // Invalidate groups list
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      // Navigate to new group
      router.push(`/groups/${newGroup.id}`);
    },
  });
}

/**
 * Update existing group
 */
export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateGroupDTO) =>
      groupsService.updateGroup(groupId, data),
    onSuccess: (updatedGroup) => {
      // Update group detail cache
      queryClient.setQueryData(groupsKeys.detail(groupId), updatedGroup);
      // Invalidate groups list
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
    },
  });
}

/**
 * Delete group
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (groupId: string) => groupsService.deleteGroup(groupId),
    onSuccess: (_, groupId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: groupsKeys.detail(groupId) });
      // Invalidate groups list
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      // Navigate back to groups list
      router.push('/groups');
    },
  });
}

// ============================================================================
// Member Mutations
// ============================================================================

/**
 * Add member to group
 */
export function useAddMember(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMemberDTO) =>
      groupsService.addGroupMember(groupId, data),
    onSuccess: () => {
      // Invalidate members list
      queryClient.invalidateQueries({ queryKey: groupsKeys.members(groupId) });
      // Invalidate group detail (to update member count)
      queryClient.invalidateQueries({ queryKey: groupsKeys.detail(groupId) });
    },
  });
}

/**
 * Update member role
 */
export function useUpdateMemberRole(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: string;
      data: UpdateMemberRoleDTO;
    }) => groupsService.updateMemberRole(groupId, memberId, data),
    onSuccess: () => {
      // Invalidate members list
      queryClient.invalidateQueries({ queryKey: groupsKeys.members(groupId) });
    },
  });
}

/**
 * Remove member from group
 */
export function useRemoveMember(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      groupsService.removeMember(groupId, memberId),
    onSuccess: () => {
      // Invalidate members list
      queryClient.invalidateQueries({ queryKey: groupsKeys.members(groupId) });
      // Invalidate group detail (to update member count)
      queryClient.invalidateQueries({ queryKey: groupsKeys.detail(groupId) });
    },
  });
}

/**
 * Leave group (remove self)
 */
export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (groupId: string) => groupsService.leaveGroup(groupId),
    onSuccess: (_, groupId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: groupsKeys.detail(groupId) });
      // Invalidate groups list
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      // Navigate back to groups list
      router.push('/groups');
    },
  });
}
