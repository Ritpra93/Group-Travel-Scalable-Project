/**
 * Invitations Hooks
 * TanStack Query hooks for invitation operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  invitationsService,
  type SendInvitationDTO,
  type RespondToInvitationDTO,
  type ListInvitationsParams,
} from '../services/invitations.service';
import { groupsKeys } from './use-groups';

// ============================================================================
// Query Keys
// ============================================================================

export const invitationsKeys = {
  all: ['invitations'] as const,
  sent: (params?: ListInvitationsParams) => [...invitationsKeys.all, 'sent', params] as const,
  received: (params?: ListInvitationsParams) =>
    [...invitationsKeys.all, 'received', params] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Get invitations sent by the current user
 */
export function useSentInvitations(params?: ListInvitationsParams) {
  return useQuery({
    queryKey: invitationsKeys.sent(params),
    queryFn: () => invitationsService.listSentInvitations(params),
  });
}

/**
 * Get invitations received by the current user
 */
export function useReceivedInvitations(params?: ListInvitationsParams) {
  return useQuery({
    queryKey: invitationsKeys.received(params),
    queryFn: () => invitationsService.listReceivedInvitations(params),
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Send an invitation to join a group
 */
export function useSendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendInvitationDTO) => invitationsService.sendInvitation(data),
    onSuccess: (_, variables) => {
      // Invalidate sent invitations list
      queryClient.invalidateQueries({ queryKey: invitationsKeys.sent() });
      // Invalidate group members (in case we want to show pending invitations)
      queryClient.invalidateQueries({
        queryKey: [...groupsKeys.all, 'members', variables.groupId],
      });
    },
  });
}

/**
 * Respond to an invitation (accept or decline)
 */
export function useRespondToInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RespondToInvitationDTO) => invitationsService.respondToInvitation(data),
    onSuccess: () => {
      // Invalidate received invitations
      queryClient.invalidateQueries({ queryKey: invitationsKeys.received() });
      // Invalidate groups list (user may have joined a new group)
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
    },
  });
}

/**
 * Resend an invitation
 */
export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => invitationsService.resendInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationsKeys.sent() });
    },
  });
}

/**
 * Cancel a pending invitation
 */
export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => invitationsService.cancelInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationsKeys.sent() });
    },
  });
}
