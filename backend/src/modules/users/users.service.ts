/**
 * Users Service
 * Business logic for user profile and interests
 */

import { db } from '../../config/kysely';
import { NotFoundError, ForbiddenError } from '../../common/utils/errors';
import type {
  UpdateInterestsInput,
  UpdateProfileInput,
  UserProfileResponse,
  UserSummary,
  InterestOverlap,
  GroupInterestAnalysis,
} from './users.types';

/**
 * Users service class
 */
export class UsersService {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await db
      .selectFrom('users')
      .select([
        'id',
        'email',
        'name',
        'avatarUrl',
        'bio',
        'timezone',
        'interests',
        'createdAt',
        'updatedAt',
      ])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      timezone: user.timezone,
      interests: user.interests || [],
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    requestingUserId: string,
    data: UpdateProfileInput
  ): Promise<UserProfileResponse> {
    // Users can only update their own profile
    if (userId !== requestingUserId) {
      throw new ForbiddenError('You can only update your own profile');
    }

    // Check user exists
    const existing = await db
      .selectFrom('users')
      .select(['id'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!existing) {
      throw new NotFoundError('User not found');
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.bio !== undefined) updateData.bio = data.bio || null;
    if (data.timezone !== undefined) updateData.timezone = data.timezone || null;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl || null;
    if (data.interests !== undefined) updateData.interests = data.interests;

    // Update user
    await db
      .updateTable('users')
      .set(updateData)
      .where('id', '=', userId)
      .execute();

    return this.getProfile(userId);
  }

  /**
   * Update user interests only
   */
  async updateInterests(
    userId: string,
    requestingUserId: string,
    data: UpdateInterestsInput
  ): Promise<UserProfileResponse> {
    // Users can only update their own interests
    if (userId !== requestingUserId) {
      throw new ForbiddenError('You can only update your own interests');
    }

    // Check user exists
    const existing = await db
      .selectFrom('users')
      .select(['id'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!existing) {
      throw new NotFoundError('User not found');
    }

    // Update interests
    await db
      .updateTable('users')
      .set({
        interests: data.interests,
        updatedAt: new Date(),
      })
      .where('id', '=', userId)
      .execute();

    return this.getProfile(userId);
  }

  /**
   * Get interest overlap analysis for a group
   */
  async getGroupInterestAnalysis(
    groupId: string,
    requestingUserId: string
  ): Promise<GroupInterestAnalysis> {
    // Verify user is a member of the group
    const membership = await db
      .selectFrom('group_members')
      .select(['userId'])
      .where('groupId', '=', groupId)
      .where('userId', '=', requestingUserId)
      .executeTakeFirst();

    if (!membership) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Get all group members with their interests
    const members = await db
      .selectFrom('group_members as gm')
      .innerJoin('users as u', 'u.id', 'gm.userId')
      .select(['u.id', 'u.name', 'u.avatarUrl', 'u.interests'])
      .where('gm.groupId', '=', groupId)
      .execute();

    if (members.length === 0) {
      return {
        members: [],
        topInterests: [],
        totalMembers: 0,
        averageOverlap: 0,
      };
    }

    // Get requesting user's interests
    const requestingUser = members.find((m) => m.id === requestingUserId);
    const myInterests = new Set(requestingUser?.interests || []);

    // Calculate interest frequency across group
    const interestCounts = new Map<string, number>();
    for (const member of members) {
      const memberInterests = member.interests || [];
      for (const interest of memberInterests) {
        interestCounts.set(interest, (interestCounts.get(interest) || 0) + 1);
      }
    }

    // Sort interests by frequency
    const topInterests = Array.from(interestCounts.entries())
      .map(([interest, count]) => ({ interest, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate overlap for each member with requesting user
    const overlaps: InterestOverlap[] = members
      .filter((m) => m.id !== requestingUserId)
      .map((member) => {
        const memberInterests = member.interests || [];
        const commonInterests = memberInterests.filter((i) => myInterests.has(i));
        const totalUniqueInterests = new Set([...myInterests, ...memberInterests]).size;
        const overlapScore =
          totalUniqueInterests > 0
            ? Math.round((commonInterests.length / totalUniqueInterests) * 100)
            : 0;

        return {
          userId: member.id,
          userName: member.name,
          userAvatar: member.avatarUrl,
          interests: memberInterests,
          commonInterests,
          overlapScore,
        };
      })
      .sort((a, b) => b.overlapScore - a.overlapScore);

    // Calculate average overlap
    const averageOverlap =
      overlaps.length > 0
        ? Math.round(overlaps.reduce((sum, o) => sum + o.overlapScore, 0) / overlaps.length)
        : 0;

    return {
      members: overlaps,
      topInterests,
      totalMembers: members.length,
      averageOverlap,
    };
  }

  /**
   * Get all members of a group with their interests (summary view)
   */
  async getGroupMembersWithInterests(
    groupId: string,
    requestingUserId: string
  ): Promise<UserSummary[]> {
    // Verify user is a member of the group
    const membership = await db
      .selectFrom('group_members')
      .select(['userId'])
      .where('groupId', '=', groupId)
      .where('userId', '=', requestingUserId)
      .executeTakeFirst();

    if (!membership) {
      throw new ForbiddenError('You are not a member of this group');
    }

    const members = await db
      .selectFrom('group_members as gm')
      .innerJoin('users as u', 'u.id', 'gm.userId')
      .select(['u.id', 'u.name', 'u.avatarUrl', 'u.interests'])
      .where('gm.groupId', '=', groupId)
      .execute();

    return members.map((m) => ({
      id: m.id,
      name: m.name,
      avatarUrl: m.avatarUrl,
      interests: m.interests || [],
    }));
  }
}

// Export singleton instance
export const usersService = new UsersService();
