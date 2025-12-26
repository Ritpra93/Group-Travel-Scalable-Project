/**
 * Groups Service
 * API calls for group management
 */

import { apiClient } from '../client';
import type {
  Group,
  GroupMember,
  CreateGroupDTO,
  UpdateGroupDTO,
  AddMemberDTO,
  UpdateMemberRoleDTO,
  PaginatedResponse,
} from '@/types/api.types';

// ============================================================================
// Groups CRUD
// ============================================================================

/**
 * Get all groups for current user
 */
export async function getGroups(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Group>> {
  const response = await apiClient.get('/groups', { params });
  return response.data;
}

/**
 * Get single group by ID
 */
export async function getGroup(groupId: string): Promise<Group> {
  const response = await apiClient.get(`/groups/${groupId}`);
  return response.data;
}

/**
 * Create new group
 */
export async function createGroup(data: CreateGroupDTO): Promise<Group> {
  const response = await apiClient.post('/groups', data);
  return response.data;
}

/**
 * Update existing group
 */
export async function updateGroup(
  groupId: string,
  data: UpdateGroupDTO
): Promise<Group> {
  const response = await apiClient.patch(`/groups/${groupId}`, data);
  return response.data;
}

/**
 * Delete group
 */
export async function deleteGroup(groupId: string): Promise<void> {
  await apiClient.delete(`/groups/${groupId}`);
}

// ============================================================================
// Group Members
// ============================================================================

/**
 * Get all members of a group
 */
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const response = await apiClient.get(`/groups/${groupId}/members`);
  return response.data;
}

/**
 * Add member to group
 */
export async function addGroupMember(
  groupId: string,
  data: AddMemberDTO
): Promise<GroupMember> {
  const response = await apiClient.post(`/groups/${groupId}/members`, data);
  return response.data;
}

/**
 * Update member role
 */
export async function updateMemberRole(
  groupId: string,
  memberId: string,
  data: UpdateMemberRoleDTO
): Promise<GroupMember> {
  const response = await apiClient.patch(
    `/groups/${groupId}/members/${memberId}`,
    data
  );
  return response.data;
}

/**
 * Remove member from group
 */
export async function removeMember(
  groupId: string,
  memberId: string
): Promise<void> {
  await apiClient.delete(`/groups/${groupId}/members/${memberId}`);
}

/**
 * Leave group (remove self)
 */
export async function leaveGroup(groupId: string): Promise<void> {
  await apiClient.post(`/groups/${groupId}/leave`);
}

// ============================================================================
// Exports
// ============================================================================

export const groupsService = {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupMembers,
  addGroupMember,
  updateMemberRole,
  removeMember,
  leaveGroup,
};
