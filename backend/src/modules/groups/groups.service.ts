import { GroupRole } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError, ConflictError } from '../../common/utils/errors';
import { canModifyMemberRole, canRemoveMember } from './groups.middleware';
import type {
  CreateGroupInput,
  UpdateGroupInput,
  UpdateMemberRoleInput,
  PaginationInput,
  GroupResponse,
  GroupMemberResponse,
  PaginatedResponse,
  GroupListQuery,
} from './groups.types';

/**
 * Groups Service
 *
 * Handles business logic for group management:
 * - Creating and managing groups
 * - Managing group members and roles
 * - Listing and searching groups
 */
export class GroupsService {
  /**
   * Create a new group
   *
   * Creates a group and automatically adds the creator as OWNER.
   * Uses a transaction to ensure both operations succeed or fail together.
   *
   * @param userId - ID of user creating the group
   * @param data - Group creation data
   * @returns Created group with user's role
   */
  async createGroup(userId: string, data: CreateGroupInput): Promise<GroupResponse> {
    // Use transaction to ensure group creation and owner membership are atomic
    const result = await prisma.$transaction(async (tx) => {
      // Create the group
      const group = await tx.group.create({
        data: {
          name: data.name,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          isPrivate: data.isPrivate ?? true,
          settings: data.settings || {},
          creatorId: userId,
        },
      });

      // Add creator as OWNER
      await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId: userId,
          role: GroupRole.OWNER,
          invitedBy: null, // Creator wasn't invited
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: userId,
          type: 'GROUP_CREATED',
          metadata: {
            groupId: group.id,
            groupName: group.name,
          },
        },
      });

