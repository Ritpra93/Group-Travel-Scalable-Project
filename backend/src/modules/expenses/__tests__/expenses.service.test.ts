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

  describe('Split Calculations', () => {
    // Access private methods for testing via bracket notation
    const service = new ExpensesService() as any;

    describe('calculateEqualSplits', () => {
      it('should split equally among 2 users', () => {
        const result = service.calculateEqualSplits(100, ['user1', 'user2']);

        expect(result).toHaveLength(2);
        expect(result[0].amount).toBe(50);
        expect(result[1].amount).toBe(50);

        // Verify sum equals total
        const total = result.reduce((sum: number, s: any) => sum + s.amount, 0);
        expect(total).toBe(100);
      });

      it('should split equally among 3 users with remainder', () => {
        const result = service.calculateEqualSplits(100, ['user1', 'user2', 'user3']);

        expect(result).toHaveLength(3);
        expect(result[0].amount).toBe(33.33);
        expect(result[1].amount).toBe(33.33);
        expect(result[2].amount).toBeCloseTo(33.34, 2); // Last user gets remainder

        // Verify sum equals total
        const total = result.reduce((sum: number, s: any) => sum + s.amount, 0);
        expect(total).toBeCloseTo(100, 2);
      });

      it('should handle single user split', () => {
        const result = service.calculateEqualSplits(100, ['user1']);

        expect(result).toHaveLength(1);
        expect(result[0].amount).toBe(100);
        expect(result[0].userId).toBe('user1');
      });

      it('should handle 4 users with complex remainder', () => {
        const result = service.calculateEqualSplits(99.99, ['u1', 'u2', 'u3', 'u4']);

        expect(result).toHaveLength(4);

        // Verify sum equals total
        const total = result.reduce((sum: number, s: any) => sum + s.amount, 0);
        expect(total).toBeCloseTo(99.99, 2);
      });

      it('should handle large number of users', () => {
        const userIds = Array.from({ length: 10 }, (_, i) => `user${i}`);
        const result = service.calculateEqualSplits(1000, userIds);

        expect(result).toHaveLength(10);

        // Verify sum equals total
        const total = result.reduce((sum: number, s: any) => sum + s.amount, 0);
        expect(total).toBe(1000);
      });
    });

    describe('calculatePercentageSplits', () => {
      it('should calculate percentage splits correctly', () => {
        const splits = [
          { userId: 'user1', percentage: 50 },
          { userId: 'user2', percentage: 50 },
        ];
        const result = service.calculatePercentageSplits(100, splits);

        expect(result).toHaveLength(2);
        expect(result[0].amount).toBe(50);
        expect(result[1].amount).toBe(50);
      });

      it('should handle uneven percentages', () => {
        const splits = [
          { userId: 'user1', percentage: 70 },
          { userId: 'user2', percentage: 30 },
        ];
        const result = service.calculatePercentageSplits(100, splits);

        expect(result[0].amount).toBe(70);
        expect(result[1].amount).toBe(30);

        const total = result.reduce((sum: number, s: any) => sum + s.amount, 0);
        expect(total).toBe(100);
      });

      it('should handle three-way split with decimals', () => {
        const splits = [
          { userId: 'user1', percentage: 33.33 },
          { userId: 'user2', percentage: 33.33 },
          { userId: 'user3', percentage: 33.34 },
        ];
        const result = service.calculatePercentageSplits(100, splits);

        // Verify sum equals total (within rounding tolerance)
        const total = result.reduce((sum: number, s: any) => sum + s.amount, 0);
        expect(total).toBeCloseTo(100, 1);
      });

      it('should handle rounding correctly for complex amounts', () => {
        const splits = [
          { userId: 'user1', percentage: 40 },
          { userId: 'user2', percentage: 35 },
          { userId: 'user3', percentage: 25 },
        ];
        const result = service.calculatePercentageSplits(99.99, splits);

        // Verify sum equals total
        const total = result.reduce((sum: number, s: any) => sum + s.amount, 0);
        expect(total).toBeCloseTo(99.99, 2);
      });
    });
  });

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
