/**
 * Unit Tests for Expense Calculation Utilities
 *
 * Tests the pure calculation functions extracted for expense splitting and settlements.
 * These functions handle money, so correctness is critical.
 */

import {
    calculateEqualSplits,
    calculatePercentageSplits,
    calculateOptimalSettlements,
    SplitResult,
    UserBalance,
} from '../expenses.utils';

describe('calculateEqualSplits', () => {
    /**
     * Helper to sum all split amounts
     */
    const sumSplits = (splits: SplitResult[]): number => {
        return splits.reduce((sum, s) => sum + s.amount, 0);
    };

    /**
     * Helper to round to 2 decimal places for comparison
     */
    const round2 = (n: number): number => Math.round(n * 100) / 100;

    it('splits evenly between 2 users', () => {
        const result = calculateEqualSplits(100, ['user1', 'user2']);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ userId: 'user1', amount: 50 });
        expect(result[1]).toEqual({ userId: 'user2', amount: 50 });
        expect(round2(sumSplits(result))).toBe(100);
    });

    it('handles remainder for 3 users ($100 / 3 = $33.33 + $33.33 + $33.34)', () => {
        const result = calculateEqualSplits(100, ['user1', 'user2', 'user3']);

        expect(result).toHaveLength(3);
        expect(result[0].amount).toBe(33.33);
        expect(result[1].amount).toBe(33.33);
        // Last user gets remainder
        expect(result[2].amount).toBe(33.34);
        expect(round2(sumSplits(result))).toBe(100);
    });

    it('handles single user (entire amount)', () => {
        const result = calculateEqualSplits(100, ['user1']);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ userId: 'user1', amount: 100 });
    });

    it('handles penny splits ($0.01 / 2)', () => {
        const result = calculateEqualSplits(0.01, ['user1', 'user2']);

        expect(result).toHaveLength(2);
        // $0.01 / 2 = $0.00 base, $0.01 remainder to last user
        expect(result[0].amount).toBe(0);
        expect(result[1].amount).toBe(0.01);
        expect(round2(sumSplits(result))).toBe(0.01);
    });

    it('handles very small amounts ($0.03 / 2)', () => {
        const result = calculateEqualSplits(0.03, ['user1', 'user2']);

        expect(result).toHaveLength(2);
        expect(result[0].amount).toBe(0.01);
        expect(result[1].amount).toBe(0.02);
        expect(round2(sumSplits(result))).toBe(0.03);
    });

    it('handles 7 users (prime number) - sum always equals original', () => {
        const users = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7'];
        const result = calculateEqualSplits(100, users);

        expect(result).toHaveLength(7);
        // 100 / 7 = 14.28... -> base = 14.28
        expect(result[0].amount).toBe(14.28);
        // Sum must equal exactly $100.00
        expect(round2(sumSplits(result))).toBe(100);
    });

    it('handles large amounts ($10000 / 3)', () => {
        const result = calculateEqualSplits(10000, ['user1', 'user2', 'user3']);

        expect(result).toHaveLength(3);
        expect(round2(sumSplits(result))).toBe(10000);
    });

    it('returns empty array for empty user list', () => {
        const result = calculateEqualSplits(100, []);

        expect(result).toHaveLength(0);
    });

    it('preserves user order in output', () => {
        const result = calculateEqualSplits(100, ['alice', 'bob', 'charlie']);

        expect(result[0].userId).toBe('alice');
        expect(result[1].userId).toBe('bob');
        expect(result[2].userId).toBe('charlie');
    });

    // Floating-point stress tests
    describe('floating-point edge cases', () => {
        it('handles realistic amount with prime divisor ($1234.56 / 7)', () => {
            const result = calculateEqualSplits(1234.56, ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7']);

            expect(result).toHaveLength(7);
            // 1234.56 / 7 = 176.3657... -> base = 176.36
            // Verify sum equals original exactly
            expect(round2(sumSplits(result))).toBe(1234.56);
        });

        it('handles sub-penny base amounts ($0.07 / 3)', () => {
            const result = calculateEqualSplits(0.07, ['user1', 'user2', 'user3']);

            expect(result).toHaveLength(3);
            // 0.07 / 3 = 0.0233... -> base = 0.02
            // Sum must equal exactly $0.07
            expect(round2(sumSplits(result))).toBe(0.07);
        });

        it('handles large amount with large prime divisor ($999.99 / 11)', () => {
            const users = Array.from({ length: 11 }, (_, i) => `user${i}`);
            const result = calculateEqualSplits(999.99, users);

            expect(result).toHaveLength(11);
            // 999.99 / 11 = 90.908... -> base = 90.90
            expect(round2(sumSplits(result))).toBe(999.99);
        });

        it('handles IEEE 754 problematic value ($0.30 / 3)', () => {
            // 0.1 + 0.1 + 0.1 !== 0.3 in IEEE 754
            const result = calculateEqualSplits(0.3, ['user1', 'user2', 'user3']);

            expect(result).toHaveLength(3);
            expect(round2(sumSplits(result))).toBe(0.3);
        });

        it('sum invariant holds for multiple sequential calculations', () => {
            const amounts = [100, 33.33, 0.01, 1234.56, 999.99];
            const userCounts = [2, 3, 5, 7, 11];

            amounts.forEach((amount, i) => {
                const users = Array.from({ length: userCounts[i] }, (_, j) => `u${j}`);
                const result = calculateEqualSplits(amount, users);
                expect(round2(sumSplits(result))).toBe(amount);
            });
        });
    });
});

