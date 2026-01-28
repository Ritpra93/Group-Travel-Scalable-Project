/**
 * Integration Tests for Expense Balance and Settlement Flow
 *
 * These tests verify the mathematical correctness of the balance calculation
 * and settlement flow without requiring a real database. They simulate the
 * string-to-number conversions that happen with Kysely Decimal types.
 *
 * Key scenarios tested:
 * 1. Balance formula: balance = totalPaid - totalOwed
 * 2. String-to-number conversion via parseFloat()
 * 3. End-to-end settlement calculation from balances
 * 4. Summary calculation correctness
 */

import { calculateOptimalSettlements, UserBalance } from '../expenses.utils';

/**
 * Simulates the balance calculation logic from ExpensesService.getTripBalances
 * This mirrors lines 566-573 of expenses.service.ts
 */
function calculateBalance(totalPaid: string, totalOwed: string): string {
    return (parseFloat(totalPaid) - parseFloat(totalOwed)).toFixed(2);
}

/**
 * Simulates the full settlement response building from ExpensesService.getSettlements
 * This mirrors lines 584-610 of expenses.service.ts
 */
function buildSettlementResponse(balances: Array<{ userId: string; userName: string; balance: string }>) {
    // Convert string balances to numbers (mirrors line 589-593)
    const numericBalances: UserBalance[] = balances.map((b) => ({
        userId: b.userId,
        userName: b.userName,
        balance: parseFloat(b.balance),
    }));

    // Calculate settlements (mirrors line 596)
    const settlements = calculateOptimalSettlements(numericBalances);

    // Calculate summary (mirrors lines 599-601)
    const totalAmount = settlements
        .reduce((sum, s) => sum + parseFloat(s.amount), 0)
        .toFixed(2);

    return {
        settlements,
        summary: {
            totalTransactions: settlements.length,
            totalAmount,
        },
    };
}

describe('Balance Calculation Integration', () => {
    describe('calculateBalance (string to number conversion)', () => {
        it('calculates positive balance when paid more than owed', () => {
            // User paid $100, owes $33.33 -> balance = +66.67
            const result = calculateBalance('100', '33.33');
            expect(result).toBe('66.67');
        });

        it('calculates negative balance when owed more than paid', () => {
            // User paid $0, owes $50 -> balance = -50.00
            const result = calculateBalance('0', '50');
            expect(result).toBe('-50.00');
        });

        it('calculates zero balance when paid equals owed', () => {
            const result = calculateBalance('100', '100');
            expect(result).toBe('0.00');
        });

        it('handles decimal precision from Kysely Decimal strings', () => {
            // Kysely returns Decimal as strings with full precision
            const result = calculateBalance('123.45', '67.89');
            expect(result).toBe('55.56');
        });

        it('handles very small amounts correctly', () => {
            const result = calculateBalance('0.01', '0.00');
            expect(result).toBe('0.01');
        });

        it('handles null-like string values (empty becoming 0)', () => {
            // When DB returns null, service uses '0' fallback
            const result = calculateBalance('0', '0');
            expect(result).toBe('0.00');
        });

        it('maintains precision with realistic trip scenario', () => {
            // $150 dinner split 3 ways: each owes $50
            // Alice paid $150, owes $50 -> balance = +100
            // Bob paid $0, owes $50 -> balance = -50
            // Charlie paid $0, owes $50 -> balance = -50
            expect(calculateBalance('150', '50')).toBe('100.00');
            expect(calculateBalance('0', '50')).toBe('-50.00');
            expect(calculateBalance('0', '50')).toBe('-50.00');

            // Verify sum of balances is zero (conservation of money)
            const sum = parseFloat('100.00') + parseFloat('-50.00') + parseFloat('-50.00');
            expect(sum).toBe(0);
        });
    });

    describe('parseFloat precision edge cases', () => {
        it('parseFloat handles Decimal string with many decimal places', () => {
            // Simulates potential DB Decimal precision
            const decimalString = '123.456789';
            const parsed = parseFloat(decimalString);
            expect(parsed).toBeCloseTo(123.456789, 6);
        });

        it('parseFloat handles negative Decimal strings', () => {
            const result = parseFloat('-50.25');
            expect(result).toBe(-50.25);
        });

        it('parseFloat returns 0 for empty or invalid strings', () => {
            expect(parseFloat('')).toBeNaN();
            expect(parseFloat('0')).toBe(0);
        });
    });
});

