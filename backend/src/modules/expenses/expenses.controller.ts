import type { Request, Response, NextFunction } from 'express';
import { expensesService } from './expenses.service';
import {
  CreateExpenseSchema,
  UpdateExpenseSchema,
  UpdateSplitSchema,
  ListExpensesQuerySchema,
} from './expenses.types';
import { ValidationError } from '../../common/utils/errors';
import type { ApiResponse } from '../../common/types/api';
import type {
  ExpenseResponse,
  PaginatedExpensesResponse,
  ExpenseSplitData,
  UserBalanceResponse,
} from './expenses.types';

/**
 * Controller class for handling expense HTTP requests
 */
export class ExpensesController {
  /**
   * Create a new expense
   * POST /api/v1/expenses
   */
  async createExpense(
    req: Request,
    res: Response<ApiResponse<ExpenseResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = CreateExpenseSchema.parse(req.body);
      const userId = req.user!.id;

      const result = await expensesService.createExpense(userId, validatedData);

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
   * Get a single expense with details
   * GET /api/v1/expenses/:id
   */
  async getExpense(
    req: Request,
    res: Response<ApiResponse<ExpenseResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const expenseId = req.params.id;
      const userId = req.user!.id;

      const result = await expensesService.getExpense(expenseId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List expenses for a trip
   * GET /api/v1/trips/:tripId/expenses
   */
  async listExpenses(
    req: Request,
    res: Response<ApiResponse<ExpenseResponse[], PaginatedExpensesResponse['pagination']>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const tripId = req.params.tripId;
      const userId = req.user!.id;
      const query = ListExpensesQuerySchema.parse(req.query);

      const result = await expensesService.listExpenses(tripId, userId, query);

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
   * Update an expense
   * PUT /api/v1/expenses/:id
   */
  async updateExpense(
    req: Request,
    res: Response<ApiResponse<ExpenseResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const expenseId = req.params.id;
      const userId = req.user!.id;
      const validatedData = UpdateExpenseSchema.parse(req.body);

      const result = await expensesService.updateExpense(expenseId, userId, validatedData);

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
   * Delete an expense
   * DELETE /api/v1/expenses/:id
   */
  async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expenseId = req.params.id;
      const userId = req.user!.id;

      await expensesService.deleteExpense(expenseId, userId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an expense split (mark as paid/unpaid)
   * PATCH /api/v1/expenses/:id/splits/:splitId
   */
  async updateSplit(
    req: Request,
    res: Response<ApiResponse<ExpenseSplitData>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const expenseId = req.params.id;
      const splitId = req.params.splitId;
      const userId = req.user!.id;
      const validatedData = UpdateSplitSchema.parse(req.body);

      const result = await expensesService.updateSplit(expenseId, splitId, userId, validatedData);

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
   * Get user balances for a trip
   * GET /api/v1/trips/:tripId/expenses/balances
   */
  async getTripBalances(
    req: Request,
    res: Response<ApiResponse<UserBalanceResponse[]>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const tripId = req.params.tripId;
      const userId = req.user!.id;

      const result = await expensesService.getTripBalances(tripId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const expensesController = new ExpensesController();