describe('calculatePercentageSplits', () => {
    const sumSplits = (splits: SplitResult[]): number => {
        return splits.reduce((sum, s) => sum + s.amount, 0);
    };

    const round2 = (n: number): number => Math.round(n * 100) / 100;

    it('handles 50/50 split', () => {
        const result = calculatePercentageSplits(100, [
            { userId: 'user1', percentage: 50 },
            { userId: 'user2', percentage: 50 },
        ]);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ userId: 'user1', amount: 50 });
        expect(result[1]).toEqual({ userId: 'user2', amount: 50 });
        expect(round2(sumSplits(result))).toBe(100);
    });

    it('handles 60/40 split', () => {
        const result = calculatePercentageSplits(100, [
            { userId: 'user1', percentage: 60 },
            { userId: 'user2', percentage: 40 },
        ]);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ userId: 'user1', amount: 60 });
        expect(result[1]).toEqual({ userId: 'user2', amount: 40 });
        expect(round2(sumSplits(result))).toBe(100);
    });

    it('handles 33.33/33.33/33.34 (remainder to largest percentage)', () => {
        const result = calculatePercentageSplits(100, [
            { userId: 'user1', percentage: 33.33 },
            { userId: 'user2', percentage: 33.33 },
            { userId: 'user3', percentage: 33.34 },
        ]);

        expect(result).toHaveLength(3);
        // Sum must equal exactly $100.00
        expect(round2(sumSplits(result))).toBe(100);
    });

    it('handles 100% single user', () => {
        const result = calculatePercentageSplits(100, [
            { userId: 'user1', percentage: 100 },
        ]);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ userId: 'user1', amount: 100 });
    });

    it('handles uneven percentages with rounding (70/30)', () => {
        const result = calculatePercentageSplits(100, [
            { userId: 'user1', percentage: 70 },
            { userId: 'user2', percentage: 30 },
        ]);

        expect(result[0]).toEqual({ userId: 'user1', amount: 70 });
        expect(result[1]).toEqual({ userId: 'user2', amount: 30 });
        expect(round2(sumSplits(result))).toBe(100);
    });

    it('assigns remainder to split with largest percentage', () => {
        // 33.33% of $100 = $33.33, but 3 * 33.33 = 99.99, remainder = 0.01
        // Largest percentage holder (user3 at 33.34%) should get the remainder
        const result = calculatePercentageSplits(100, [
            { userId: 'user1', percentage: 10 },
            { userId: 'user2', percentage: 40 },
            { userId: 'user3', percentage: 50 },
        ]);

        expect(round2(sumSplits(result))).toBe(100);
        // user3 has highest percentage, should absorb any remainder
    });

    it('returns empty array for empty splits', () => {
        const result = calculatePercentageSplits(100, []);

        expect(result).toHaveLength(0);
    });

    it('handles small percentage on small amount', () => {
        const result = calculatePercentageSplits(1, [
            { userId: 'user1', percentage: 50 },
            { userId: 'user2', percentage: 50 },
        ]);

        expect(result[0].amount).toBe(0.5);
        expect(result[1].amount).toBe(0.5);
        expect(round2(sumSplits(result))).toBe(1);
    });

    it('handles decimal percentages (25.5/74.5)', () => {
        const result = calculatePercentageSplits(100, [
            { userId: 'user1', percentage: 25.5 },
            { userId: 'user2', percentage: 74.5 },
        ]);

        expect(round2(sumSplits(result))).toBe(100);
    });
});

