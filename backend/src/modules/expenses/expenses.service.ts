import { createId } from '@paralleldrive/cuid2';
import { db } from '../../config/kysely';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/utils/errors';
import { canCreateExpense, canDeleteExpense, canModifyExpense } from './expenses.middleware';
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  UpdateSplitInput,
  ListExpensesQuery,
  ExpenseResponse,
  ExpenseSplitData,
  UserBalanceResponse,
  PaginatedExpensesResponse,
} from './expenses.types';
import type { GroupRole, ActivityType } from '../../config/database.types';

/**
 * Service class for handling expense business logic
 */
export class ExpensesService {
  /**
   * Create a new expense with splits
   */
  async createExpense(userId: string, data: CreateExpenseInput): Promise<ExpenseResponse> {
    // 1. Get trip and verify user is member of trip's group
    const trip = await db
      .selectFrom('trips as t')
      .innerJoin('groups as g', 'g.id', 't.groupId')
      .select(['t.id', 't.groupId', 't.name as tripName', 'g.name as groupName'])
      .where('t.id', '=', data.tripId)
      .executeTakeFirst();

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    const membership = await this.verifyGroupMembership(trip.groupId, userId);

    if (!canCreateExpense(membership.role as GroupRole)) {
      throw new ForbiddenError('Insufficient permissions to create expenses');
    }

    // 2. Calculate splits based on splitType
    let splitsToCreate: { userId: string; amount: number }[] = [];

    if (data.splitType === 'EQUAL') {
      if (!data.splitWith || data.splitWith.length === 0) {
        throw new ValidationError('splitWith is required for EQUAL split type');
      }
      splitsToCreate = this.calculateEqualSplits(data.amount, data.splitWith);
    } else if (data.splitType === 'CUSTOM') {
      if (!data.customSplits || data.customSplits.length === 0) {
        throw new ValidationError('customSplits is required for CUSTOM split type');
      }
      splitsToCreate = data.customSplits.map((s) => ({
        userId: s.userId,
        amount: s.amount,
      }));
    }

    // 3. Verify all split users are members of the trip's group
    const splitUserIds = splitsToCreate.map((s) => s.userId);
    const members = await db
      .selectFrom('group_members')
      .select(['userId'])
      .where('groupId', '=', trip.groupId)
      .where('userId', 'in', splitUserIds)
      .execute();

    if (members.length !== splitUserIds.length) {
      throw new ValidationError('All split users must be members of the trip group');
    }

    // 4. Create expense and splits in transaction
    const result = await db.transaction().execute(async (trx) => {
      // Insert expense
      const newExpense = await trx
        .insertInto('expenses')
        .values({
          id: createId(),
          tripId: data.tripId,
          title: data.title,
          description: data.description,
          category: data.category,
          amount: data.amount.toString(), // Convert number to string for Decimal
          currency: data.currency,
          paidBy: userId,
          paidAt: data.paidAt,
          receiptUrl: data.receiptUrl,
          updatedAt: new Date(),
        })
        .returning([
          'id',
          'tripId',
          'title',
          'description',
          'category',
          'amount',
          'currency',
          'paidBy',
          'paidAt',
          'receiptUrl',
          'createdAt',
          'updatedAt',
        ])
        .executeTakeFirstOrThrow();

      // Insert splits
      const splitsData = splitsToCreate.map((split) => ({
        id: createId(),
        expenseId: newExpense.id,
        userId: split.userId,
        splitType: data.splitType,
        amount: split.amount.toString(), // Convert number to string for Decimal
        isPaid: false,
        updatedAt: new Date(),
      }));

      await trx.insertInto('expense_splits').values(splitsData).execute();

      // Log activity
      await trx
        .insertInto('activity_logs')
        .values({
          id: createId(),
          tripId: data.tripId,
          userId,
          type: 'EXPENSE_ADDED' as ActivityType,
          metadata: JSON.stringify({
            expenseId: newExpense.id,
            amount: newExpense.amount,
            category: newExpense.category,
            title: newExpense.title,
          }),
        })
        .execute();

      return newExpense;
    });

    // 5. Fetch and return complete expense with splits
    return this.getExpenseWithDetails(result.id, userId);
  }

  /**
   * Get a single expense by ID
   */
  async getExpense(expenseId: string, userId: string): Promise<ExpenseResponse> {
    // Get expense with basic details
    const expense = await db
      .selectFrom('expenses as e')
      .innerJoin('trips as t', 't.id', 'e.tripId')
      .select(['e.id', 't.groupId', 't.id as tripId'])
      .where('e.id', '=', expenseId)
      .executeTakeFirst();

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Verify user is member of trip's group
    await this.verifyGroupMembership(expense.groupId, userId);

    // Return full expense details
    return this.getExpenseWithDetails(expenseId, userId);
  }

