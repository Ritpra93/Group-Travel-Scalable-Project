import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler.middleware';
import { itineraryController } from './itinerary.controller';

/**
 * Router for trip-scoped itinerary operations
 * Mounted at /api/v1/trips/:tripId/itinerary
 * mergeParams: true allows access to :tripId from parent router
 */
const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

// ============================================================================
// ITINERARY CRUD OPERATIONS
// ============================================================================

/**
 * Create a new itinerary item
 * POST /api/v1/trips/:tripId/itinerary
 */
router.post('/', asyncHandler(itineraryController.createItem));

/**
 * List itinerary items for a trip
 * GET /api/v1/trips/:tripId/itinerary
 */
router.get('/', asyncHandler(itineraryController.listItems));

/**
 * Get a single itinerary item
 * GET /api/v1/trips/:tripId/itinerary/:itemId
 */
router.get('/:itemId', asyncHandler(itineraryController.getItem));

/**
 * Update an itinerary item
 * PUT /api/v1/trips/:tripId/itinerary/:itemId
 */
router.put('/:itemId', asyncHandler(itineraryController.updateItem));

/**
 * Delete an itinerary item
 * DELETE /api/v1/trips/:tripId/itinerary/:itemId
 */
router.delete('/:itemId', asyncHandler(itineraryController.deleteItem));

export default router;