describe('calculateOptimalSettlements', () => {
    it('handles simple 2-party settlement (A owes B)', () => {
        const balances: UserBalance[] = [
            { userId: 'userA', userName: 'Alice', balance: -50 },
            { userId: 'userB', userName: 'Bob', balance: 50 },
        ];

        const result = calculateOptimalSettlements(balances);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            from: { userId: 'userA', userName: 'Alice' },
            to: { userId: 'userB', userName: 'Bob' },
            amount: '50.00',
        });
    });

    it('handles 3-party settlement (A paid, B and C owe)', () => {
        const balances: UserBalance[] = [
            { userId: 'userA', userName: 'Alice', balance: 100 }, // Paid $100, owes $0
            { userId: 'userB', userName: 'Bob', balance: -60 },   // Owes $60
            { userId: 'userC', userName: 'Charlie', balance: -40 }, // Owes $40
        ];

        const result = calculateOptimalSettlements(balances);

        expect(result).toHaveLength(2);
        // Greedy algorithm: largest debtor (Bob: -60) pays largest creditor (Alice: +100)
        expect(result[0]).toEqual({
            from: { userId: 'userB', userName: 'Bob' },
            to: { userId: 'userA', userName: 'Alice' },
            amount: '60.00',
        });
        expect(result[1]).toEqual({
            from: { userId: 'userC', userName: 'Charlie' },
            to: { userId: 'userA', userName: 'Alice' },
            amount: '40.00',
        });
    });

    it('returns empty array when all balances are zero', () => {
        const balances: UserBalance[] = [
            { userId: 'userA', userName: 'Alice', balance: 0 },
            { userId: 'userB', userName: 'Bob', balance: 0 },
        ];

        const result = calculateOptimalSettlements(balances);

        expect(result).toHaveLength(0);
    });

    it('returns empty array when balances are within tolerance (< $0.01)', () => {
        const balances: UserBalance[] = [
            { userId: 'userA', userName: 'Alice', balance: 0.005 },
            { userId: 'userB', userName: 'Bob', balance: -0.005 },
        ];

        const result = calculateOptimalSettlements(balances);

        expect(result).toHaveLength(0);
    });

    it('handles complex 4-party scenario', () => {
        const balances: UserBalance[] = [
            { userId: 'userA', userName: 'Alice', balance: 80 },
            { userId: 'userB', userName: 'Bob', balance: 20 },
            { userId: 'userC', userName: 'Charlie', balance: -60 },
            { userId: 'userD', userName: 'Diana', balance: -40 },
        ];

        const result = calculateOptimalSettlements(balances);

        // Total settlements should equal total debt
        const totalSettled = result.reduce((sum, s) => sum + parseFloat(s.amount), 0);
        expect(totalSettled).toBe(100); // $60 + $40 = $100 total debt
    });

    it('uses greedy algorithm - pairs largest debtor with largest creditor', () => {
        const balances: UserBalance[] = [
            { userId: 'userA', userName: 'Alice', balance: 100 },
            { userId: 'userB', userName: 'Bob', balance: -70 },
            { userId: 'userC', userName: 'Charlie', balance: -30 },
        ];

        const result = calculateOptimalSettlements(balances);

        // First settlement should be Bob (largest debtor) -> Alice (largest creditor)
        expect(result[0].from.userId).toBe('userB');
        expect(result[0].to.userId).toBe('userA');
    });

    it('handles single creditor multiple debtors', () => {
        const balances: UserBalance[] = [
            { userId: 'userA', userName: 'Alice', balance: 100 },
            { userId: 'userB', userName: 'Bob', balance: -25 },
            { userId: 'userC', userName: 'Charlie', balance: -25 },
            { userId: 'userD', userName: 'Diana', balance: -25 },
            { userId: 'userE', userName: 'Eve', balance: -25 },
        ];

        const result = calculateOptimalSettlements(balances);

        expect(result).toHaveLength(4);
        // All payments go to Alice
        result.forEach(settlement => {
            expect(settlement.to.userId).toBe('userA');
        });
    });

    it('handles multiple creditors single debtor', () => {
        const balances: UserBalance[] = [
            { userId: 'userA', userName: 'Alice', balance: 30 },
            { userId: 'userB', userName: 'Bob', balance: 20 },
            { userId: 'userC', userName: 'Charlie', balance: 10 },
            { userId: 'userD', userName: 'Diana', balance: -60 },
        ];

        const result = calculateOptimalSettlements(balances);

        // All payments come from Diana
        result.forEach(settlement => {
            expect(settlement.from.userId).toBe('userD');
        });

        // Total should equal Diana's debt
        const totalSettled = result.reduce((sum, s) => sum + parseFloat(s.amount), 0);
        expect(totalSettled).toBe(60);
    });

    it('handles empty balance array', () => {
        const result = calculateOptimalSettlements([]);

        expect(result).toHaveLength(0);
    });
});
