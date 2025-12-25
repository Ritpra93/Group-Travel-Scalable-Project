import { db } from '../../config/kysely';
import { createId } from '@paralleldrive/cuid2';
import { NotFoundError, ForbiddenError } from '../../common/utils/errors';
import { canUpdateTrip, canDeleteTrip, canChangeTripStatus } from './trips.middleware';
import type {
  CreateTripInput,
  UpdateTripInput,
  UpdateTripStatusInput,
  ListTripsQuery,
  TripResponse,
  PaginatedTripsResponse,
  TripStatus,
} from './trips.types';

type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
type ActivityType = 'TRIP_CREATED' | 'TRIP_DELETED' | 'TRIP_STATUS_CHANGED';

/**
 * Trips Service
 *
 * Handles business logic for trip management:
 * - Creating and managing trips
 * - Listing and searching trips
 * - Permission checking based on group membership
 */
export class TripsService {
  /**
   * Create a new trip
   *
   * Business Rules:
   * - User must be a member of the group
   * - Transaction ensures trip creation and activity logging are atomic
   *
   * @param userId - ID of user creating the trip
   * @param data - Trip creation data
   * @returns Created trip with group info
   * @throws ForbiddenError if user is not a group member
   */
  async createTrip(userId: string, data: CreateTripInput): Promise<TripResponse> {
    // Verify user is member of group
    const membership = await this.verifyGroupMembership(data.groupId, userId);

    // Get group info
    const group = await db
      .selectFrom('groups')
      .select(['id', 'name'])
      .where('id', '=', data.groupId)
      .executeTakeFirst();

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Create trip in transaction
    const trip = await db.transaction().execute(async (trx) => {
      const newTrip = await trx
        .insertInto('trips')
        .values({
          id: createId(),
          groupId: data.groupId,
          name: data.name,
          description: data.description || null,
          destination: data.destination || null,
          imageUrl: data.imageUrl || null,
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          totalBudget: data.totalBudget !== undefined ? data.totalBudget.toString() : null,
          currency: data.currency,
          status: 'PLANNING',
          updatedAt: new Date(),
        })
        .returning([
          'id',
          'groupId',
          'name',
          'description',
          'destination',
          'imageUrl',
          'startDate',
          'endDate',
          'totalBudget',
          'currency',
          'status',
          'createdAt',
          'updatedAt',
        ])
        .executeTakeFirstOrThrow();

      // Log activity
      await trx
        .insertInto('activity_logs')
        .values({
          id: createId(),
          userId,
          type: 'TRIP_CREATED' as ActivityType,
          metadata: JSON.stringify({
            tripId: newTrip.id,
            groupId: data.groupId,
            tripName: newTrip.name,
          }),
        })
        .execute();

      return newTrip;
    });

    return {
      ...trip,
      group: {
        id: group.id,
        name: group.name,
      },
    };
  }

  /**
   * Get a single trip by ID
   *
   * Business Rules:
   * - User must be a member of the trip's group
   * - Private groups enforce membership requirement
   *
   * @param tripId - Trip ID
   * @param userId - User requesting the trip
   * @returns Trip with details and counts
   * @throws NotFoundError if trip doesn't exist
   * @throws ForbiddenError if user is not a group member (private groups)
   */
  async getTrip(tripId: string, userId: string): Promise<TripResponse> {
    // Get trip with group info
    const trip = await db
      .selectFrom('trips as t')
      .innerJoin('groups as g', 'g.id', 't.groupId')
      .select([
        't.id',
        't.groupId',
        't.name',
        't.description',
        't.destination',
        't.imageUrl',
        't.startDate',
        't.endDate',
        't.totalBudget',
        't.currency',
        't.status',
        't.createdAt',
        't.updatedAt',
        'g.id as group_id',
        'g.name as group_name',
        'g.isPrivate as group_isPrivate',
      ])
      .where('t.id', '=', tripId)
      .executeTakeFirst();

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    // Check if user is member of the group
    const membership = await db
      .selectFrom('group_members')
      .select(['role'])
      .where('groupId', '=', trip.groupId)
      .where('userId', '=', userId)
      .executeTakeFirst();

    // Private groups require membership
    if (trip.group_isPrivate && !membership) {
      throw new ForbiddenError('You are not a member of this private group');
    }

    // Get counts for polls, expenses, and itinerary items
    const [pollCount, expenseCount, itineraryCount] = await Promise.all([
      db
        .selectFrom('polls')
        .select((eb) => eb.fn.count<number>('id').as('count'))
        .where('tripId', '=', tripId)
        .executeTakeFirst()
        .then((r) => Number(r?.count || 0)),
      db
        .selectFrom('expenses')
        .select((eb) => eb.fn.count<number>('id').as('count'))
        .where('tripId', '=', tripId)
        .executeTakeFirst()
        .then((r) => Number(r?.count || 0)),
      db
        .selectFrom('itinerary_items')
        .select((eb) => eb.fn.count<number>('id').as('count'))
        .where('tripId', '=', tripId)
        .executeTakeFirst()
        .then((r) => Number(r?.count || 0)),
    ]);

    return {
      id: trip.id,
      groupId: trip.groupId,
      name: trip.name,
      description: trip.description,
      destination: trip.destination,
      imageUrl: trip.imageUrl,
      startDate: trip.startDate,
      endDate: trip.endDate,
      totalBudget: trip.totalBudget,
      currency: trip.currency,
      status: trip.status as TripStatus,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
      group: {
        id: trip.group_id,
        name: trip.group_name,
      },
      pollCount,
      expenseCount,
      itineraryItemCount: itineraryCount,
    };
  }

