/**
 * Group Interest Routes
 * Prefix: /api/v1/groups/:groupId/interests
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler.middleware';
import { requireGroupMembership } from '../groups/groups.middleware';
import {
  getGroupInterestAnalysis,
  getGroupMembersWithInterests,
} from './users.controller';

// Use mergeParams to access :groupId from parent router
const router = Router({ mergeParams: true });

/**
 * @route   GET /api/v1/groups/:groupId/interests
 * @desc    Get interest analysis for a group (overlap detection)
 * @access  Private (group members only)
 */
router.get(
  '/',
  authenticate,
  requireGroupMembership,
  asyncHandler(getGroupInterestAnalysis)
);

/**
 * @route   GET /api/v1/groups/:groupId/interests/members
 * @desc    Get group members with their interests
 * @access  Private (group members only)
 */
router.get(
  '/members',
  authenticate,
  requireGroupMembership,
  asyncHandler(getGroupMembersWithInterests)
);

export default router;
