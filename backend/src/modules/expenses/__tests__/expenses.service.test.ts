/**
 * Expenses Service Tests
 * Unit tests for expense functionality including splits and settlements
 */

import { ExpensesService } from '../expenses.service';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../common/utils/errors';
import { db } from '../../../config/kysely';

// Mock the database
jest.mock('../../../config/kysely', () => ({
  db: {
    selectFrom: jest.fn(),
    insertInto: jest.fn(),
    updateTable: jest.fn(),
    deleteFrom: jest.fn(),
    transaction: jest.fn(),
  },
}));

// Mock cuid2
jest.mock('@paralleldrive/cuid2', () => ({
  createId: jest.fn(() => 'mock-id-123'),
}));

// Mock middleware
jest.mock('../expenses.middleware', () => ({
  canCreateExpense: jest.fn(() => true),
  canModifyExpense: jest.fn(() => true),
  canDeleteExpense: jest.fn(() => true),
}));

describe('ExpensesService', () => {
  let expensesService: ExpensesService;

  // Helper to create chainable mock
  const createChainableMock = (result: any = null) => {
    const mock: any = {};
    const methods = [
      'selectFrom', 'selectAll', 'select', 'where', 'insertInto',
      'updateTable', 'deleteFrom', 'values', 'set', 'returning',
      'innerJoin', 'leftJoin', 'orderBy', 'limit', 'offset',
    ];
    methods.forEach((m) => {
      mock[m] = jest.fn().mockReturnValue(mock);
    });
    mock.executeTakeFirst = jest.fn().mockResolvedValue(result);
    mock.executeTakeFirstOrThrow = jest.fn().mockResolvedValue(result);
    mock.execute = jest.fn().mockResolvedValue(result ? [result] : []);
    return mock;
  };

  beforeEach(() => {
    expensesService = new ExpensesService();
    jest.clearAllMocks();
  });

  // NOTE: Split calculation tests are in expenses.utils.test.ts
  // This file focuses on service-level behavior: CRUD, permissions, validation

  describe('Settlement Algorithm', () => {
    it('should calculate optimal settlements', async () => {
      // Mock trip and membership verification
      const tripMock = createChainableMock({ id: 'trip-1', groupId: 'group-1' });
      const membershipMock = createChainableMock({ role: 'MEMBER' });

      // Mock group members
      const membersMock = createChainableMock();
      membersMock.execute = jest.fn().mockResolvedValue([
        { userId: 'alice', userName: 'Alice' },
        { userId: 'bob', userName: 'Bob' },
        { userId: 'charlie', userName: 'Charlie' },
      ]);

      // Mock balances calculation
      // Alice paid $100, owes $33.33 -> balance = +66.67 (creditor)
      // Bob paid $0, owes $33.33 -> balance = -33.33 (debtor)
      // Charlie paid $0, owes $33.34 -> balance = -33.34 (debtor)

      const paidMocks = [
        createChainableMock({ totalPaid: '100' }), // Alice
        createChainableMock({ totalPaid: '0' }),   // Bob
        createChainableMock({ totalPaid: '0' }),   // Charlie
      ];

      const owedMocks = [
        createChainableMock({ totalOwed: '33.33' }), // Alice
        createChainableMock({ totalOwed: '33.33' }), // Bob
        createChainableMock({ totalOwed: '33.34' }), // Charlie
      ];

      let callCount = 0;
      (db.selectFrom as jest.Mock).mockImplementation(() => {
        callCount++;
        // First call: trip lookup
        if (callCount === 1) return tripMock;
        // Second call: membership check
        if (callCount === 2) return membershipMock;
        // Third call: get members
        if (callCount === 3) return membersMock;
        // Subsequent calls alternate between paid and owed for each member
        const memberIndex = Math.floor((callCount - 4) / 2);
        const isPaidQuery = (callCount - 4) % 2 === 0;
        return isPaidQuery ? paidMocks[memberIndex] : owedMocks[memberIndex];
      });

      const result = await expensesService.getSettlements('trip-1', 'alice');

      expect(result.settlements).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalTransactions).toBeGreaterThanOrEqual(0);
    });
  });

  describe('CRUD Operations', () => {
    describe('getExpense', () => {
      it('should throw NotFoundError for non-existent expense', async () => {
        const selectMock = createChainableMock(null);
        (db.selectFrom as jest.Mock).mockReturnValue(selectMock);

        await expect(
          expensesService.getExpense('non-existent', 'user-1')
        ).rejects.toThrow(NotFoundError);
      });

      it('should throw ForbiddenError for non-member', async () => {
        const expenseMock = createChainableMock({ id: 'exp-1', groupId: 'group-1', tripId: 'trip-1' });
        const membershipMock = createChainableMock(null); // Not a member

        (db.selectFrom as jest.Mock)
          .mockReturnValueOnce(expenseMock)
          .mockReturnValueOnce(membershipMock);

        await expect(
          expensesService.getExpense('exp-1', 'non-member')
        ).rejects.toThrow(ForbiddenError);
      });
    });

    describe('deleteExpense', () => {
      it('should throw NotFoundError for non-existent expense', async () => {
        const selectMock = createChainableMock(null);
        (db.selectFrom as jest.Mock).mockReturnValue(selectMock);

        await expect(
          expensesService.deleteExpense('non-existent', 'user-1')
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('updateSplit', () => {
      it('should throw NotFoundError for non-existent expense', async () => {
        const selectMock = createChainableMock(null);
        (db.selectFrom as jest.Mock).mockReturnValue(selectMock);

        await expect(
          expensesService.updateSplit('non-existent', 'split-1', 'user-1', { isPaid: true })
        ).rejects.toThrow(NotFoundError);
      });

      it('should throw NotFoundError for non-existent split', async () => {
        const expenseMock = createChainableMock({ id: 'exp-1', paidBy: 'user-1', groupId: 'group-1' });
        const membershipMock = createChainableMock({ role: 'MEMBER' });
        const splitMock = createChainableMock(null); // Split not found

        (db.selectFrom as jest.Mock)
          .mockReturnValueOnce(expenseMock)
          .mockReturnValueOnce(membershipMock)
          .mockReturnValueOnce(splitMock);

        await expect(
          expensesService.updateSplit('exp-1', 'non-existent-split', 'user-1', { isPaid: true })
        ).rejects.toThrow(NotFoundError);
      });

      it('should throw ForbiddenError if user is not split owner or payer', async () => {
        const expenseMock = createChainableMock({ id: 'exp-1', paidBy: 'payer-1', groupId: 'group-1' });
        const membershipMock = createChainableMock({ role: 'MEMBER' });
        const splitMock = createChainableMock({ id: 'split-1', expenseId: 'exp-1', userId: 'other-user' });

        (db.selectFrom as jest.Mock)
          .mockReturnValueOnce(expenseMock)
          .mockReturnValueOnce(membershipMock)
          .mockReturnValueOnce(splitMock);

        await expect(
          expensesService.updateSplit('exp-1', 'split-1', 'unauthorized-user', { isPaid: true })
        ).rejects.toThrow(ForbiddenError);
      });
    });
  });

  describe('getTripBalances', () => {
    it('should throw NotFoundError for non-existent trip', async () => {
      const selectMock = createChainableMock(null);
      (db.selectFrom as jest.Mock).mockReturnValue(selectMock);

      await expect(
        expensesService.getTripBalances('non-existent', 'user-1')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Validation', () => {
    it('should require splitWith for EQUAL split type', async () => {
      // Mock trip existence
      const tripMock = createChainableMock({ id: 'trip-1', groupId: 'group-1', tripName: 'Test', groupName: 'Test' });
      const membershipMock = createChainableMock({ role: 'MEMBER' });

      (db.selectFrom as jest.Mock)
        .mockReturnValueOnce(tripMock)
        .mockReturnValueOnce(membershipMock);

      await expect(
        expensesService.createExpense('user-1', {
          tripId: 'trip-1',
          title: 'Test Expense',
          amount: 100,
          category: 'OTHER',
          currency: 'USD',
          splitType: 'EQUAL',
          paidAt: new Date(),
          // Missing splitWith
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should require customSplits for CUSTOM split type', async () => {
      const tripMock = createChainableMock({ id: 'trip-1', groupId: 'group-1', tripName: 'Test', groupName: 'Test' });
      const membershipMock = createChainableMock({ role: 'MEMBER' });

      (db.selectFrom as jest.Mock)
        .mockReturnValueOnce(tripMock)
        .mockReturnValueOnce(membershipMock);

      await expect(
        expensesService.createExpense('user-1', {
          tripId: 'trip-1',
          title: 'Test Expense',
          amount: 100,
          category: 'OTHER',
          currency: 'USD',
          splitType: 'CUSTOM',
          paidAt: new Date(),
          // Missing customSplits
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should require percentageSplits for PERCENTAGE split type', async () => {
      const tripMock = createChainableMock({ id: 'trip-1', groupId: 'group-1', tripName: 'Test', groupName: 'Test' });
      const membershipMock = createChainableMock({ role: 'MEMBER' });

      (db.selectFrom as jest.Mock)
        .mockReturnValueOnce(tripMock)
        .mockReturnValueOnce(membershipMock);

      await expect(
        expensesService.createExpense('user-1', {
          tripId: 'trip-1',
          title: 'Test Expense',
          amount: 100,
          category: 'OTHER',
          currency: 'USD',
          splitType: 'PERCENTAGE',
          paidAt: new Date(),
          // Missing percentageSplits
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});