      return group;
    });

    // Return group with user's role
    return {
      id: result.id,
      name: result.name,
      description: result.description,
      imageUrl: result.imageUrl,
      isPrivate: result.isPrivate,
      creatorId: result.creatorId,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      memberCount: 1, // Just the owner
      userRole: GroupRole.OWNER,
    };
  }

  /**
   * Get a single group by ID
   *
   * @param groupId - Group ID
   * @param userId - User requesting the group (to get their role)
   * @returns Group details with user's role
   * @throws NotFoundError if group doesn't exist
   * @throws ForbiddenError if user is not a member and group is private
   */
  async getGroup(groupId: string, userId: string): Promise<GroupResponse> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: { members: true },
        },
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
          userId: userId,
        },
      },
    });

    // Private groups require membership
    if (group.isPrivate && !membership) {
      throw new ForbiddenError('You are not a member of this private group');
    }

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      imageUrl: group.imageUrl,
      isPrivate: group.isPrivate,
      creatorId: group.creatorId,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      memberCount: group._count.members,
      userRole: membership?.role,
    };
  }

  /**
   * List groups for a user
   *
   * Returns paginated list of groups where the user is a member.
   *
   * @param userId - User ID
   * @param query - Pagination and search parameters
   * @returns Paginated list of groups
   */
  async listGroups(userId: string, query: GroupListQuery): Promise<PaginatedResponse<GroupResponse>> {
    const { page, limit, sortBy, sortOrder, search, isPrivate } = query;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      members: {
        some: {
          userId: userId,
        },
      },
    };

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add privacy filter
    if (isPrivate !== undefined) {
      where.isPrivate = isPrivate;
    }

    // Execute queries in parallel
    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          _count: {
            select: { members: true },
          },
          members: {
            where: { userId: userId },
            select: { role: true },
          },
        },
      }),
      prisma.group.count({ where }),
    ]);

    // Map to response format
    const data: GroupResponse[] = groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      imageUrl: group.imageUrl,
      isPrivate: group.isPrivate,
      creatorId: group.creatorId,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      memberCount: group._count.members,
      userRole: group.members[0]?.role, // User's role (we filtered for this user)
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  /**
   * Update a group
   *
   * Only ADMIN and OWNER can update groups.
   *
   * @param groupId - Group ID
   * @param userId - User making the update
   * @param data - Fields to update
   * @returns Updated group
   * @throws NotFoundError if group doesn't exist
   * @throws ForbiddenError if user doesn't have permission
   */
  async updateGroup(groupId: string, userId: string, data: UpdateGroupInput): Promise<GroupResponse> {
    // Verify membership and role
    const membership = await this.getUserMembership(groupId, userId);

    if (!membership || (membership.role !== GroupRole.OWNER && membership.role !== GroupRole.ADMIN)) {
      throw new ForbiddenError('Only group admins and owners can update the group');
    }

    // Build update data (only include provided fields)
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate;
    if (data.settings !== undefined) updateData.settings = data.settings;

    // Update group
    const group = await prisma.group.update({
      where: { id: groupId },
      data: updateData,
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      imageUrl: group.imageUrl,
      isPrivate: group.isPrivate,
      creatorId: group.creatorId,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      memberCount: group._count.members,
      userRole: membership.role,
    };
  }

  /**
   * Delete a group
   *
   * Only the OWNER can delete a group.
   * Cascade deletes all related data (members, trips, etc.) due to Prisma schema.
   *
   * @param groupId - Group ID
   * @param userId - User requesting deletion
   * @throws NotFoundError if group doesn't exist
   * @throws ForbiddenError if user is not the owner
   */
  async deleteGroup(groupId: string, userId: string): Promise<void> {
    const membership = await this.getUserMembership(groupId, userId);

    if (!membership || membership.role !== GroupRole.OWNER) {
      throw new ForbiddenError('Only the group owner can delete the group');
    }

    await prisma.group.delete({
      where: { id: groupId },
    });
  }

  /**
   * Get all members of a group
   *
   * @param groupId - Group ID
   * @param userId - User requesting members list
   * @returns List of group members with user details
   * @throws NotFoundError if group doesn't exist
   * @throws ForbiddenError if user is not a member
   */
  async getGroupMembers(groupId: string, userId: string): Promise<GroupMemberResponse[]> {
    // Verify user is a member
    const userMembership = await this.getUserMembership(groupId, userId);
    if (!userMembership) {
      throw new ForbiddenError('You are not a member of this group');
    }

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, MEMBER, VIEWER
        { joinedAt: 'asc' },
      ],
    });

    return members.map((member) => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.user,
    }));
  }

  /**
   * Update a member's role
   *
   * Business rules enforced via canModifyMemberRole helper:
   * - OWNER can change any role except OWNER
   * - ADMIN can change MEMBER and VIEWER roles only
   * - Cannot create additional OWNERs
   * - Cannot change existing OWNER role
   *
   * @param groupId - Group ID
   * @param targetUserId - User whose role is being changed
   * @param requestingUserId - User making the change
   * @param data - New role
   * @throws NotFoundError if group or member doesn't exist
   * @throws ForbiddenError if requesting user doesn't have permission
   */
  async updateMemberRole(
    groupId: string,
    targetUserId: string,
    requestingUserId: string,
    data: UpdateMemberRoleInput
  ): Promise<GroupMemberResponse> {
    // Get both memberships
    const [requestingMember, targetMember] = await Promise.all([
      this.getUserMembership(groupId, requestingUserId),
      this.getUserMembership(groupId, targetUserId),
    ]);

    if (!requestingMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    if (!targetMember) {
      throw new NotFoundError('Target user is not a member of this group');
    }

    // Check permission using helper
    if (!canModifyMemberRole(requestingMember.role, targetMember.role, data.role)) {
      throw new ForbiddenError('You do not have permission to change this member\'s role');
    }

    // Update role
    const updated = await prisma.groupMember.update({
      where: { id: targetMember.id },
      data: { role: data.role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      role: updated.role,
      joinedAt: updated.joinedAt,
      user: updated.user,
    };
  }

  /**
   * Remove a member from a group
   *
   * Business rules enforced via canRemoveMember helper:
   * - OWNER can remove anyone except themselves
   * - ADMIN can remove MEMBER and VIEWER
   * - Users can remove themselves (leave group)
   * - Cannot remove OWNER
   *
   * @param groupId - Group ID
   * @param targetUserId - User to remove
   * @param requestingUserId - User requesting removal
   * @throws NotFoundError if group or member doesn't exist
   * @throws ForbiddenError if requesting user doesn't have permission
   */
  async removeMember(groupId: string, targetUserId: string, requestingUserId: string): Promise<void> {
    const [requestingMember, targetMember] = await Promise.all([
      this.getUserMembership(groupId, requestingUserId),
      this.getUserMembership(groupId, targetUserId),
    ]);

    if (!requestingMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    if (!targetMember) {
      throw new NotFoundError('Target user is not a member of this group');
    }

    // Check permission using helper
    if (!canRemoveMember(requestingMember.role, requestingUserId, targetUserId, targetMember.role)) {
      throw new ForbiddenError('You do not have permission to remove this member');
    }

    // Special case: Owner trying to leave
    if (targetMember.role === GroupRole.OWNER && requestingUserId === targetUserId) {
      throw new ForbiddenError('Group owner cannot leave the group. Please delete the group or transfer ownership first.');
    }

    await prisma.groupMember.delete({
      where: { id: targetMember.id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: requestingUserId,
        type: 'MEMBER_LEFT',
        metadata: {
          groupId: groupId,
          removedUserId: targetUserId,
          wasRemoved: requestingUserId !== targetUserId,
        },
      },
    });
  }

  /**
   * Helper: Get user's membership in a group
   *
   * @param groupId - Group ID
   * @param userId - User ID
   * @returns Membership or null if not a member
   * @private
   */
  private async getUserMembership(groupId: string, userId: string) {
    return prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
  }
}

export const groupsService = new GroupsService();
