import { db } from '../../config/kysely';
import { createId } from '@paralleldrive/cuid2';
import { ConflictError, NotFoundError, ForbiddenError, ValidationError } from '../../common/utils/errors';
import { logEvent } from '../../common/utils/logger';
import type {
  SendInvitationInput,
  RespondToInvitationInput,
  ListInvitationsInput,
  SendInvitationResponse,
  ListInvitationsResponse,
  RespondToInvitationResponse,
  InvitationWithDetails,
} from './invitations.types';
import {
  generateInvitationToken,
  generateInvitationUrl,
  getDefaultExpirationDate,
  isInvitationExpired,
  canRespondToInvitation,
  canResendInvitation,
  canCancelInvitation,
  sanitizeEmail,
} from './invitations.utils';

/**
 * Invitations Service
 *
 * Handles all invitation-related business logic using Kysely for database operations.
 *
 * ## Key Features:
 * - Send invitations to users via email
 * - Accept/decline invitations
 * - List invitations (sent/received)
 * - Resend expired invitations
 * - Cancel pending invitations
 * - Automatic group membership creation on acceptance
 */
export class InvitationsService {
  /**
   * Send an invitation to join a group
   *
   * @param input - Invitation data
   * @param senderId - ID of the user sending the invitation
   * @returns Invitation data and invite URL
   * @throws ForbiddenError if sender is not OWNER or ADMIN
   * @throws NotFoundError if group doesn't exist
   * @throws ConflictError if pending invitation already exists for this email/group
   */
  async sendInvitation(input: SendInvitationInput, senderId: string): Promise<SendInvitationResponse> {
    const { email, groupId } = input;
    const sanitizedEmail = sanitizeEmail(email);

    // Check if group exists
    const group = await db
      .selectFrom('groups')
      .select(['id', 'name'])
      .where('id', '=', groupId)
      .executeTakeFirst();

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Check if sender has permission (must be OWNER or ADMIN)
    const membership = await db
      .selectFrom('group_members')
      .select(['role'])
      .where('groupId', '=', groupId)
      .where('userId', '=', senderId)
      .executeTakeFirst();

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      throw new ForbiddenError('Only group owners and admins can send invitations');
    }

    // Check if user is already a member
    const existingMember = await db
      .selectFrom('group_members as gm')
      .innerJoin('users as u', 'u.id', 'gm.userId')
      .select(['gm.id'])
      .where('gm.groupId', '=', groupId)
      .where('u.email', '=', sanitizedEmail)
      .executeTakeFirst();

    if (existingMember) {
      throw new ConflictError('User is already a member of this group');
    }

    // Check for existing pending invitation
    const existingInvitation = await db
      .selectFrom('invitations')
      .select(['id', 'status'])
      .where('groupId', '=', groupId)
      .where('email', '=', sanitizedEmail)
      .where('status', '=', 'PENDING')
      .executeTakeFirst();

    if (existingInvitation) {
      throw new ConflictError('A pending invitation already exists for this email');
    }

    // Check if recipient user exists
    const recipientUser = await db
      .selectFrom('users')
      .select(['id'])
      .where('email', '=', sanitizedEmail)
      .executeTakeFirst();

    // Generate token and create invitation
    const token = generateInvitationToken();
    const expiresAt = getDefaultExpirationDate(7);

    const invitation = await db
      .insertInto('invitations')
      .values({
        id: createId(),
        groupId,
        email: sanitizedEmail,
        token,
        sentBy: senderId,
        recipientId: recipientUser?.id || null,
        status: 'PENDING',
        expiresAt,
      })
      .returning([
        'id',
        'groupId',
        'email',
        'token',
        'sentBy',
        'recipientId',
        'status',
        'expiresAt',
        'createdAt',
        'respondedAt',
      ])
      .executeTakeFirstOrThrow();

    // Generate invitation URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteUrl = generateInvitationUrl(token, frontendUrl);

    logEvent('invitation_sent', {
      invitationId: invitation.id,
      groupId,
      email: sanitizedEmail,
      sentBy: senderId,
    });

