import { Response, NextFunction } from 'express';
import { groupsService } from './groups.service';
import {
  createGroupSchema,
  updateGroupSchema,
  updateMemberRoleSchema,
  groupListQuerySchema,
} from './groups.types';
import { ValidationError } from '../../common/utils/errors';
import type { ApiResponse } from '../../common/types/api';
import type { GroupRequest } from './groups.middleware';

/**
 * Groups Controller
 *
 * Handles HTTP requests for group management endpoints
 */
export class GroupsController {
  /**
   * Create a new group
   * POST /api/v1/groups
   */
  async create(
    req: GroupRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      // Validate input
      const validatedData = createGroupSchema.parse(req.body);

      // Create group
      const group = await groupsService.createGroup(req.user.id, validatedData);

      res.status(201).json({
        success: true,
        data: group,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }

  /**
   * Get a single group
   * GET /api/v1/groups/:id
   */
  async get(
    req: GroupRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const group = await groupsService.getGroup(req.params.id, req.user.id);

      res.status(200).json({
        success: true,
        data: group,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List groups for current user
   * GET /api/v1/groups
   */
  async list(
    req: GroupRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      // Validate query parameters
      const query = groupListQuerySchema.parse(req.query);

      // Get groups
      const result = await groupsService.listGroups(req.user.id, query);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid query parameters', error));
      } else {
        next(error);
      }
    }
  }

  /**
   * Update a group
   * PATCH /api/v1/groups/:id
   */
  async update(
    req: GroupRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      // Validate input
      const validatedData = updateGroupSchema.parse(req.body);

      // Update group
      const group = await groupsService.updateGroup(
        req.params.id,
        req.user.id,
        validatedData
      );

      res.status(200).json({
        success: true,
        data: group,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }

  /**
   * Delete a group
   * DELETE /api/v1/groups/:id
   */
  async delete(
    req: GroupRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      await groupsService.deleteGroup(req.params.id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Group deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get group members
   * GET /api/v1/groups/:id/members
   */
  async getMembers(
    req: GroupRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const members = await groupsService.getGroupMembers(
        req.params.id,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update member role
   * PATCH /api/v1/groups/:id/members/:userId
   */
  async updateMemberRole(
    req: GroupRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      // Validate input
      const validatedData = updateMemberRoleSchema.parse(req.body);

      // Update role
      const member = await groupsService.updateMemberRole(
        req.params.id,
        req.params.userId,
        req.user.id,
        validatedData
      );

      res.status(200).json({
        success: true,
        data: member,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }

  /**
   * Remove member from group
   * DELETE /api/v1/groups/:id/members/:userId
   */
  async removeMember(
    req: GroupRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      await groupsService.removeMember(
        req.params.id,
        req.params.userId,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Member removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const groupsController = new GroupsController();
