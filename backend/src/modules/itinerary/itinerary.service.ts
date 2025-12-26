import { db } from '../../config/kysely';
import { createId } from '@paralleldrive/cuid2';
import type {
  CreateItineraryItemInput,
  UpdateItineraryItemInput,
  ListItineraryItemsQuery,
  ItineraryItemResponse,
  PaginatedItineraryResponse,
  Coordinates,
} from './itinerary.types';
import type { GroupRole, ActivityType } from '../../config/database.types';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../common/utils/errors';
import {
  canCreateItineraryItem,
  canModifyItineraryItem,
  canDeleteItineraryItem,
} from './itinerary.middleware';

/**
 * Service class for handling itinerary business logic
 */
export class ItineraryService {
  /**
   * Create a new itinerary item
   * @param userId - User creating the item
   * @param data - Item creation data
   * @returns Created itinerary item with details
   */
  async createItem(
    userId: string,
    data: CreateItineraryItemInput
  ): Promise<ItineraryItemResponse> {
    // Verify trip membership and permissions
    const { groupId, role } = await this.verifyTripMembership(data.tripId, userId);

    // Check if user has permission to create itinerary items
    if (!canCreateItineraryItem(role)) {
      throw new ForbiddenError('You do not have permission to create itinerary items');
    }

    // Create item in transaction
    const result = await db.transaction().execute(async (trx) => {
      // Insert itinerary item
      const newItem = await trx
        .insertInto('itinerary_items')
        .values({
          id: createId(),
          tripId: data.tripId,
          title: data.title,
          description: data.description || null,
          type: data.type,
          startTime: data.startTime,
          endTime: data.endTime || null,
          location: data.location || null,
          coordinates: data.coordinates ? JSON.stringify(data.coordinates) : null,
          cost: data.cost ? data.cost.toString() : null,
          url: data.url || null,
          notes: data.notes || null,
          createdBy: userId,
          updatedAt: new Date(),
        })
        .returning([
          'id',
          'tripId',
          'title',
          'description',
          'type',
          'startTime',
          'endTime',
          'location',
          'coordinates',
          'cost',
          'url',
          'notes',
          'createdBy',
          'createdAt',
          'updatedAt',
        ])
        .executeTakeFirstOrThrow();

      // Log activity
      await trx
        .insertInto('activity_logs')
        .values({
          id: createId(),
          tripId: data.tripId,
          userId,
          type: 'ITINERARY_ADDED' as ActivityType,
          metadata: JSON.stringify({
            itemId: newItem.id,
            type: newItem.type,
            title: newItem.title,
          }),
        })
        .execute();

      return newItem;
    });

    // Get full item with creator and trip details
    return this.getItemWithDetails(data.tripId, result.id);
  }

  /**
   * Get a single itinerary item
   * @param tripId - Trip ID
   * @param itemId - Item ID
   * @param userId - User requesting the item
   * @returns Itinerary item with details
   */
  async getItem(
    tripId: string,
    itemId: string,
    userId: string
  ): Promise<ItineraryItemResponse> {
    // Verify trip membership
    await this.verifyTripMembership(tripId, userId);

    // Get item
    return this.getItemWithDetails(tripId, itemId);
  }