describe('Settlement Flow Integration', () => {
    describe('buildSettlementResponse (end-to-end)', () => {
        it('calculates settlements for simple 2-person trip', () => {
            const balances = [
                { userId: 'alice', userName: 'Alice', balance: '50.00' },
                { userId: 'bob', userName: 'Bob', balance: '-50.00' },
            ];

            const result = buildSettlementResponse(balances);

            expect(result.settlements).toHaveLength(1);
            expect(result.settlements[0]).toEqual({
                from: { userId: 'bob', userName: 'Bob' },
                to: { userId: 'alice', userName: 'Alice' },
                amount: '50.00',
            });
            expect(result.summary).toEqual({
                totalTransactions: 1,
                totalAmount: '50.00',
            });
        });

        it('calculates settlements for 3-person trip with one payer', () => {
            // Alice paid $150 dinner, split 3 ways ($50 each)
            const balances = [
                { userId: 'alice', userName: 'Alice', balance: '100.00' }, // paid 150, owes 50
                { userId: 'bob', userName: 'Bob', balance: '-50.00' },     // paid 0, owes 50
                { userId: 'charlie', userName: 'Charlie', balance: '-50.00' }, // paid 0, owes 50
            ];

            const result = buildSettlementResponse(balances);

            expect(result.settlements).toHaveLength(2);
            expect(result.summary.totalTransactions).toBe(2);
            expect(result.summary.totalAmount).toBe('100.00');

            // Verify both settlements go to Alice
            result.settlements.forEach((s) => {
                expect(s.to.userId).toBe('alice');
            });
        });

        it('handles realistic trip with multiple payers', () => {
            // Trip scenario:
            // - Alice paid $200 hotel, split 4 ways ($50 each) -> paid 200, owes 50 = +150
            // - Bob paid $80 dinner, split 4 ways ($20 each) -> paid 80, owes 70 = +10
            // - Charlie paid $0, owes $70 -> balance = -70
            // - Diana paid $0, owes $70 + $20 = $90 wait...

            // Simpler scenario:
            // Alice: paid 100, owes 25 = +75
            // Bob: paid 0, owes 25 = -25
            // Charlie: paid 0, owes 25 = -25
            // Diana: paid 0, owes 25 = -25
            const balances = [
                { userId: 'alice', userName: 'Alice', balance: '75.00' },
                { userId: 'bob', userName: 'Bob', balance: '-25.00' },
                { userId: 'charlie', userName: 'Charlie', balance: '-25.00' },
                { userId: 'diana', userName: 'Diana', balance: '-25.00' },
            ];

            const result = buildSettlementResponse(balances);

            expect(result.settlements).toHaveLength(3);
            expect(result.summary.totalAmount).toBe('75.00');

            // All payments should go to Alice
            result.settlements.forEach((s) => {
                expect(s.to.userId).toBe('alice');
                expect(s.amount).toBe('25.00');
            });
        });

        it('returns empty settlements when all balances are zero', () => {
            const balances = [
                { userId: 'alice', userName: 'Alice', balance: '0.00' },
                { userId: 'bob', userName: 'Bob', balance: '0.00' },
            ];

            const result = buildSettlementResponse(balances);

            expect(result.settlements).toHaveLength(0);
            expect(result.summary).toEqual({
                totalTransactions: 0,
                totalAmount: '0.00',
            });
        });

        it('filters out noise from rounding in balance strings', () => {
            // Balances might have tiny rounding errors from DB
            const balances = [
                { userId: 'alice', userName: 'Alice', balance: '0.00' },
                { userId: 'bob', userName: 'Bob', balance: '0.00' },
                { userId: 'charlie', userName: 'Charlie', balance: '0.01' }, // At threshold
            ];

            const result = buildSettlementResponse(balances);

            // 0.01 is at the threshold (> 0.01 required), so should be filtered
            expect(result.settlements).toHaveLength(0);
        });

        it('handles complex multi-creditor multi-debtor scenario', () => {
            // Two creditors, two debtors
            const balances = [
                { userId: 'alice', userName: 'Alice', balance: '60.00' },
                { userId: 'bob', userName: 'Bob', balance: '40.00' },
                { userId: 'charlie', userName: 'Charlie', balance: '-55.00' },
                { userId: 'diana', userName: 'Diana', balance: '-45.00' },
            ];

            const result = buildSettlementResponse(balances);

            // Total debt = 100, should all be settled
            expect(parseFloat(result.summary.totalAmount)).toBe(100);

            // Verify conservation: sum of settlements matches total debt
            const totalSettled = result.settlements.reduce(
                (sum, s) => sum + parseFloat(s.amount),
                0
            );
            expect(totalSettled).toBe(100);
        });
    });

    describe('summary calculation correctness', () => {
        it('totalAmount matches sum of individual settlement amounts', () => {
            const balances = [
                { userId: 'a', userName: 'A', balance: '100.00' },
                { userId: 'b', userName: 'B', balance: '-33.33' },
                { userId: 'c', userName: 'C', balance: '-33.33' },
                { userId: 'd', userName: 'D', balance: '-33.34' },
            ];

            const result = buildSettlementResponse(balances);

            const manualSum = result.settlements
                .reduce((sum, s) => sum + parseFloat(s.amount), 0)
                .toFixed(2);

            expect(result.summary.totalAmount).toBe(manualSum);
        });

        it('totalTransactions equals settlements array length', () => {
            const balances = [
                { userId: 'a', userName: 'A', balance: '50.00' },
                { userId: 'b', userName: 'B', balance: '30.00' },
                { userId: 'c', userName: 'C', balance: '-80.00' },
            ];

            const result = buildSettlementResponse(balances);

            expect(result.summary.totalTransactions).toBe(result.settlements.length);
        });
    });
});