    return {
      invitation,
      inviteUrl,
    };
  }

  /**
   * Respond to an invitation (accept or decline)
   *
   * @param input - Response data (token + accept/decline)
   * @param userId - ID of the user responding
   * @returns Response with membership if accepted
   * @throws NotFoundError if invitation doesn't exist
   * @throws ForbiddenError if invitation is not for this user
   * @throws ValidationError if invitation is expired or already responded to
   */
  async respondToInvitation(
    input: RespondToInvitationInput,
    userId: string
  ): Promise<RespondToInvitationResponse> {
    const { token, accept } = input;

    // Find invitation by token
    const invitation = await db
      .selectFrom('invitations')
      .selectAll()
      .where('token', '=', token)
      .executeTakeFirst();

    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    // Check if invitation is for this user
    const user = await db
      .selectFrom('users')
      .select(['email'])
      .where('id', '=', userId)
      .executeTakeFirstOrThrow();

    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ForbiddenError('This invitation is not for you');
    }

    // Check if invitation can be responded to
    if (!canRespondToInvitation(invitation.status, invitation.expiresAt)) {
      if (isInvitationExpired(invitation.expiresAt)) {
        throw new ValidationError('Invitation has expired');
      }
      throw new ValidationError(`Invitation has already been ${invitation.status.toLowerCase()}`);
    }

    const newStatus = accept ? 'ACCEPTED' : 'DECLINED';

    // Update invitation status
    await db
      .updateTable('invitations')
      .set({
        status: newStatus,
        respondedAt: new Date(),
        recipientId: userId,
      })
      .where('id', '=', invitation.id)
      .execute();

    let membershipData = undefined;

    // If accepted, create group membership
    if (accept) {
      const membership = await db
        .insertInto('group_members')
        .values({
          id: createId(),
          groupId: invitation.groupId,
          userId,
          role: 'MEMBER',
          invitedBy: invitation.sentBy,
        })
        .returning(['id', 'groupId', 'userId', 'role'])
        .executeTakeFirstOrThrow();

      membershipData = membership;

      logEvent('invitation_accepted', {
        invitationId: invitation.id,
        groupId: invitation.groupId,
        userId,
      });
    } else {
      logEvent('invitation_declined', {
        invitationId: invitation.id,
        groupId: invitation.groupId,
        userId,
      });
    }

    return {
      success: true,
      membership: membershipData,
    };
  }

  /**
   * List invitations (sent by user or received by user)
   *
   * @param input - Filter criteria
   * @param userId - ID of the user
   * @param type - 'sent' or 'received'
   * @returns Paginated list of invitations with details
   */
  async listInvitations(
    input: ListInvitationsInput,
    userId: string,
    type: 'sent' | 'received'
  ): Promise<ListInvitationsResponse> {
    const { groupId, status, limit, offset } = input;

    // Build base query for filtering
    let baseQuery = db
      .selectFrom('invitations as i')
      .innerJoin('groups as g', 'g.id', 'i.groupId')
      .innerJoin('users as u', 'u.id', 'i.sentBy');

    // Filter by type
    if (type === 'sent') {
      baseQuery = baseQuery.where('i.sentBy', '=', userId);
    } else {
      // For received, match by recipientId or email
      const user = await db
        .selectFrom('users')
        .select(['email'])
        .where('id', '=', userId)
        .executeTakeFirstOrThrow();

      baseQuery = baseQuery.where((eb) =>
        eb.or([eb('i.recipientId', '=', userId), eb('i.email', '=', user.email.toLowerCase())])
      );
    }

    // Apply filters
    if (groupId) {
      baseQuery = baseQuery.where('i.groupId', '=', groupId);
    }
    if (status) {
      baseQuery = baseQuery.where('i.status', '=', status);
    }

    // Get total count
    const countResult = await baseQuery
      .select((eb) => eb.fn.count<number>('i.id').as('total'))
      .executeTakeFirst();
    const total = Number(countResult?.total || 0);

    // Get paginated results
    const results = await baseQuery
      .select([
        'i.id',
        'i.groupId',
        'i.email',
        'i.token',
        'i.sentBy',
        'i.recipientId',
        'i.status',
        'i.expiresAt',
        'i.createdAt',
        'i.respondedAt',
        'g.id as group_id',
        'g.name as group_name',
        'g.description as group_description',
        'u.id as sender_id',
        'u.name as sender_name',
        'u.email as sender_email',
      ])
      .orderBy('i.createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    // Transform results
    const invitations: InvitationWithDetails[] = results.map((row) => ({
      id: row.id,
      groupId: row.groupId,
      email: row.email,
      token: row.token,
      sentBy: row.sentBy,
      recipientId: row.recipientId,
      status: row.status,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      respondedAt: row.respondedAt,
      group: {
        id: row.group_id,
        name: row.group_name,
        description: row.group_description,
      },
      sender: {
        id: row.sender_id,
        name: row.sender_name,
        email: row.sender_email,
      },
    }));

    return {
      invitations,
      total,
      limit,
      offset,
    };
  }

  /**
   * Resend an invitation (generates new token and extends expiration)
   *
   * @param invitationId - ID of the invitation to resend
   * @param userId - ID of the user resending
   * @returns Updated invitation with new token and URL
   * @throws NotFoundError if invitation doesn't exist
   * @throws ForbiddenError if user is not the sender
   * @throws ValidationError if invitation cannot be resent
   */
  async resendInvitation(invitationId: string, userId: string): Promise<SendInvitationResponse> {
    const invitation = await db
      .selectFrom('invitations')
      .selectAll()
      .where('id', '=', invitationId)
      .executeTakeFirst();

    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    if (invitation.sentBy !== userId) {
      throw new ForbiddenError('You can only resend invitations you sent');
    }

    if (!canResendInvitation(invitation.status)) {
      throw new ValidationError('This invitation cannot be resent');
    }

    // Generate new token and extend expiration
    const newToken = generateInvitationToken();
    const newExpiresAt = getDefaultExpirationDate(7);

    const updatedInvitation = await db
      .updateTable('invitations')
      .set({
        token: newToken,
        expiresAt: newExpiresAt,
        status: 'PENDING',
      })
      .where('id', '=', invitationId)
      .returning([
        'id',
        'groupId',
        'email',
        'token',
        'sentBy',
        'recipientId',
        'status',
        'expiresAt',
        'createdAt',
        'respondedAt',
      ])
      .executeTakeFirstOrThrow();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteUrl = generateInvitationUrl(newToken, frontendUrl);

    logEvent('invitation_resent', {
      invitationId: invitation.id,
      groupId: invitation.groupId,
      sentBy: userId,
    });

    return {
      invitation: updatedInvitation,
      inviteUrl,
    };
  }

  /**
   * Cancel a pending invitation
   *
   * @param invitationId - ID of the invitation to cancel
   * @param userId - ID of the user canceling
   * @throws NotFoundError if invitation doesn't exist
   * @throws ForbiddenError if user is not the sender
   * @throws ValidationError if invitation cannot be canceled
   */
  async cancelInvitation(invitationId: string, userId: string): Promise<void> {
    const invitation = await db
      .selectFrom('invitations')
      .selectAll()
      .where('id', '=', invitationId)
      .executeTakeFirst();

    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    if (invitation.sentBy !== userId) {
      throw new ForbiddenError('You can only cancel invitations you sent');
    }

    if (!canCancelInvitation(invitation.status)) {
      throw new ValidationError('This invitation cannot be canceled');
    }

    await db.deleteFrom('invitations').where('id', '=', invitationId).execute();

    logEvent('invitation_canceled', {
      invitationId: invitation.id,
      groupId: invitation.groupId,
      userId,
    });
  }

  /**
   * Mark expired invitations as EXPIRED
   *
   * This should be run periodically (e.g., hourly cron job)
   *
   * @returns Number of invitations marked as expired
   */
  async markExpiredInvitations(): Promise<number> {
    const result = await db
      .updateTable('invitations')
      .set({ status: 'EXPIRED' })
      .where('status', '=', 'PENDING')
      .where('expiresAt', '<', new Date())
      .executeTakeFirst();

    const count = Number(result.numUpdatedRows || 0);
    logEvent('invitations_expired', { count });
    return count;
  }
}

export const invitationsService = new InvitationsService();
