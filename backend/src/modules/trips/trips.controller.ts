import { Request, Response, NextFunction } from 'express';
import { tripsService } from './trips.service';
import {
  CreateTripSchema,
  UpdateTripSchema,
  UpdateTripStatusSchema,
  ListTripsQuerySchema,
} from './trips.types';
import { ValidationError } from '../../common/utils/errors';
import type { ApiResponse } from '../../common/types/api';
import type { TripResponse, PaginatedTripsResponse } from './trips.types';

/**
 * Trips Controller
 *
 * Handles HTTP requests for trip endpoints
 */
export class TripsController {
  /**
   * Create a new trip
   * POST /api/v1/trips
   */
  async createTrip(
    req: Request,
    res: Response<ApiResponse<TripResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = CreateTripSchema.parse(req.body);
      const userId = req.user!.id;

      const result = await tripsService.createTrip(userId, validatedData);

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
   * Get a single trip by ID
   * GET /api/v1/trips/:id
   */
  async getTrip(
    req: Request,
    res: Response<ApiResponse<TripResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const tripId = req.params.id;
      const userId = req.user!.id;

      const result = await tripsService.getTrip(tripId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List trips for the authenticated user
   * GET /api/v1/trips
   */
  async listTrips(
    req: Request,
    res: Response<ApiResponse<TripResponse[], PaginatedTripsResponse['pagination']>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedQuery = ListTripsQuerySchema.parse(req.query);
      const userId = req.user!.id;

      const result = await tripsService.listTrips(userId, validatedQuery);

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
   * Update a trip
   * PUT /api/v1/trips/:id
   */
  async updateTrip(
    req: Request,
    res: Response<ApiResponse<TripResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const tripId = req.params.id;
      const validatedData = UpdateTripSchema.parse(req.body);
      const userId = req.user!.id;

      const result = await tripsService.updateTrip(tripId, userId, validatedData);

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
   * Delete a trip
   * DELETE /api/v1/trips/:id
   */
  async deleteTrip(
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const tripId = req.params.id;
      const userId = req.user!.id;

      await tripsService.deleteTrip(tripId, userId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update trip status
   * PATCH /api/v1/trips/:id/status
   */
  async updateTripStatus(
    req: Request,
    res: Response<ApiResponse<TripResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const tripId = req.params.id;
      const validatedData = UpdateTripStatusSchema.parse(req.body);
      const userId = req.user!.id;

      const result = await tripsService.updateTripStatus(tripId, userId, validatedData.status);

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
}

export const tripsController = new TripsController();