  /**
   * List itinerary items for a trip
   * @param tripId - Trip ID
   * @param userId - User requesting the list
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of itinerary items
   */
  async listItems(
    tripId: string,
    userId: string,
    query: ListItineraryItemsQuery
  ): Promise<PaginatedItineraryResponse> {
    // Verify trip membership
    await this.verifyTripMembership(tripId, userId);

    const { page = 1, limit = 20, type, startDate, endDate, sortBy = 'startTime', sortOrder = 'asc' } = query;
    const offset = (page - 1) * limit;

    // Build base query
    let baseQuery = db.selectFrom('itinerary_items as ii').where('ii.tripId', '=', tripId);

    // Apply filters
    if (type) {
      baseQuery = baseQuery.where('ii.type', '=', type);
    }

    if (startDate) {
      baseQuery = baseQuery.where('ii.startTime', '>=', startDate);
    }

    if (endDate) {
      baseQuery = baseQuery.where('ii.startTime', '<=', endDate);
    }

    // Get total count
    const { count } = await baseQuery
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .executeTakeFirstOrThrow();

    const total = parseInt(count, 10);
    const totalPages = Math.ceil(total / limit);

    // Get paginated items with creator details
    const items = await baseQuery
      .innerJoin('users as creator', 'creator.id', 'ii.createdBy')
      .select([
        'ii.id',
        'ii.tripId',
        'ii.title',
        'ii.description',
        'ii.type',
        'ii.startTime',
        'ii.endTime',
        'ii.location',
        'ii.coordinates',
        'ii.cost',
        'ii.url',
        'ii.notes',
        'ii.createdBy',
        'ii.createdAt',
        'ii.updatedAt',
        'creator.name as creatorName',
        'creator.email as creatorEmail',
      ])
      .orderBy(`ii.${sortBy}`, sortOrder)
      .limit(limit)
      .offset(offset)
      .execute();

    // Transform items to response format
    const data: ItineraryItemResponse[] = items.map((item) => ({
      id: item.id,
      tripId: item.tripId,
      title: item.title,
      description: item.description,
      type: item.type,
      startTime: new Date(item.startTime),
      endTime: item.endTime ? new Date(item.endTime) : null,
      location: item.location,
      coordinates: item.coordinates as Coordinates | null,
      cost: item.cost,
      url: item.url,
      notes: item.notes,
      createdBy: item.createdBy,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      creator: {
        id: item.createdBy,
        name: item.creatorName,
        email: item.creatorEmail,
      },
    }));

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
   * Update an itinerary item
   * @param tripId - Trip ID
   * @param itemId - Item ID
   * @param userId - User updating the item
   * @param data - Update data
   * @returns Updated itinerary item with details
   */
  async updateItem(
    tripId: string,
    itemId: string,
    userId: string,
    data: UpdateItineraryItemInput
  ): Promise<ItineraryItemResponse> {
    // Get item and verify it exists and belongs to trip
    const existingItem = await db
      .selectFrom('itinerary_items')
      .select(['id', 'tripId', 'createdBy', 'startTime', 'endTime'])
      .where('id', '=', itemId)
      .where('tripId', '=', tripId)
      .executeTakeFirst();

    if (!existingItem) {
      throw new NotFoundError('Itinerary item not found');
    }

    // Verify trip membership and permissions
    const { role } = await this.verifyTripMembership(tripId, userId);

    // Check permissions
    const isCreator = existingItem.createdBy === userId;
    if (!canModifyItineraryItem(role, isCreator)) {
      throw new ForbiddenError('You do not have permission to modify this item');
    }

    // Validate time if both are being updated or one exists and one is being updated
    if (data.endTime) {
      const newStartTime = data.startTime || existingItem.startTime;
      if (data.endTime <= newStartTime) {
        throw new ValidationError('End time must be after start time');
      }
    }
    if (data.startTime && existingItem.endTime && !data.endTime) {
      if (existingItem.endTime <= data.startTime) {
        throw new ValidationError('Start time must be before existing end time');
      }
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.coordinates !== undefined) {
      updateData.coordinates = JSON.stringify(data.coordinates);
    }
    if (data.cost !== undefined) updateData.cost = data.cost.toString();
    if (data.url !== undefined) updateData.url = data.url;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Update item
    await db
      .updateTable('itinerary_items')
      .set(updateData)
      .where('id', '=', itemId)
      .where('tripId', '=', tripId)
      .execute();

    // Log activity
    await db
      .insertInto('activity_logs')
      .values({
        id: createId(),
        tripId,
        userId,
        type: 'ITINERARY_UPDATED' as ActivityType,
        metadata: JSON.stringify({
          itemId,
          updatedFields: Object.keys(data),
        }),
      })
      .execute();

    // Return updated item
    return this.getItemWithDetails(tripId, itemId);
  }

  /**
   * Delete an itinerary item
   * @param tripId - Trip ID
   * @param itemId - Item ID
   * @param userId - User deleting the item
   */
  async deleteItem(tripId: string, itemId: string, userId: string): Promise<void> {
    // Get item and verify it exists and belongs to trip
    const existingItem = await db
      .selectFrom('itinerary_items')
      .select(['id', 'tripId', 'createdBy'])
      .where('id', '=', itemId)
      .where('tripId', '=', tripId)
      .executeTakeFirst();

    if (!existingItem) {
      throw new NotFoundError('Itinerary item not found');
    }

    // Verify trip membership and permissions
    const { role } = await this.verifyTripMembership(tripId, userId);

    // Check permissions
    const isCreator = existingItem.createdBy === userId;
    if (!canDeleteItineraryItem(role, isCreator)) {
      throw new ForbiddenError('You do not have permission to delete this item');
    }

    // Delete item
    await db.deleteFrom('itinerary_items').where('id', '=', itemId).where('tripId', '=', tripId).execute();
  }

  /**
   * Verify that user is a member of the trip's group
   * @param tripId - Trip ID
   * @param userId - User ID
   * @returns Group ID and user's role
   */
  private async verifyTripMembership(
    tripId: string,
    userId: string
  ): Promise<{ groupId: string; role: GroupRole }> {
    // Get trip and its group
    const trip = await db
      .selectFrom('trips')
      .innerJoin('groups', 'groups.id', 'trips.groupId')
      .select(['trips.id', 'trips.groupId'])
      .where('trips.id', '=', tripId)
      .executeTakeFirst();

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    // Check if user is a member of the trip's group
    const membership = await db
      .selectFrom('group_members')
      .select(['role'])
      .where('groupId', '=', trip.groupId)
      .where('userId', '=', userId)
      .executeTakeFirst();

    if (!membership) {
      throw new ForbiddenError('You are not a member of this trip');
    }

    return {
      groupId: trip.groupId,
      role: membership.role as GroupRole,
    };
  }

  /**
   * Get item with full details (creator and trip)
   * @param tripId - Trip ID
   * @param itemId - Item ID
   * @returns Itinerary item with details
   */
  private async getItemWithDetails(tripId: string, itemId: string): Promise<ItineraryItemResponse> {
    const item = await db
      .selectFrom('itinerary_items as ii')
      .innerJoin('users as creator', 'creator.id', 'ii.createdBy')
      .innerJoin('trips as t', 't.id', 'ii.tripId')
      .select([
        'ii.id',
        'ii.tripId',
        'ii.title',
        'ii.description',
        'ii.type',
        'ii.startTime',
        'ii.endTime',
        'ii.location',
        'ii.coordinates',
        'ii.cost',
        'ii.url',
        'ii.notes',
        'ii.createdBy',
        'ii.createdAt',
        'ii.updatedAt',
        'creator.name as creatorName',
        'creator.email as creatorEmail',
        't.name as tripName',
      ])
      .where('ii.id', '=', itemId)
      .where('ii.tripId', '=', tripId)
      .executeTakeFirst();

    if (!item) {
      throw new NotFoundError('Itinerary item not found');
    }

    return {
      id: item.id,
      tripId: item.tripId,
      title: item.title,
      description: item.description,
      type: item.type,
      startTime: new Date(item.startTime),
      endTime: item.endTime ? new Date(item.endTime) : null,
      location: item.location,
      coordinates: item.coordinates as Coordinates | null,
      cost: item.cost,
      url: item.url,
      notes: item.notes,
      createdBy: item.createdBy,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      creator: {
        id: item.createdBy,
        name: item.creatorName,
        email: item.creatorEmail,
      },
      trip: {
        id: item.tripId,
        name: item.tripName,
      },
    };
  }
}

// Export singleton instance
export const itineraryService = new ItineraryService();
