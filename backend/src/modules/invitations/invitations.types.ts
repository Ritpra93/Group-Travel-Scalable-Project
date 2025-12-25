import { z } from 'zod';

/**
 * Invitations Module - Type Definitions
 *
 * This file contains Zod schemas and TypeScript types for invitation operations.
 *
 * ## Business Rules:
 * - Invitations expire after 7 days by default
 * - Users can only invite to groups where they are OWNER or ADMIN
 * - Invitations can be sent to any email (user doesn't need to exist yet)
 * - Each email can only have ONE pending invitation per group
 * - Expired invitations cannot be accepted
 * - Accepting an invitation creates a group membership
 */

// ============================================================================
// Zod Validation Schemas
// ============================================================================

/**
 * Schema for sending an invitation
 */
export const SendInvitationSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  groupId: z.string().min(20, 'Invalid group ID format'),
  message: z.string().max(500, 'Message cannot exceed 500 characters').optional(),
});

/**
 * Schema for responding to an invitation (accept/decline)
 */
export const RespondToInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  accept: z.boolean(),
});

/**
 * Schema for listing invitations with filters
 */
export const ListInvitationsSchema = z.object({
  groupId: z.string().min(20).optional(),
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Schema for resending an invitation
 */
export const ResendInvitationSchema = z.object({
  invitationId: z.string().min(20, 'Invalid invitation ID format'),
});

/**
 * Schema for canceling an invitation
 */
export const CancelInvitationSchema = z.object({
  invitationId: z.string().min(20, 'Invalid invitation ID format'),
});

// ============================================================================
// TypeScript Types
// ============================================================================

/**
 * Input type for sending an invitation
 */
export type SendInvitationInput = z.infer<typeof SendInvitationSchema>;

/**
 * Input type for responding to an invitation
 */
export type RespondToInvitationInput = z.infer<typeof RespondToInvitationSchema>;

/**
 * Input type for listing invitations
 */
export type ListInvitationsInput = z.infer<typeof ListInvitationsSchema>;

/**
 * Input type for resending an invitation
 */
export type ResendInvitationInput = z.infer<typeof ResendInvitationSchema>;

/**
 * Input type for canceling an invitation
 */
export type CancelInvitationInput = z.infer<typeof CancelInvitationSchema>;

/**
 * Invitation status enum
 */
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

/**
 * Invitation data returned from database
 */
export interface InvitationData {
  id: string;
  groupId: string;
  email: string;
  token: string;
  sentBy: string;
  recipientId: string | null;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  respondedAt: Date | null;
}

/**
 * Invitation with group and sender details
 */
export interface InvitationWithDetails extends InvitationData {
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

/**
 * Response when sending an invitation
 */
export interface SendInvitationResponse {
  invitation: InvitationData;
  inviteUrl: string;
}

/**
 * Response when listing invitations
 */
export interface ListInvitationsResponse {
  invitations: InvitationWithDetails[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Response when accepting/declining an invitation
 */
export interface RespondToInvitationResponse {
  success: boolean;
  membership?: {
    id: string;
    groupId: string;
    userId: string;
    role: string;
  };
}