  /**
   * List expenses for a trip with pagination and filters
   */
  async listExpenses(
    tripId: string,
    userId: string,
    query: ListExpensesQuery
  ): Promise<PaginatedExpensesResponse> {
    // 1. Get trip and verify user is member
    const trip = await db
      .selectFrom('trips')
      .select(['id', 'groupId', 'name'])
      .where('id', '=', tripId)
      .executeTakeFirst();

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    await this.verifyGroupMembership(trip.groupId, userId);

    // 2. Build base query
    let baseQuery = db.selectFrom('expenses as e').where('e.tripId', '=', tripId);

    // Apply filters
    if (query.category) {
      baseQuery = baseQuery.where('e.category', '=', query.category);
    }

    if (query.paidBy) {
      baseQuery = baseQuery.where('e.paidBy', '=', query.paidBy);
    }

    if (query.minAmount) {
      baseQuery = baseQuery.where('e.amount', '>=', query.minAmount.toString());
    }

    if (query.maxAmount) {
      baseQuery = baseQuery.where('e.amount', '<=', query.maxAmount.toString());
    }

    // 3. Get total count (separate query)
    const countResult = await baseQuery
      .select((eb) => eb.fn.count<number>('e.id').as('total'))
      .executeTakeFirst();

    const total = Number(countResult?.total || 0);

    // 4. Get paginated expenses
    const { page, limit, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    const expenses = await baseQuery
      .innerJoin('users as payer', 'payer.id', 'e.paidBy')
      .select([
        'e.id',
        'e.tripId',
        'e.title',
        'e.description',
        'e.category',
        'e.amount',
        'e.currency',
        'e.paidBy',
        'e.paidAt',
        'e.receiptUrl',
        'e.createdAt',
        'e.updatedAt',
        'payer.name as payerName',
        'payer.email as payerEmail',
      ])
      .orderBy(`e.${sortBy}`, sortOrder)
      .limit(limit)
      .offset(offset)
      .execute();

    // 5. For each expense, get splits
    const expenseResponses: ExpenseResponse[] = [];

    for (const expense of expenses) {
      const splits = await db
        .selectFrom('expense_splits as es')
        .innerJoin('users as u', 'u.id', 'es.userId')
        .select([
          'es.id',
          'es.expenseId',
          'es.userId',
          'es.splitType',
          'es.amount',
          'es.isPaid',
          'es.createdAt',
          'es.updatedAt',
          'es.paidAt',
          'u.name as userName',
          'u.email as userEmail',
        ])
        .where('es.expenseId', '=', expense.id)
        .execute();

      expenseResponses.push({
        id: expense.id,
        tripId: expense.tripId,
        title: expense.title,
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        currency: expense.currency,
        paidBy: expense.paidBy,
        paidAt: expense.paidAt,
        receiptUrl: expense.receiptUrl,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
        payer: {
          id: expense.paidBy,
          name: expense.payerName,
          email: expense.payerEmail,
        },
        splits: splits.map((s) => ({
          id: s.id,
          expenseId: s.expenseId,
          userId: s.userId,
          splitType: s.splitType,
          amount: s.amount,
          isPaid: s.isPaid,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          paidAt: s.paidAt,
          user: {
            id: s.userId,
            name: s.userName,
            email: s.userEmail,
          },
        })),
        trip: {
          id: trip.id,
          name: trip.name,
        },
      });
    }

    // 6. Return paginated response
    const totalPages = Math.ceil(total / limit);
    return {
      data: expenseResponses,
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
   * Update an expense
   */
  async updateExpense(
    expenseId: string,
    userId: string,
    data: UpdateExpenseInput
  ): Promise<ExpenseResponse> {
    // Get expense with trip and group info
    const expense = await db
      .selectFrom('expenses as e')
      .innerJoin('trips as t', 't.id', 'e.tripId')
      .select(['e.id', 'e.paidBy', 't.groupId', 't.id as tripId'])
      .where('e.id', '=', expenseId)
      .executeTakeFirst();

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Verify user is member and has permission
    const membership = await this.verifyGroupMembership(expense.groupId, userId);
    const isCreator = expense.paidBy === userId;

    if (!canModifyExpense(membership.role as GroupRole, isCreator)) {
      throw new ForbiddenError('Insufficient permissions to update this expense');
    }

    // Update expense
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.amount !== undefined) updateData.amount = data.amount.toString();
    if (data.paidAt !== undefined) updateData.paidAt = data.paidAt;
    if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl;

    await db
      .updateTable('expenses')
      .set(updateData)
      .where('id', '=', expenseId)
      .execute();

    // Return updated expense
    return this.getExpenseWithDetails(expenseId, userId);
  }

  /**
   * Delete an expense
   */
  async deleteExpense(expenseId: string, userId: string): Promise<void> {
    // Get expense with trip and group info
    const expense = await db
      .selectFrom('expenses as e')
      .innerJoin('trips as t', 't.id', 'e.tripId')
      .select(['e.id', 'e.paidBy', 't.groupId', 't.id as tripId'])
      .where('e.id', '=', expenseId)
      .executeTakeFirst();

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Verify user is member and has permission
    const membership = await this.verifyGroupMembership(expense.groupId, userId);
    const isCreator = expense.paidBy === userId;

    if (!canDeleteExpense(membership.role as GroupRole) && !isCreator) {
      throw new ForbiddenError('Insufficient permissions to delete this expense');
    }

    // Delete expense (cascades to splits)
    await db.deleteFrom('expenses').where('id', '=', expenseId).execute();
  }

  /**
   * Update an expense split (mark as paid/unpaid)
   */
  async updateSplit(
    expenseId: string,
    splitId: string,
    userId: string,
    data: UpdateSplitInput
  ): Promise<ExpenseSplitData> {
    // Get expense and verify exists
    const expense = await db
      .selectFrom('expenses as e')
      .innerJoin('trips as t', 't.id', 'e.tripId')
      .select(['e.id', 'e.paidBy', 't.groupId'])
      .where('e.id', '=', expenseId)
      .executeTakeFirst();

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Verify user is member of trip's group
    await this.verifyGroupMembership(expense.groupId, userId);

    // Get split and verify belongs to this expense
    const split = await db
      .selectFrom('expense_splits')
      .select(['id', 'expenseId', 'userId'])
      .where('id', '=', splitId)
      .where('expenseId', '=', expenseId)
      .executeTakeFirst();

    if (!split) {
      throw new NotFoundError('Expense split not found');
    }

    // Verify user is either the split owner OR the expense payer (can mark as received)
    if (split.userId !== userId && expense.paidBy !== userId) {
      throw new ForbiddenError('Only the split owner or payer can update payment status');
    }

    // Update split
    const updateData: any = {
      isPaid: data.isPaid,
      updatedAt: new Date(),
    };

    if (data.isPaid) {
      updateData.paidAt = new Date();
    } else {
      updateData.paidAt = null;
    }

    await db.updateTable('expense_splits').set(updateData).where('id', '=', splitId).execute();

    // Return updated split with user details
    const updatedSplit = await db
      .selectFrom('expense_splits as es')
      .innerJoin('users as u', 'u.id', 'es.userId')
      .select([
        'es.id',
        'es.expenseId',
        'es.userId',
        'es.splitType',
        'es.amount',
        'es.isPaid',
        'es.createdAt',
        'es.updatedAt',
        'es.paidAt',
        'u.name as userName',
        'u.email as userEmail',
      ])
      .where('es.id', '=', splitId)
      .executeTakeFirstOrThrow();

    return {
      id: updatedSplit.id,
      expenseId: updatedSplit.expenseId,
      userId: updatedSplit.userId,
      splitType: updatedSplit.splitType,
      amount: updatedSplit.amount,
      isPaid: updatedSplit.isPaid,
      createdAt: updatedSplit.createdAt,
      updatedAt: updatedSplit.updatedAt,
      paidAt: updatedSplit.paidAt,
      user: {
        id: updatedSplit.userId,
        name: updatedSplit.userName,
        email: updatedSplit.userEmail,
      },
    };
  }

  /**
   * Get user balances for a trip (who owes whom)
   */
  async getTripBalances(tripId: string, userId: string): Promise<UserBalanceResponse[]> {
    // Verify trip exists and user is member
    const trip = await db
      .selectFrom('trips')
      .select(['id', 'groupId'])
      .where('id', '=', tripId)
      .executeTakeFirst();

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    await this.verifyGroupMembership(trip.groupId, userId);

    // Get all group members
    const members = await db
      .selectFrom('group_members as gm')
      .innerJoin('users as u', 'u.id', 'gm.userId')
      .select(['u.id as userId', 'u.name as userName'])
      .where('gm.groupId', '=', trip.groupId)
      .execute();

    // Calculate balances for each member
    const balances: UserBalanceResponse[] = [];

    for (const member of members) {
      // Total paid: sum of expenses paid by this user
      const paidResult = await db
        .selectFrom('expenses')
        .select((eb) => eb.fn.sum<string>('amount').as('totalPaid'))
        .where('tripId', '=', tripId)
        .where('paidBy', '=', member.userId)
        .executeTakeFirst();

      const totalPaid = paidResult?.totalPaid || '0';

      // Total owed: sum of splits for this user (all splits, not just unpaid)
      const owedResult = await db
        .selectFrom('expense_splits as es')
        .innerJoin('expenses as e', 'e.id', 'es.expenseId')
        .select((eb) => eb.fn.sum<string>('es.amount').as('totalOwed'))
        .where('e.tripId', '=', tripId)
        .where('es.userId', '=', member.userId)
        .executeTakeFirst();

      const totalOwed = owedResult?.totalOwed || '0';

      // Calculate balance (positive = others owe them, negative = they owe others)
      const balance = (parseFloat(totalPaid) - parseFloat(totalOwed)).toFixed(2);

      balances.push({
        userId: member.userId,
        userName: member.userName,
        totalPaid,
        totalOwed,
        balance,
      });
    }

    return balances;
  }

  /**
   * Helper: Verify user is member of group
   * @private
   */
  private async verifyGroupMembership(
    groupId: string,
    userId: string
  ): Promise<{ role: string }> {
    const membership = await db
      .selectFrom('group_members')
      .select(['role'])
      .where('groupId', '=', groupId)
      .where('userId', '=', userId)
      .executeTakeFirst();

    if (!membership) {
      throw new ForbiddenError('You are not a member of this group');
    }

    return membership;
  }

  /**
   * Helper: Calculate equal splits among users
   * @private
   */
  private calculateEqualSplits(
    totalAmount: number,
    userIds: string[]
  ): { userId: string; amount: number }[] {
    const numUsers = userIds.length;
    const baseAmount = Math.floor((totalAmount * 100) / numUsers) / 100; // Round down to 2 decimals
    const remainder = totalAmount - baseAmount * numUsers;

    return userIds.map((userId, index) => ({
      userId,
      // Last user gets the remainder to ensure sum equals total
      amount: index === numUsers - 1 ? baseAmount + remainder : baseAmount,
    }));
  }

  /**
   * Helper: Get expense with full details (splits, payer, trip)
   * @private
   */
  private async getExpenseWithDetails(
    expenseId: string,
    userId: string
  ): Promise<ExpenseResponse> {
    // Get expense with payer and trip info
    const expense = await db
      .selectFrom('expenses as e')
      .innerJoin('users as payer', 'payer.id', 'e.paidBy')
      .innerJoin('trips as t', 't.id', 'e.tripId')
      .select([
        'e.id',
        'e.tripId',
        'e.title',
        'e.description',
        'e.category',
        'e.amount',
        'e.currency',
        'e.paidBy',
        'e.paidAt',
        'e.receiptUrl',
        'e.createdAt',
        'e.updatedAt',
        'payer.name as payerName',
        'payer.email as payerEmail',
        't.name as tripName',
      ])
      .where('e.id', '=', expenseId)
      .executeTakeFirstOrThrow();

    // Get splits with user details
    const splits = await db
      .selectFrom('expense_splits as es')
      .innerJoin('users as u', 'u.id', 'es.userId')
      .select([
        'es.id',
        'es.expenseId',
        'es.userId',
        'es.splitType',
        'es.amount',
        'es.isPaid',
        'es.createdAt',
        'es.updatedAt',
        'es.paidAt',
        'u.name as userName',
        'u.email as userEmail',
      ])
      .where('es.expenseId', '=', expenseId)
      .execute();

    return {
      id: expense.id,
      tripId: expense.tripId,
      title: expense.title,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      currency: expense.currency,
      paidBy: expense.paidBy,
      paidAt: expense.paidAt,
      receiptUrl: expense.receiptUrl,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      payer: {
        id: expense.paidBy,
        name: expense.payerName,
        email: expense.payerEmail,
      },
      splits: splits.map((s) => ({
        id: s.id,
        expenseId: s.expenseId,
        userId: s.userId,
        splitType: s.splitType,
        amount: s.amount,
        isPaid: s.isPaid,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        paidAt: s.paidAt,
        user: {
          id: s.userId,
          name: s.userName,
          email: s.userEmail,
        },
      })),
      trip: {
        id: expense.tripId,
        name: expense.tripName,
      },
    };
  }
}

// Export singleton instance
export const expensesService = new ExpensesService();