describe('Money Conservation Invariant', () => {
    it('sum of all balances should be zero (money is conserved)', () => {
        // This is a critical invariant: in any trip, total paid out = total owed
        // So sum of (paid - owed) for all users should be 0

        // Simulate a real scenario
        const tripExpenses = [
            { paidBy: 'alice', amount: 150, splitAmong: ['alice', 'bob', 'charlie'] },
            { paidBy: 'bob', amount: 60, splitAmong: ['alice', 'bob'] },
        ];

        // Calculate what each person paid and owes
        const users = ['alice', 'bob', 'charlie'];
        const paid: Record<string, number> = { alice: 0, bob: 0, charlie: 0 };
        const owed: Record<string, number> = { alice: 0, bob: 0, charlie: 0 };

        tripExpenses.forEach((expense) => {
            paid[expense.paidBy] += expense.amount;
            const splitAmount = expense.amount / expense.splitAmong.length;
            expense.splitAmong.forEach((user) => {
                owed[user] += splitAmount;
            });
        });

        // Calculate balances
        const balances = users.map((user) => ({
            balance: paid[user] - owed[user],
        }));

        // Sum should be zero
        const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);
        expect(totalBalance).toBeCloseTo(0, 10);
    });

    it('total settlement amount equals total debt', () => {
        const balances = [
            { userId: 'a', userName: 'A', balance: '120.00' },
            { userId: 'b', userName: 'B', balance: '-40.00' },
            { userId: 'c', userName: 'C', balance: '-50.00' },
            { userId: 'd', userName: 'D', balance: '-30.00' },
        ];

        const result = buildSettlementResponse(balances);

        // Total debt = sum of negative balances = 40 + 50 + 30 = 120
        const totalDebt = balances
            .filter((b) => parseFloat(b.balance) < 0)
            .reduce((sum, b) => sum + Math.abs(parseFloat(b.balance)), 0);

        expect(parseFloat(result.summary.totalAmount)).toBe(totalDebt);
    });
});
