import { Request, Response, NextFunction } from 'express';
import { GroupRole } from '@prisma/client';
import { prisma } from '../../config/database';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../common/utils/errors';

/**
 * Extended Request with group membership info
 */
export interface GroupRequest extends Request {
  groupMember?: {
    id: string;
    role: GroupRole;
    userId: string;
    groupId: string;
  };
  group?: {
    id: string;
    name: string;
    creatorId: string;
    isPrivate: boolean;
  };
}

/**
 * Role hierarchy for permission checks
 *
 * Higher number = more permissions
 */
const ROLE_HIERARCHY: Record<GroupRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

/**
 * Check if user has minimum required role
 *
 * @param userRole - User's current role
 * @param requiredRole - Minimum required role
 * @returns true if user meets requirement
 */
function hasMinimumRole(userRole: GroupRole, requiredRole: GroupRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Middleware: Require Group Membership
 *
 * Verifies that the authenticated user is a member of the specified group.
 * Attaches group membership info to request for downstream use.
 *
 * Prerequisites: Must be used after `authenticate` middleware
 *
 * @throws UnauthorizedError if user is not authenticated
 * @throws NotFoundError if group doesn't exist
 * @throws ForbiddenError if user is not a member
 */
export async function requireGroupMembership(
  req: GroupRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Extract group ID from route params
    const groupId = req.params.groupId || req.params.id;

    if (!groupId) {
      throw new NotFoundError('Group ID not provided in route');
    }

    // Find group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        creatorId: true,
        isPrivate: true,
      },
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Find user's membership
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: req.user.id,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Attach to request for downstream middleware/controllers
    req.groupMember = {
      id: membership.id,
      role: membership.role,
      userId: membership.userId,
      groupId: membership.groupId,
    };

    req.group = group;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware Factory: Require Group Role
 *
 * Creates middleware that checks if user has at least the specified role.
 * Must be used after `requireGroupMembership`.
 *
 * @param minimumRole - Minimum role required
 * @returns Middleware function
 *
 * @example
 * // Only ADMIN and OWNER can access
 * router.delete('/groups/:id',
 *   authenticate,
 *   requireGroupMembership,
 *   requireGroupRole('ADMIN'),
 *   groupController.delete
 * );
 */
export function requireGroupRole(minimumRole: GroupRole) {
  return async (
    req: GroupRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Ensure membership was checked
      if (!req.groupMember) {
        throw new ForbiddenError('Group membership not verified');
      }

      // Check if user has minimum role
      if (!hasMinimumRole(req.groupMember.role, minimumRole)) {
        throw new ForbiddenError(
          `This action requires ${minimumRole} role or higher. You are ${req.groupMember.role}.`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware: Require Group Owner
 *
 * Ensures the authenticated user is the group owner.
 * Must be used after `requireGroupMembership`.
 *
 * @throws ForbiddenError if user is not the owner
 */
export async function requireGroupOwner(
  req: GroupRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.groupMember) {
      throw new ForbiddenError('Group membership not verified');
    }

    if (req.groupMember.role !== GroupRole.OWNER) {
      throw new ForbiddenError('This action requires OWNER role');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware: Require Group Admin or Above
 *
 * Ensures user is ADMIN or OWNER.
 * Convenience middleware for common permission level.
 * Must be used after `requireGroupMembership`.
 */
export const requireGroupAdmin = requireGroupRole(GroupRole.ADMIN);

/**
 * Middleware: Require Group Member or Above
 *
 * Ensures user is at least a MEMBER (not just VIEWER).
 * Useful for actions like creating trips, expenses, etc.
 * Must be used after `requireGroupMembership`.
 */
export const requireGroupMember = requireGroupRole(GroupRole.MEMBER);

/**
 * Middleware: Optional Group Membership
 *
 * Similar to requireGroupMembership but doesn't fail if user is not a member.
 * Attaches membership info if user is a member, otherwise continues.
 *
 * Useful for:
 * - Public groups where non-members can view but have limited access
 * - Routes that behave differently for members vs non-members
 *
 * Prerequisites: Must be used after `authenticate` middleware
 */
export async function optionalGroupMembership(
  req: GroupRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const groupId = req.params.groupId || req.params.id;

    if (!groupId) {
      return next();
    }

    // Find group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        creatorId: true,
        isPrivate: true,
      },
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // For private groups, membership is required
    if (group.isPrivate) {
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: group.id,
            userId: req.user.id,
          },
        },
      });

      if (!membership) {
        throw new ForbiddenError('This is a private group. Membership required.');
      }

      req.groupMember = {
        id: membership.id,
        role: membership.role,
        userId: membership.userId,
        groupId: membership.groupId,
      };
    } else {
      // For public groups, try to find membership but don't require it
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: group.id,
            userId: req.user.id,
          },
        },
      });

      if (membership) {
        req.groupMember = {
          id: membership.id,
          role: membership.role,
          userId: membership.userId,
          groupId: membership.groupId,
        };
      }
    }

    req.group = group;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Helper: Check if user can modify member role
 *
 * Business rules:
 * - OWNER can change any role except their own OWNER role
 * - ADMIN can change MEMBER and VIEWER roles
 * - Cannot change OWNER role at all (it's permanent)
 * - Cannot promote to OWNER (only one owner per group)
 *
 * @param currentUserRole - Role of user making the change
 * @param targetCurrentRole - Current role of target user
 * @param targetNewRole - New role for target user
 * @returns true if change is allowed
 */
export function canModifyMemberRole(
  currentUserRole: GroupRole,
  targetCurrentRole: GroupRole,
  targetNewRole: GroupRole
): boolean {
  // Cannot change OWNER role
  if (targetCurrentRole === GroupRole.OWNER) {
    return false;
  }

  // Cannot promote to OWNER
  if (targetNewRole === GroupRole.OWNER) {
    return false;
  }

  // OWNER can change any non-OWNER role
  if (currentUserRole === GroupRole.OWNER) {
    return true;
  }

  // ADMIN can only change MEMBER and VIEWER roles
  if (currentUserRole === GroupRole.ADMIN) {
    return (
      targetCurrentRole !== GroupRole.ADMIN &&
      targetNewRole !== GroupRole.ADMIN
    );
  }

  // Other roles cannot modify roles
  return false;
}

/**
 * Helper: Check if user can remove member
 *
 * Business rules:
 * - OWNER can remove anyone except themselves
 * - ADMIN can remove MEMBER and VIEWER
 * - Cannot remove OWNER
 * - Users can remove themselves (leave group)
 *
 * @param currentUserRole - Role of user performing removal
 * @param currentUserId - ID of user performing removal
 * @param targetUserId - ID of user being removed
 * @param targetRole - Role of user being removed
 * @returns true if removal is allowed
 */
export function canRemoveMember(
  currentUserRole: GroupRole,
  currentUserId: string,
  targetUserId: string,
  targetRole: GroupRole
): boolean {
  // Cannot remove OWNER
  if (targetRole === GroupRole.OWNER) {
    return false;
  }

  // Users can always remove themselves (leave group)
  if (currentUserId === targetUserId) {
    return true;
  }

  // OWNER can remove anyone except OWNER
  if (currentUserRole === GroupRole.OWNER) {
    return true;
  }

  // ADMIN can remove MEMBER and VIEWER
  if (currentUserRole === GroupRole.ADMIN) {
    return targetRole === GroupRole.MEMBER || targetRole === GroupRole.VIEWER;
  }

  // Other roles cannot remove members
  return false;
}
