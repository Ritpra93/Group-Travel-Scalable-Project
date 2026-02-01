import { createId } from '@paralleldrive/cuid2';
import { db } from '../../config/kysely';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/utils/errors';
import { canCreatePoll, canDeletePoll, canVoteOnPoll, isValidStatusTransition } from './polls.middleware';
import { emitPollCreated, emitPollClosed, emitPollDeleted, emitPollVoted } from '../../websocket/emitters';
import type {
  CreatePollInput,
  UpdatePollInput,
  ListPollsQuery,
  PollResponse,
  PollResultsResponse,
  PaginatedPollsResponse,
  PollOptionWithVotes,
  VoteResponse,
} from './polls.types';
import type { GroupRole, ActivityType } from '../../config/enums';

/**
 * Service class for managing polls and voting
 */
export class PollsService {
  /**
   * Create a new poll with options
   */
  async createPoll(userId: string, data: CreatePollInput): Promise<PollResponse> {
    // 1. Get trip and verify user is member of trip's group
    const trip = await db
      .selectFrom('trips as t')
      .innerJoin('groups as g', 'g.id', 't.groupId')
      .select(['t.id', 't.groupId', 't.name', 'g.name as groupName'])
      .where('t.id', '=', data.tripId)
      .executeTakeFirst();

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    const membership = await this.verifyTripMembership(trip.groupId, userId);

    if (!canCreatePoll(membership.role)) {
      throw new ForbiddenError('Insufficient permissions to create polls');
    }

    // 2. Create poll with options in a transaction
    const result = await db.transaction().execute(async (trx) => {
      // Insert poll
      const newPoll = await trx
        .insertInto('polls')
        .values({
          id: createId(),
          tripId: data.tripId,
          title: data.title,
          description: data.description || null,
          type: data.type,
          status: 'ACTIVE',
          allowMultiple: data.allowMultiple,
          maxVotes: data.maxVotes || null,
          closesAt: data.closesAt || null,
          updatedAt: new Date(),
        })
        .returning([
          'id',
          'tripId',
          'title',
          'description',
          'type',
          'status',
          'allowMultiple',
          'maxVotes',
          'closesAt',
          'createdAt',
          'updatedAt',
        ])
        .executeTakeFirstOrThrow();

      // Insert all options
      const optionsToInsert = data.options.map((opt, index) => ({
        id: createId(),
        pollId: newPoll.id,
        label: opt.label,
        description: opt.description || null,
        metadata: opt.metadata ? JSON.stringify(opt.metadata) : null,
        displayOrder: opt.displayOrder ?? index,
      }));

      await trx.insertInto('poll_options').values(optionsToInsert).execute();

      // Log activity
      await trx
        .insertInto('activity_logs')
        .values({
          id: createId(),
          tripId: data.tripId,
          userId,
          type: 'POLL_CREATED' as ActivityType,
          metadata: JSON.stringify({
            pollId: newPoll.id,
            tripId: data.tripId,
            title: data.title,
          }),
        })
        .execute();

      return newPoll;
    });

    // Get options with vote counts (will be 0 for new poll)
    const options = await this.getOptionsWithVotes(result.id);

    // Emit real-time event
    emitPollCreated(data.tripId, result.id, result.title, userId);

    return {
      ...result,
      options,
      totalVotes: 0,
      userVotes: [],
      trip: {
        id: trip.id,
        name: trip.name,
      },
    };
  }

  /**
   * Get a single poll with options and vote counts
   */
  async getPoll(pollId: string, userId: string): Promise<PollResponse> {
    // 1. Get poll
    const poll = await db
      .selectFrom('polls as p')
      .innerJoin('trips as t', 't.id', 'p.tripId')
      .select([
        'p.id',
        'p.tripId',
        'p.title',
        'p.description',
        'p.type',
        'p.status',
        'p.allowMultiple',
        'p.maxVotes',
        'p.closesAt',
        'p.createdAt',
        'p.updatedAt',
        't.groupId',
        't.name as tripName',
      ])
      .where('p.id', '=', pollId)
      .executeTakeFirst();

    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    // 2. Verify user is member of trip's group
    await this.verifyTripMembership(poll.groupId, userId);

    // 3. Get options with vote counts
    const options = await this.getOptionsWithVotes(pollId, userId);

    // 4. Get user's votes
    const userVotes = await db
      .selectFrom('votes')
      .select(['optionId'])
      .where('pollId', '=', pollId)
      .where('userId', '=', userId)
      .execute();

    const userVotedOptionIds = userVotes.map((v) => v.optionId);

    // 5. Calculate total votes
    const totalVotes = options.reduce((sum, opt) => sum + opt.voteCount, 0);

    return {
      id: poll.id,
      tripId: poll.tripId,
      title: poll.title,
      description: poll.description,
      type: poll.type,
      status: poll.status,
      allowMultiple: poll.allowMultiple,
      maxVotes: poll.maxVotes,
      closesAt: poll.closesAt,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      options,
      totalVotes,
      userVotes: userVotedOptionIds,
      trip: {
        id: poll.tripId,
        name: poll.tripName,
      },
    };
  }

