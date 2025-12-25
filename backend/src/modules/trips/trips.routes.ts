import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler.middleware';
import { tripsController } from './trips.controller';

const router = Router();

/**
 * Trips Routes
 *
 * All routes require authentication
 */

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   POST /api/v1/trips
 * @desc    Create a new trip
 * @access  Private (group member)
 */
router.post('/', asyncHandler(tripsController.createTrip));

/**
 * @route   GET /api/v1/trips
 * @desc    List trips for authenticated user
 * @access  Private
 */
router.get('/', asyncHandler(tripsController.listTrips));

/**
 * @route   GET /api/v1/trips/:id
 * @desc    Get a single trip by ID
 * @access  Private (group member)
 */
router.get('/:id', asyncHandler(tripsController.getTrip));

/**
 * @route   PUT /api/v1/trips/:id
 * @desc    Update a trip
 * @access  Private (MEMBER or higher)
 */
router.put('/:id', asyncHandler(tripsController.updateTrip));

/**
 * @route   PATCH /api/v1/trips/:id/status
 * @desc    Update trip status
 * @access  Private (MEMBER or higher)
 */
router.patch('/:id/status', asyncHandler(tripsController.updateTripStatus));

/**
 * @route   DELETE /api/v1/trips/:id
 * @desc    Delete a trip
 * @access  Private (ADMIN or higher)
 */
router.delete('/:id', asyncHandler(tripsController.deleteTrip));

export default router;
