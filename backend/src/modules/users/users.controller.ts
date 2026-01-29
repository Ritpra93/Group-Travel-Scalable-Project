/**
 * Users Controller
 * HTTP request handlers for user operations
 */

import type { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { UpdateInterestsSchema, UpdateProfileSchema } from './users.types';
import { INTEREST_CATEGORIES } from '../../common/constants/interests';

/**
 * Get current user's profile
 * GET /api/v1/users/me
 */
export async function getMyProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const profile = await usersService.getProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user profile by ID
 * GET /api/v1/users/:userId
 */
export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.params;
    const profile = await usersService.getProfile(userId);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

/**
 * Update current user's profile
 * PUT /api/v1/users/me
 */
export async function updateMyProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = UpdateProfileSchema.parse(req.body);
    const profile = await usersService.updateProfile(req.user!.id, req.user!.id, data);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

/**
 * Update current user's interests
 * PUT /api/v1/users/me/interests
 */
export async function updateMyInterests(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = UpdateInterestsSchema.parse(req.body);
    const profile = await usersService.updateInterests(req.user!.id, req.user!.id, data);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

/**
 * Get available interest categories
 * GET /api/v1/users/interests/categories
 */
export async function getInterestCategories(
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  res.json({
    success: true,
    data: {
      categories: INTEREST_CATEGORIES,
    },
  });
}

/**
 * Get interest analysis for a group
 * GET /api/v1/groups/:groupId/interests
 */
export async function getGroupInterestAnalysis(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { groupId } = req.params;
    const analysis = await usersService.getGroupInterestAnalysis(groupId, req.user!.id);
    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
}

/**
 * Get group members with their interests
 * GET /api/v1/groups/:groupId/members/interests
 */
export async function getGroupMembersWithInterests(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { groupId } = req.params;
    const members = await usersService.getGroupMembersWithInterests(groupId, req.user!.id);
    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
}
