import { Router } from 'express';
import { invitationsController } from './invitations.controller';
import { asyncHandler } from '../../middleware/asyncHandler.middleware';
import { authenticate } from '../../middleware/auth.middleware';

/**
 * Invitations routes
 * Prefix: /api/v1/invitations
 *
 * All routes require authentication
 */
const router = Router();

// Apply authentication to all invitation routes
router.use(authenticate);

/**
 * @route   POST /api/v1/invitations
 * @desc    Send an invitation to join a group
 * @access  Private (OWNER or ADMIN only, checked in service layer)
 * @body    { email: string, groupId: string, message?: string }
 */
router.post('/', asyncHandler(invitationsController.sendInvitation.bind(invitationsController)));

/**
 * @route   POST /api/v1/invitations/respond
 * @desc    Respond to an invitation (accept or decline)
 * @access  Private
 * @body    { token: string, accept: boolean }
 */
router.post(
  '/respond',
  asyncHandler(invitationsController.respondToInvitation.bind(invitationsController))
);

/**
 * @route   GET /api/v1/invitations/sent
 * @desc    List invitations sent by the current user
 * @access  Private
 * @query   { groupId?: string, status?: string, limit?: number, offset?: number }
 */
router.get(
  '/sent',
  asyncHandler(invitationsController.listSentInvitations.bind(invitationsController))
);

/**
 * @route   GET /api/v1/invitations/received
 * @desc    List invitations received by the current user
 * @access  Private
 * @query   { groupId?: string, status?: string, limit?: number, offset?: number }
 */
router.get(
  '/received',
  asyncHandler(invitationsController.listReceivedInvitations.bind(invitationsController))
);

/**
 * @route   POST /api/v1/invitations/:invitationId/resend
 * @desc    Resend an invitation (generates new token)
 * @access  Private (sender only, checked in service layer)
 * @params  invitationId - ID of the invitation to resend
 */
router.post(
  '/:invitationId/resend',
  asyncHandler(invitationsController.resendInvitation.bind(invitationsController))
);

/**
 * @route   DELETE /api/v1/invitations/:invitationId
 * @desc    Cancel a pending invitation
 * @access  Private (sender only, checked in service layer)
 * @params  invitationId - ID of the invitation to cancel
 */
router.delete(
  '/:invitationId',
  asyncHandler(invitationsController.cancelInvitation.bind(invitationsController))
);

export default router;
