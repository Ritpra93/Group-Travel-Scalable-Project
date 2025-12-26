import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler.middleware';
import { pollsController } from './polls.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// POLL CRUD OPERATIONS
// ============================================================================

/**
 * Create a new poll
 * POST /api/v1/polls
 */
router.post('/', asyncHandler(pollsController.createPoll));

/**
 * Get a single poll with results
 * GET /api/v1/polls/:id
 */
router.get('/:id', asyncHandler(pollsController.getPoll));

/**
 * Update a poll
 * PUT /api/v1/polls/:id
 */
router.put('/:id', asyncHandler(pollsController.updatePoll));

/**
 * Close a poll (set status to CLOSED)
 * PATCH /api/v1/polls/:id/close
 */
router.patch('/:id/close', asyncHandler(pollsController.closePoll));

/**
 * Delete a poll
 * DELETE /api/v1/polls/:id
 */
router.delete('/:id', asyncHandler(pollsController.deletePoll));

// ============================================================================
// VOTING OPERATIONS
// ============================================================================

/**
 * Cast a vote
 * POST /api/v1/polls/:id/vote
 */
router.post('/:id/vote', asyncHandler(pollsController.castVote));

/**
 * Change a vote (for single-choice polls)
 * PUT /api/v1/polls/:id/vote
 */
router.put('/:id/vote', asyncHandler(pollsController.changeVote));

/**
 * Remove a vote
 * DELETE /api/v1/polls/:id/vote/:optionId
 */
router.delete('/:id/vote/:optionId', asyncHandler(pollsController.removeVote));

// ============================================================================
// RESULTS & USER VOTES
// ============================================================================

/**
 * Get poll results (vote counts per option)
 * GET /api/v1/polls/:id/results
 */
router.get('/:id/results', asyncHandler(pollsController.getPollResults));

/**
 * Get user's votes for a poll
 * GET /api/v1/polls/:id/my-votes
 */
router.get('/:id/my-votes', asyncHandler(pollsController.getUserVotes));

export default router;

// ============================================================================
// TRIP-SCOPED ROUTER FOR LISTING POLLS
// ============================================================================

/**
 * Router for listing polls scoped to a trip
 * Mounted at /api/v1/trips/:tripId/polls
 * mergeParams: true allows access to :tripId from parent router
 */
export const tripPollsRouter = Router({ mergeParams: true });
tripPollsRouter.use(authenticate);

/**
 * List all polls for a trip
 * GET /api/v1/trips/:tripId/polls
 */
tripPollsRouter.get('/', asyncHandler(pollsController.listPolls));
