/**
 * Users Routes
 * Prefix: /api/v1/users
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler.middleware';
import {
  getMyProfile,
  getProfile,
  updateMyProfile,
  updateMyInterests,
  getInterestCategories,
} from './users.controller';

const router = Router();

// ============================================================================
// Public Routes (still require auth)
// ============================================================================

/**
 * @route   GET /api/v1/users/interests/categories
 * @desc    Get available interest categories
 * @access  Private (authenticated users)
 */
router.get(
  '/interests/categories',
  authenticate,
  asyncHandler(getInterestCategories)
);

// ============================================================================
// Current User Routes
// ============================================================================

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/me', authenticate, asyncHandler(getMyProfile));

/**
 * @route   PUT /api/v1/users/me
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/me', authenticate, asyncHandler(updateMyProfile));

/**
 * @route   PUT /api/v1/users/me/interests
 * @desc    Update current user's interests
 * @access  Private
 */
router.put('/me/interests', authenticate, asyncHandler(updateMyInterests));

// ============================================================================
// User Profile Routes (by ID)
// ============================================================================

/**
 * @route   GET /api/v1/users/:userId
 * @desc    Get user profile by ID
 * @access  Private (authenticated users)
 */
router.get('/:userId', authenticate, asyncHandler(getProfile));

export default router;
