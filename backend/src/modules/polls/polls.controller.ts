import type { Request, Response, NextFunction } from 'express';
import { pollsService } from './polls.service';
import {
  CreatePollSchema,
  UpdatePollSchema,
  CastVoteSchema,
  ChangeVoteSchema,
  ListPollsQuerySchema,
} from './polls.types';
import { ValidationError } from '../../common/utils/errors';
import type { ApiResponse } from '../../common/types/api';
import type {
  PollResponse,
  PaginatedPollsResponse,
  PollResultsResponse,
  VoteResponse,
} from './polls.types';

/**
 * Controller class for handling poll HTTP requests
 */
export class PollsController {
  /**
   * Create a new poll
   * POST /api/v1/polls
   */
  async createPoll(
    req: Request,
    res: Response<ApiResponse<PollResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = CreatePollSchema.parse(req.body);
      const userId = req.user!.id;

      const result = await pollsService.createPoll(userId, validatedData);

      res.status(201).json({
        success: true,
        data: result,
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
   * Get a single poll with results
   * GET /api/v1/polls/:id
   */
  async getPoll(
    req: Request,
    res: Response<ApiResponse<PollResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const pollId = req.params.id;
      const userId = req.user!.id;

      const result = await pollsService.getPoll(pollId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List polls for a trip
   * GET /api/v1/trips/:tripId/polls
   */
  async listPolls(
    req: Request,
    res: Response<ApiResponse<PollResponse[], PaginatedPollsResponse['pagination']>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const tripId = req.params.tripId;
      const userId = req.user!.id;
      const query = ListPollsQuerySchema.parse(req.query);

      const result = await pollsService.listPolls(tripId, userId, query);

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
   * Update a poll
   * PUT /api/v1/polls/:id
   */
  async updatePoll(
    req: Request,
    res: Response<ApiResponse<PollResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const pollId = req.params.id;
      const userId = req.user!.id;
      const validatedData = UpdatePollSchema.parse(req.body);

      const result = await pollsService.updatePoll(pollId, userId, validatedData);

      res.status(200).json({
        success: true,
        data: result,
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
   * Close a poll
   * PATCH /api/v1/polls/:id/close
   */
  async closePoll(
    req: Request,
    res: Response<ApiResponse<PollResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const pollId = req.params.id;
      const userId = req.user!.id;

      const result = await pollsService.closePoll(pollId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a poll
   * DELETE /api/v1/polls/:id
   */
  async deletePoll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pollId = req.params.id;
      const userId = req.user!.id;

      await pollsService.deletePoll(pollId, userId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cast a vote
   * POST /api/v1/polls/:id/vote
   */
  async castVote(
    req: Request,
    res: Response<ApiResponse<VoteResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const pollId = req.params.id;
      const userId = req.user!.id;
      const validatedData = CastVoteSchema.parse(req.body);

      const result = await pollsService.castVote(userId, pollId, validatedData.optionId);

      res.status(201).json({
        success: true,
        data: result,
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
   * Change a vote
   * PUT /api/v1/polls/:id/vote
   */
  async changeVote(
    req: Request,
    res: Response<ApiResponse<VoteResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const pollId = req.params.id;
      const userId = req.user!.id;
      const validatedData = ChangeVoteSchema.parse(req.body);

      const result = await pollsService.changeVote(
        userId,
        pollId,
        validatedData.oldOptionId,
        validatedData.newOptionId
      );

      res.status(200).json({
        success: true,
        data: result,
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
   * Remove a vote
   * DELETE /api/v1/polls/:id/vote/:optionId
   */
  async removeVote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pollId = req.params.id;
      const optionId = req.params.optionId;
      const userId = req.user!.id;

      await pollsService.removeVote(userId, pollId, optionId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get poll results
   * GET /api/v1/polls/:id/results
   */
  async getPollResults(
    req: Request,
    res: Response<ApiResponse<PollResultsResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const pollId = req.params.id;
      const userId = req.user!.id;

      const result = await pollsService.getPollResults(pollId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's votes for a poll
   * GET /api/v1/polls/:id/my-votes
   */
  async getUserVotes(
    req: Request,
    res: Response<ApiResponse<{ optionIds: string[] }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const pollId = req.params.id;
      const userId = req.user!.id;

      const optionIds = await pollsService.getUserVotes(userId, pollId);

      res.status(200).json({
        success: true,
        data: { optionIds },
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const pollsController = new PollsController();
