/**
 * Invitations Service
 * API calls for invitation operations
 */

import { apiClient } from '../client';

// ============================================================================
// Types
// ============================================================================

export interface Invitation {
  id: string;
  groupId: string;
  email: string;
  token: string;
  sentBy: string;
  recipientId: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
  respondedAt: string | null;
}

export interface InvitationWithDetails extends Invitation {
  group: {
    id: string;
    name: string;
    description: string | null;
  };
  sender: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SendInvitationDTO {
  email: string;
  groupId: string;
  message?: string;
}

export interface SendInvitationResponse {
  invitation: Invitation;
  inviteUrl: string;
}

export interface RespondToInvitationDTO {
  token: string;
  accept: boolean;
}

export interface ListInvitationsParams {
  groupId?: string;
  status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  limit?: number;
  offset?: number;
}

export interface ListInvitationsResponse {
  invitations: InvitationWithDetails[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Service
// ============================================================================

export const invitationsService = {
  /**
   * Send an invitation to join a group
   */
  sendInvitation: async (data: SendInvitationDTO): Promise<SendInvitationResponse> => {
    const response = await apiClient.post<{ success: boolean; data: SendInvitationResponse }>(
      '/invitations',
      data
    );
    return response.data.data!;
  },

  /**
   * Respond to an invitation (accept or decline)
   */
  respondToInvitation: async (data: RespondToInvitationDTO): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>('/invitations/respond', data);
    return response.data;
  },

  /**
   * List invitations sent by the current user
   */
  listSentInvitations: async (params?: ListInvitationsParams): Promise<ListInvitationsResponse> => {
    const response = await apiClient.get<{ success: boolean; data: ListInvitationsResponse }>(
      '/invitations/sent',
      { params }
    );
    return response.data.data!;
  },

  /**
   * List invitations received by the current user
   */
  listReceivedInvitations: async (
    params?: ListInvitationsParams
  ): Promise<ListInvitationsResponse> => {
    const response = await apiClient.get<{ success: boolean; data: ListInvitationsResponse }>(
      '/invitations/received',
      { params }
    );
    return response.data.data!;
  },

  /**
   * Resend an invitation (generates new token)
   */
  resendInvitation: async (invitationId: string): Promise<SendInvitationResponse> => {
    const response = await apiClient.post<{ success: boolean; data: SendInvitationResponse }>(
      `/invitations/${invitationId}/resend`
    );
    return response.data.data!;
  },

  /**
   * Cancel a pending invitation
   */
  cancelInvitation: async (invitationId: string): Promise<void> => {
    await apiClient.delete(`/invitations/${invitationId}`);
  },
};