  /**
   * List all polls for a trip with pagination
   */
  async listPolls(
    tripId: string,
    userId: string,
    query: ListPollsQuery
  ): Promise<PaginatedPollsResponse> {
    // 1. Get trip and verify user is member of group
    const trip = await db
      .selectFrom('trips')
      .select(['id', 'groupId', 'name'])
      .where('id', '=', tripId)
      .executeTakeFirst();

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    await this.verifyTripMembership(trip.groupId, userId);

    // 2. Build base query
    let baseQuery = db.selectFrom('polls as p').where('p.tripId', '=', tripId);

    // Apply filters
    if (query.status) {
      baseQuery = baseQuery.where('p.status', '=', query.status);
    }

    if (query.type) {
      baseQuery = baseQuery.where('p.type', '=', query.type);
    }

    if (query.isActive !== undefined) {
      baseQuery = baseQuery.where('p.status', '=', query.isActive ? 'ACTIVE' : 'CLOSED');
    }

    // 3. Get total count (separate query)
    const countResult = await baseQuery
      .select((eb) => eb.fn.count<number>('p.id').as('total'))
      .executeTakeFirst();

    const total = Number(countResult?.total || 0);

    // 4. Get paginated polls
    const { page, limit, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    const polls = await baseQuery
      .select([
        'p.id',
        'p.tripId',
        'p.title',
        'p.description',
        'p.type',
        'p.status',
        'p.allowMultiple',
        'p.maxVotes',
        'p.closesAt',
        'p.createdAt',
        'p.updatedAt',
      ])
      .orderBy(`p.${sortBy}`, sortOrder)
      .limit(limit)
      .offset(offset)
      .execute();

    // 5. For each poll, get options with vote counts and user votes
    const pollsWithData: PollResponse[] = await Promise.all(
      polls.map(async (poll) => {
        const options = await this.getOptionsWithVotes(poll.id, userId);
        const totalVotes = options.reduce((sum, opt) => sum + opt.voteCount, 0);

        const userVotes = await db
          .selectFrom('votes')
          .select(['optionId'])
          .where('pollId', '=', poll.id)
          .where('userId', '=', userId)
          .execute();

        return {
          ...poll,
          options,
          totalVotes,
          userVotes: userVotes.map((v) => v.optionId),
          trip: {
            id: trip.id,
            name: trip.name,
          },
        };
      })
    );

    // 6. Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return {
      data: pollsWithData,
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
   * Update a poll
   */
  async updatePoll(pollId: string, userId: string, data: UpdatePollInput): Promise<PollResponse> {
    // 1. Get poll
    const poll = await db
      .selectFrom('polls as p')
      .innerJoin('trips as t', 't.id', 'p.tripId')
      .select(['p.id', 'p.status', 't.groupId', 't.name as tripName'])
      .where('p.id', '=', pollId)
      .executeTakeFirst();

    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    // 2. Verify user is member of trip's group
    await this.verifyTripMembership(poll.groupId, userId);

    // 3. Validate status transition if updating status
    if (data.status && !isValidStatusTransition(poll.status, data.status)) {
      throw new ValidationError(
        `Invalid status transition from ${poll.status} to ${data.status}`
      );
    }

    // 4. Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.closesAt !== undefined) updateData.closesAt = data.closesAt;
    if (data.status !== undefined) updateData.status = data.status;

    // 5. Update poll
    await db
      .updateTable('polls')
      .set(updateData)
      .where('id', '=', pollId)
      .execute();

    // 6. Return updated poll
    return this.getPoll(pollId, userId);
  }

  /**
   * Close a poll (set status to CLOSED)
   */
  async closePoll(pollId: string, userId: string): Promise<PollResponse> {
    // 1. Get poll
    const poll = await db
      .selectFrom('polls as p')
      .innerJoin('trips as t', 't.id', 'p.tripId')
      .select(['p.id', 'p.tripId', 'p.status', 't.groupId'])
      .where('p.id', '=', pollId)
      .executeTakeFirst();

    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    // 2. Verify user is member of trip's group
    await this.verifyTripMembership(poll.groupId, userId);

    // 3. Check status is ACTIVE
    if (poll.status !== 'ACTIVE') {
      throw new ValidationError('Can only close polls with ACTIVE status');
    }

    // 4. Update status to CLOSED
    await db
      .updateTable('polls')
      .set({
        status: 'CLOSED',
        updatedAt: new Date(),
      })
      .where('id', '=', pollId)
      .execute();

    // 5. Emit real-time event
    emitPollClosed(poll.tripId, pollId, userId);

    // 6. Return updated poll
    return this.getPoll(pollId, userId);
  }

  /**
   * Delete a poll
   */
  async deletePoll(pollId: string, userId: string): Promise<void> {
    // 1. Get poll
    const poll = await db
      .selectFrom('polls as p')
      .innerJoin('trips as t', 't.id', 'p.tripId')
      .select(['p.id', 'p.tripId', 't.groupId'])
      .where('p.id', '=', pollId)
      .executeTakeFirst();

    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    // 2. Verify user is member of trip's group and has permission
    const membership = await this.verifyTripMembership(poll.groupId, userId);

    if (!canDeletePoll(membership.role)) {
      throw new ForbiddenError('Insufficient permissions to delete polls');
    }

    // 3. Delete poll (cascades to options and votes)
    await db.deleteFrom('polls').where('id', '=', pollId).execute();

    // 4. Emit real-time event
    emitPollDeleted(poll.tripId, pollId, userId);
  }

  /**
   * Cast a vote
   */
  async castVote(userId: string, pollId: string, optionId: string): Promise<VoteResponse> {
    // 1. Get poll
    const poll = await db
      .selectFrom('polls as p')
      .innerJoin('trips as t', 't.id', 'p.tripId')
      .select([
        'p.id',
        'p.tripId',
        'p.status',
        'p.allowMultiple',
        'p.maxVotes',
        't.groupId',
      ])
      .where('p.id', '=', pollId)
      .executeTakeFirst();

    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    // 2. Verify poll status is ACTIVE
    if (!canVoteOnPoll(poll.status)) {
      throw new ValidationError('Cannot vote on polls that are not active');
    }

    // 3. Verify user is member of trip's group
    await this.verifyTripMembership(poll.groupId, userId);

    // 4. Verify option belongs to this poll
    const option = await db
      .selectFrom('poll_options')
      .select(['id'])
      .where('id', '=', optionId)
      .where('pollId', '=', pollId)
      .executeTakeFirst();

    if (!option) {
      throw new NotFoundError('Poll option not found or does not belong to this poll');
    }

    // 5. Check if user already voted for this option
    const existingVote = await db
      .selectFrom('votes')
      .select(['id'])
      .where('pollId', '=', pollId)
      .where('optionId', '=', optionId)
      .where('userId', '=', userId)
      .executeTakeFirst();

    if (existingVote) {
      throw new ValidationError('You have already voted for this option');
    }

    // 6. For single-choice polls, check if user has already voted
    if (!poll.allowMultiple) {
      const userVote = await db
        .selectFrom('votes')
        .select(['id'])
        .where('pollId', '=', pollId)
        .where('userId', '=', userId)
        .executeTakeFirst();

      if (userVote) {
        throw new ValidationError(
          'You have already voted in this single-choice poll. Use change vote endpoint to change your vote.'
        );
      }
    }

    // 7. For multiple-choice polls, check maxVotes limit
    if (poll.allowMultiple && poll.maxVotes) {
      const userVoteCount = await db
        .selectFrom('votes')
        .select((eb) => eb.fn.count<number>('id').as('count'))
        .where('pollId', '=', pollId)
        .where('userId', '=', userId)
        .executeTakeFirst();

      const currentVotes = Number(userVoteCount?.count || 0);

      if (currentVotes >= poll.maxVotes) {
        throw new ValidationError(`Maximum ${poll.maxVotes} votes allowed for this poll`);
      }
    }

    // 8. Create vote in transaction with activity log
    const vote = await db.transaction().execute(async (trx) => {
      const newVote = await trx
        .insertInto('votes')
        .values({
          id: createId(),
          pollId,
          optionId,
          userId,
        })
        .returning(['id', 'pollId', 'optionId', 'userId', 'createdAt'])
        .executeTakeFirstOrThrow();

      // Log activity
      await trx
        .insertInto('activity_logs')
        .values({
          id: createId(),
          tripId: poll.tripId,
          userId,
          type: 'VOTE_CAST' as ActivityType,
          metadata: JSON.stringify({
            pollId,
            optionId,
          }),
        })
        .execute();

      return newVote;
    });

    // 9. Emit real-time event
    emitPollVoted(poll.tripId, pollId, optionId, 'cast', userId);

    return vote;
  }

  /**
   * Change a vote (for single-choice polls)
   */
  async changeVote(
    userId: string,
    pollId: string,
    oldOptionId: string,
    newOptionId: string
  ): Promise<VoteResponse> {
    // 1. Get poll
    const poll = await db
      .selectFrom('polls as p')
      .innerJoin('trips as t', 't.id', 'p.tripId')
      .select(['p.id', 'p.tripId', 'p.status', 't.groupId'])
      .where('p.id', '=', pollId)
      .executeTakeFirst();

    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    // 2. Verify poll status is ACTIVE
    if (!canVoteOnPoll(poll.status)) {
      throw new ValidationError('Cannot change vote on polls that are not active');
    }

    // 3. Verify user is member of trip's group
    await this.verifyTripMembership(poll.groupId, userId);

    // 4. Verify both options belong to this poll
    const options = await db
      .selectFrom('poll_options')
      .select(['id'])
      .where('pollId', '=', pollId)
      .where('id', 'in', [oldOptionId, newOptionId])
      .execute();

    if (options.length !== 2) {
      throw new NotFoundError('One or both options do not belong to this poll');
    }

    // 5. Verify user has voted for oldOptionId
    const oldVote = await db
      .selectFrom('votes')
      .select(['id'])
      .where('pollId', '=', pollId)
      .where('optionId', '=', oldOptionId)
      .where('userId', '=', userId)
      .executeTakeFirst();

    if (!oldVote) {
      throw new NotFoundError('You have not voted for the old option');
    }

    // 6. Change vote in transaction
    const newVote = await db.transaction().execute(async (trx) => {
      // Delete old vote
      await trx
        .deleteFrom('votes')
        .where('id', '=', oldVote.id)
        .execute();

      // Insert new vote
      const vote = await trx
        .insertInto('votes')
        .values({
          id: createId(),
          pollId,
          optionId: newOptionId,
          userId,
        })
        .returning(['id', 'pollId', 'optionId', 'userId', 'createdAt'])
        .executeTakeFirstOrThrow();

      // Log activity
      await trx
        .insertInto('activity_logs')
        .values({
          id: createId(),
          tripId: poll.tripId,
          userId,
          type: 'VOTE_CAST' as ActivityType,
          metadata: JSON.stringify({
            pollId,
            optionId: newOptionId,
            changedFrom: oldOptionId,
          }),
        })
        .execute();

      return vote;
    });

    // 7. Emit real-time event
    emitPollVoted(poll.tripId, pollId, newOptionId, 'change', userId);

    return newVote;
  }

  /**
   * Remove a vote
   */
  async removeVote(userId: string, pollId: string, optionId: string): Promise<void> {
    // 1. Get poll
    const poll = await db
      .selectFrom('polls as p')
      .innerJoin('trips as t', 't.id', 'p.tripId')
      .select(['p.id', 'p.tripId', 'p.status', 't.groupId'])
      .where('p.id', '=', pollId)
      .executeTakeFirst();

    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    // 2. Verify poll status is ACTIVE
    if (!canVoteOnPoll(poll.status)) {
      throw new ValidationError('Cannot remove vote from polls that are not active');
    }

    // 3. Verify user is member of trip's group
    await this.verifyTripMembership(poll.groupId, userId);

    // 4. Verify user has voted for this option
    const vote = await db
      .selectFrom('votes')
      .select(['id'])
      .where('pollId', '=', pollId)
      .where('optionId', '=', optionId)
      .where('userId', '=', userId)
      .executeTakeFirst();

    if (!vote) {
      throw new NotFoundError('You have not voted for this option');
    }

    // 5. Delete vote
    await db
      .deleteFrom('votes')
      .where('id', '=', vote.id)
      .execute();

    // 6. Emit real-time event
    emitPollVoted(poll.tripId, pollId, optionId, 'remove', userId);
  }

  /**
   * Get user's votes for a poll
   */
  async getUserVotes(userId: string, pollId: string): Promise<string[]> {
    // 1. Get poll
    const poll = await db
      .selectFrom('polls as p')
      .innerJoin('trips as t', 't.id', 'p.tripId')
      .select(['p.id', 't.groupId'])
      .where('p.id', '=', pollId)
      .executeTakeFirst();

    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    // 2. Verify user is member of trip's group
    await this.verifyTripMembership(poll.groupId, userId);

    // 3. Get user's votes
    const votes = await db
      .selectFrom('votes')
      .select(['optionId'])
      .where('pollId', '=', pollId)
      .where('userId', '=', userId)
      .execute();

    return votes.map((v) => v.optionId);
  }

  /**
   * Get poll results with vote counts
   */
  async getPollResults(pollId: string, userId: string): Promise<PollResultsResponse> {
    // 1. Get poll
    const poll = await db
      .selectFrom('polls as p')
      .innerJoin('trips as t', 't.id', 'p.tripId')
      .select(['p.id', 'p.status', 't.groupId'])
      .where('p.id', '=', pollId)
      .executeTakeFirst();

    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    // 2. Verify user is member of trip's group
    await this.verifyTripMembership(poll.groupId, userId);

    // 3. Get options with vote counts
    const options = await this.getOptionsWithVotes(pollId);

    // 4. Calculate total votes
    const totalVotes = options.reduce((sum, opt) => sum + opt.voteCount, 0);

    return {
      pollId,
      totalVotes,
      options,
      status: poll.status,
    };
  }

  /**
   * Helper: Verify user is member of trip's group
   * @private
   */
  private async verifyTripMembership(
    groupId: string,
    userId: string
  ): Promise<{ role: GroupRole }> {
    const membership = await db
      .selectFrom('group_members')
      .select(['role'])
      .where('groupId', '=', groupId)
      .where('userId', '=', userId)
      .executeTakeFirst();

    if (!membership) {
      throw new ForbiddenError('You are not a member of this trip\'s group');
    }

    return membership;
  }

  /**
   * Helper: Get poll options with vote counts
   * @private
   */
  private async getOptionsWithVotes(
    pollId: string,
    userId?: string
  ): Promise<PollOptionWithVotes[]> {
    // Get options with vote counts
    const optionsWithVotes = await db
      .selectFrom('poll_options as po')
      .leftJoin('votes as v', 'v.optionId', 'po.id')
      .select([
        'po.id',
        'po.pollId',
        'po.label',
        'po.description',
        'po.metadata',
        'po.displayOrder',
        (eb) => eb.fn.count<number>('v.id').as('voteCount'),
      ])
      .where('po.pollId', '=', pollId)
      .groupBy([
        'po.id',
        'po.pollId',
        'po.label',
        'po.description',
        'po.metadata',
        'po.displayOrder',
      ])
      .orderBy('po.displayOrder', 'asc')
      .execute();

    // If userId provided, mark which options user voted for
    if (userId) {
      const userVotes = await db
        .selectFrom('votes')
        .select(['optionId'])
        .where('pollId', '=', pollId)
        .where('userId', '=', userId)
        .execute();

      const userVotedOptionIds = new Set(userVotes.map((v) => v.optionId));

      return optionsWithVotes.map((opt) => ({
        ...opt,
        voteCount: Number(opt.voteCount),
        metadata: opt.metadata, // Already parsed by Kysely
        hasVoted: userVotedOptionIds.has(opt.id),
      }));
    }

    return optionsWithVotes.map((opt) => ({
      ...opt,
      voteCount: Number(opt.voteCount),
      metadata: opt.metadata, // Already parsed by Kysely
    }));
  }
}

// Export singleton instance
export const pollsService = new PollsService();
