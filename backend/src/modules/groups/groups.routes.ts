import { Router } from 'express';
import { groupsController } from './groups.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler.middleware';
import {
  requireGroupMembership,
  requireGroupAdmin,
  requireGroupOwner,
} from './groups.middleware';

/**
 * Groups routes
 * Prefix: /api/v1/groups
 */
const router = Router();

/**
 * @route   POST /api/v1/groups
 * @desc    Create a new group
 * @access  Private (authenticated users)
 */
router.post(
  '/',
  authenticate,
  asyncHandler(groupsController.create.bind(groupsController))
);

/**
 * @route   GET /api/v1/groups
 * @desc    List all groups for current user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  asyncHandler(groupsController.list.bind(groupsController))
);

/**
 * @route   GET /api/v1/groups/:id
 * @desc    Get a single group
 * @access  Private (members only for private groups)
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(groupsController.get.bind(groupsController))
);

/**
 * @route   PATCH /api/v1/groups/:id
 * @desc    Update a group
 * @access  Private (ADMIN or OWNER only)
 */
router.patch(
  '/:id',
  authenticate,
  requireGroupMembership,
  requireGroupAdmin,
  asyncHandler(groupsController.update.bind(groupsController))
);

/**
 * @route   DELETE /api/v1/groups/:id
 * @desc    Delete a group
 * @access  Private (OWNER only)
 */
router.delete(
  '/:id',
  authenticate,
  requireGroupMembership,
  requireGroupOwner,
  asyncHandler(groupsController.delete.bind(groupsController))
);

/**
 * @route   GET /api/v1/groups/:id/members
 * @desc    Get all members of a group
 * @access  Private (members only)
 */
router.get(
  '/:id/members',
  authenticate,
  requireGroupMembership,
  asyncHandler(groupsController.getMembers.bind(groupsController))
);

/**
 * @route   PATCH /api/v1/groups/:id/members/:userId
 * @desc    Update a member's role
 * @access  Private (ADMIN or OWNER, with role-specific restrictions)
 */
router.patch(
  '/:id/members/:userId',
  authenticate,
  requireGroupMembership,
  requireGroupAdmin,
  asyncHandler(groupsController.updateMemberRole.bind(groupsController))
);

/**
 * @route   DELETE /api/v1/groups/:id/members/:userId
 * @desc    Remove a member from the group
 * @access  Private (ADMIN/OWNER can remove others, users can remove themselves)
 */
router.delete(
  '/:id/members/:userId',
  authenticate,
  requireGroupMembership,
  asyncHandler(groupsController.removeMember.bind(groupsController))
);

export default router;
