import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler.middleware';
import { expensesController } from './expenses.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// EXPENSE CRUD OPERATIONS
// ============================================================================

/**
 * Create a new expense
 * POST /api/v1/expenses
 */
router.post('/', asyncHandler(expensesController.createExpense));

/**
 * Get a single expense with details
 * GET /api/v1/expenses/:id
 */
router.get('/:id', asyncHandler(expensesController.getExpense));

/**
 * Update an expense
 * PUT /api/v1/expenses/:id
 */
router.put('/:id', asyncHandler(expensesController.updateExpense));

/**
 * Delete an expense
 * DELETE /api/v1/expenses/:id
 */
router.delete('/:id', asyncHandler(expensesController.deleteExpense));

// ============================================================================
// SPLIT MANAGEMENT
// ============================================================================

/**
 * Update an expense split (mark as paid/unpaid)
 * PATCH /api/v1/expenses/:id/splits/:splitId
 */
router.patch('/:id/splits/:splitId', asyncHandler(expensesController.updateSplit));

export default router;

// ============================================================================
// TRIP-SCOPED ROUTER FOR LISTING EXPENSES AND BALANCES
// ============================================================================

/**
 * Router for trip-scoped expense operations
 * Mounted at /api/v1/trips/:tripId/expenses
 * mergeParams: true allows access to :tripId from parent router
 */
export const tripExpensesRouter = Router({ mergeParams: true });
tripExpensesRouter.use(authenticate);

/**
 * List expenses for a trip
 * GET /api/v1/trips/:tripId/expenses
 */
tripExpensesRouter.get('/', asyncHandler(expensesController.listExpenses));

/**
 * Get user balances for a trip
 * GET /api/v1/trips/:tripId/expenses/balances
 */
tripExpensesRouter.get('/balances', asyncHandler(expensesController.getTripBalances));