  /**
   * List trips for a user
   *
   * Returns paginated list of trips from groups where user is a member.
   *
   * @param userId - User ID
   * @param query - Query parameters (filters, pagination, sorting)
   * @returns Paginated list of trips
   */
  async listTrips(userId: string, query: ListTripsQuery): Promise<PaginatedTripsResponse> {
    const { page, limit, sortBy, sortOrder, groupId, status, search, startDateAfter, endDateBefore } = query;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build base query - trips from groups where user is a member
    let baseQuery = db
      .selectFrom('trips as t')
      .innerJoin('groups as g', 'g.id', 't.groupId')
      .innerJoin('group_members as gm', 'gm.groupId', 'g.id')
      .where('gm.userId', '=', userId);

    // Apply filters
    if (groupId) {
      baseQuery = baseQuery.where('t.groupId', '=', groupId);
    }

    if (status) {
      baseQuery = baseQuery.where('t.status', '=', status);
    }

    if (search) {
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb('t.name', 'ilike', `%${search}%`),
          eb('t.destination', 'ilike', `%${search}%`),
        ])
      );
    }

    if (startDateAfter) {
      baseQuery = baseQuery.where('t.startDate', '>=', startDateAfter);
    }

    if (endDateBefore) {
      baseQuery = baseQuery.where('t.endDate', '<=', endDateBefore);
    }

    // Get total count (separate query to avoid GROUP BY issues)
    const countResult = await baseQuery
      .select((eb) => eb.fn.count<number>('t.id').as('total'))
      .executeTakeFirst();

    const total = Number(countResult?.total || 0);

    // Get paginated trips
    const trips = await baseQuery
      .select([
        't.id',
        't.groupId',
        't.name',
        't.description',
        't.destination',
        't.imageUrl',
        't.startDate',
        't.endDate',
        't.totalBudget',
        't.currency',
        't.status',
        't.createdAt',
        't.updatedAt',
        'g.id as group_id',
        'g.name as group_name',
      ])
      .orderBy(`t.${sortBy}`, sortOrder)
      .limit(limit)
      .offset(offset)
      .execute();

    // Transform to response format
    const data: TripResponse[] = trips.map((trip) => ({
      id: trip.id,
      groupId: trip.groupId,
      name: trip.name,
      description: trip.description,
      destination: trip.destination,
      imageUrl: trip.imageUrl,
      startDate: trip.startDate,
      endDate: trip.endDate,
      totalBudget: trip.totalBudget,
      currency: trip.currency,
      status: trip.status as TripStatus,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
      group: {
        id: trip.group_id,
        name: trip.group_name,
      },
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    };
  }

  /**
   * Update a trip
   *
   * Business Rules:
   * - User must be a member of the trip's group
   * - MEMBER or higher can update trips
   *
   * @param tripId - Trip ID
   * @param userId - User requesting the update
   * @param data - Update data
   * @returns Updated trip
   * @throws NotFoundError if trip doesn't exist
   * @throws ForbiddenError if user doesn't have permission
   */
  async updateTrip(tripId: string, userId: string, data: UpdateTripInput): Promise<TripResponse> {
    // Get trip and verify it exists
    const trip = await db.selectFrom('trips').select(['groupId']).where('id', '=', tripId).executeTakeFirst();

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    // Verify user is member and has permission
    const membership = await this.verifyGroupMembership(trip.groupId, userId);

    if (!canUpdateTrip(membership.role as GroupRole)) {
      throw new ForbiddenError('Insufficient permissions to update trip');
    }

    // Build update data (only include provided fields)
    const updateData: any = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.destination !== undefined) updateData.destination = data.destination;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.totalBudget !== undefined) updateData.totalBudget = data.totalBudget !== null ? data.totalBudget.toString() : null;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.status !== undefined) updateData.status = data.status;

    // Update trip
    const updated = await db
      .updateTable('trips')
      .set(updateData)
      .where('id', '=', tripId)
      .returning([
        'id',
        'groupId',
        'name',
        'description',
        'destination',
        'imageUrl',
        'startDate',
        'endDate',
        'totalBudget',
        'currency',
        'status',
        'createdAt',
        'updatedAt',
      ])
      .executeTakeFirstOrThrow();

    // Get group info
    const group = await db
      .selectFrom('groups')
      .select(['id', 'name'])
      .where('id', '=', updated.groupId)
      .executeTakeFirst();

    return {
      ...updated,
      group: group
        ? {
            id: group.id,
            name: group.name,
          }
        : undefined,
    };
  }

  /**
   * Delete a trip
   *
   * Business Rules:
   * - User must be a member of the trip's group
   * - ADMIN or higher can delete trips
   * - Cascades to delete polls, expenses, itinerary items
   *
   * @param tripId - Trip ID
   * @param userId - User requesting deletion
   * @throws NotFoundError if trip doesn't exist
   * @throws ForbiddenError if user doesn't have permission
   */
  async deleteTrip(tripId: string, userId: string): Promise<void> {
    // Get trip and verify it exists
    const trip = await db.selectFrom('trips').select(['id', 'groupId', 'name']).where('id', '=', tripId).executeTakeFirst();

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    // Verify user is member and has permission
    const membership = await this.verifyGroupMembership(trip.groupId, userId);

    if (!canDeleteTrip(membership.role as GroupRole)) {
      throw new ForbiddenError('Insufficient permissions to delete trip');
    }

    // Delete trip in transaction with activity logging
    await db.transaction().execute(async (trx) => {
      // Delete trip (cascades to related data)
      await trx.deleteFrom('trips').where('id', '=', tripId).execute();

      // Log activity
      await trx
        .insertInto('activity_logs')
        .values({
          id: createId(),
          userId,
          type: 'TRIP_DELETED' as ActivityType,
          metadata: JSON.stringify({
            tripId: trip.id,
            groupId: trip.groupId,
            tripName: trip.name,
          }),
        })
        .execute();
    });
  }

  /**
   * Update trip status
   *
   * Business Rules:
   * - User must be a member of the trip's group
   * - MEMBER or higher can change status
   *
   * @param tripId - Trip ID
   * @param userId - User requesting the status change
   * @param status - New status
   * @returns Updated trip
   * @throws NotFoundError if trip doesn't exist
   * @throws ForbiddenError if user doesn't have permission
   */
  async updateTripStatus(tripId: string, userId: string, status: TripStatus): Promise<TripResponse> {
    // Get trip and verify it exists
    const trip = await db.selectFrom('trips').select(['groupId', 'status']).where('id', '=', tripId).executeTakeFirst();

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    // Verify user is member and has permission
    const membership = await this.verifyGroupMembership(trip.groupId, userId);

    if (!canChangeTripStatus(membership.role as GroupRole)) {
      throw new ForbiddenError('Insufficient permissions to change trip status');
    }

    // Update status in transaction with activity logging
    const updated = await db.transaction().execute(async (trx) => {
      const updatedTrip = await trx
        .updateTable('trips')
        .set({ status, updatedAt: new Date() })
        .where('id', '=', tripId)
        .returning([
          'id',
          'groupId',
          'name',
          'description',
          'destination',
          'imageUrl',
          'startDate',
          'endDate',
          'totalBudget',
          'currency',
          'status',
          'createdAt',
          'updatedAt',
        ])
        .executeTakeFirstOrThrow();

      // Log activity
      await trx
        .insertInto('activity_logs')
        .values({
          id: createId(),
          userId,
          type: 'TRIP_STATUS_CHANGED' as ActivityType,
          metadata: JSON.stringify({
            tripId,
            oldStatus: trip.status,
            newStatus: status,
          }),
        })
        .execute();

      return updatedTrip;
    });

    // Get group info
    const group = await db
      .selectFrom('groups')
      .select(['id', 'name'])
      .where('id', '=', updated.groupId)
      .executeTakeFirst();

    return {
      ...updated,
      group: group
        ? {
            id: group.id,
            name: group.name,
          }
        : undefined,
    };
  }

  /**
   * Helper: Verify user is a member of a group
   *
   * @param groupId - Group ID
   * @param userId - User ID
   * @returns Membership with role
   * @throws ForbiddenError if user is not a member
   * @private
   */
  private async verifyGroupMembership(groupId: string, userId: string) {
    const membership = await db
      .selectFrom('group_members')
      .select(['role'])
      .where('groupId', '=', groupId)
      .where('userId', '=', userId)
      .executeTakeFirst();

    if (!membership) {
      throw new ForbiddenError('You are not a member of this group');
    }

    return membership;
  }
}

export const tripsService = new TripsService();
