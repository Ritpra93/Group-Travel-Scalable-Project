import type { Request, Response, NextFunction } from 'express';
import { itineraryService } from './itinerary.service';
import {
  CreateItineraryItemSchema,
  UpdateItineraryItemSchema,
  ListItineraryItemsQuerySchema,
} from './itinerary.types';
import { ValidationError } from '../../common/utils/errors';
import type { ApiResponse } from '../../common/types/api';
import type {
  ItineraryItemResponse,
  PaginatedItineraryResponse,
} from './itinerary.types';

/**
 * Controller class for handling itinerary HTTP requests
 */
export class ItineraryController {
  /**
   * Create a new itinerary item
   * POST /api/v1/trips/:tripId/itinerary
   */
  async createItem(
    req: Request,
    res: Response<ApiResponse<ItineraryItemResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      // Add tripId from route params to body
      const validatedData = CreateItineraryItemSchema.parse({
        ...req.body,
        tripId: req.params.tripId,
      });
      const userId = req.user!.id;

      const result = await itineraryService.createItem(userId, validatedData);

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
   * Get a single itinerary item
   * GET /api/v1/trips/:tripId/itinerary/:itemId
   */
  async getItem(
    req: Request,
    res: Response<ApiResponse<ItineraryItemResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const tripId = req.params.tripId;
      const itemId = req.params.itemId;
      const userId = req.user!.id;

      const result = await itineraryService.getItem(tripId, itemId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List itinerary items for a trip
   * GET /api/v1/trips/:tripId/itinerary
   */
  async listItems(
    req: Request,
    res: Response<ApiResponse<ItineraryItemResponse[], PaginatedItineraryResponse['pagination']>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const tripId = req.params.tripId;
      const userId = req.user!.id;
      const query = ListItineraryItemsQuerySchema.parse(req.query);

      const result = await itineraryService.listItems(tripId, userId, query);

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
   * Update an itinerary item
   * PUT /api/v1/trips/:tripId/itinerary/:itemId
   */
  async updateItem(
    req: Request,
    res: Response<ApiResponse<ItineraryItemResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const tripId = req.params.tripId;
      const itemId = req.params.itemId;
      const userId = req.user!.id;
      const validatedData = UpdateItineraryItemSchema.parse(req.body);

      const result = await itineraryService.updateItem(tripId, itemId, userId, validatedData);

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
   * Delete an itinerary item
   * DELETE /api/v1/trips/:tripId/itinerary/:itemId
   */
  async deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tripId = req.params.tripId;
      const itemId = req.params.itemId;
      const userId = req.user!.id;

      await itineraryService.deleteItem(tripId, itemId, userId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const itineraryController = new ItineraryController();
