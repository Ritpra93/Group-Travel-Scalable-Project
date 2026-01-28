/**
 * Expense Calculation Utilities
 *
 * Pure functions for expense splitting and settlement calculations.
 * These are extracted from ExpensesService to enable unit testing.
 */

/**
 * Split data structure returned by calculation functions
 */
export interface SplitResult {
    userId: string;
    amount: number;
}

/**
 * Input for percentage-based splits
 */
export interface PercentageSplitInput {
    userId: string;
    percentage: number;
}

/**
 * Balance data used for settlement calculations
 */
export interface UserBalance {
    userId: string;
    userName: string;
    balance: number;
}

/**
 * Settlement transaction result
 */
export interface SettlementTransaction {
    from: {
        userId: string;
        userName: string;
    };
    to: {
        userId: string;
        userName: string;
    };
    amount: string;
}

/**
 * Calculate equal splits among users
 *
 * Uses floor rounding for base amount and assigns remainder to last user
 * to ensure the sum always equals the original amount.
 *
 * @param totalAmount - Total amount to split (must be positive)
 * @param userIds - Array of user IDs to split among (must have at least 1)
 * @returns Array of splits with userId and amount
 */
export function calculateEqualSplits(
    totalAmount: number,
    userIds: string[]
): SplitResult[] {
    if (userIds.length === 0) {
        return [];
    }

    const numUsers = userIds.length;
    const baseAmount = Math.floor((totalAmount * 100) / numUsers) / 100; // Round down to 2 decimals
    const remainder = Math.round((totalAmount - baseAmount * numUsers) * 100) / 100;

    return userIds.map((userId, index) => ({
        userId,
        // Last user gets the remainder to ensure sum equals total
        amount: index === numUsers - 1
            ? Math.round((baseAmount + remainder) * 100) / 100
            : baseAmount,
    }));
}

/**
 * Calculate percentage-based splits
 *
 * Converts percentage allocations to actual amounts, handling rounding.
 * Any remainder due to rounding is assigned to the split with the largest percentage.
 *
 * @param totalAmount - Total amount to split
 * @param splits - Array of userId and percentage pairs (percentages should sum to 100)
 * @returns Array of splits with userId and calculated amount
 */
export function calculatePercentageSplits(
    totalAmount: number,
    splits: PercentageSplitInput[]
): SplitResult[] {
    if (splits.length === 0) {
        return [];
    }

    // Calculate raw amounts based on percentages
    const rawSplits = splits.map((s) => ({
        userId: s.userId,
        percentage: s.percentage,
        rawAmount: (totalAmount * s.percentage) / 100,
        amount: Math.floor(((totalAmount * s.percentage) / 100) * 100) / 100, // Round down to 2 decimals
    }));

    // Calculate the sum of rounded amounts
    const roundedSum = rawSplits.reduce((sum, s) => sum + s.amount, 0);
    const remainder = Math.round((totalAmount - roundedSum) * 100) / 100;

    // If there's a remainder due to rounding, add it to the largest split
    if (Math.abs(remainder) > 0.001) {
        // Find split with largest percentage to absorb remainder
        const largestIndex = rawSplits.reduce(
            (maxIdx, s, idx, arr) => (s.percentage > arr[maxIdx].percentage ? idx : maxIdx),
            0
        );
        rawSplits[largestIndex].amount =
            Math.round((rawSplits[largestIndex].amount + remainder) * 100) / 100;
    }

    return rawSplits.map((s) => ({
        userId: s.userId,
        amount: s.amount,
    }));
}

/**
 * Calculate optimal settlements to clear all debts with minimum transactions
 *
 * Uses a greedy algorithm matching largest debtor with largest creditor.
 * This produces a valid settlement but may not always be the absolute minimum
 * number of transactions for complex multi-party scenarios.
 *
 * @param balances - Array of user balances (positive = owed money, negative = owes money)
 * @returns Array of settlement transactions
 */
export function calculateOptimalSettlements(
    balances: UserBalance[]
): SettlementTransaction[] {
    // Separate into creditors (positive balance = others owe them) and debtors (negative balance)
    const creditors = balances
        .filter((b) => b.balance > 0.01)
        .map((b) => ({
            userId: b.userId,
            userName: b.userName,
            amount: b.balance,
        }))
        .sort((a, b) => b.amount - a.amount); // Sort descending by amount

    const debtors = balances
        .filter((b) => b.balance < -0.01)
        .map((b) => ({
            userId: b.userId,
            userName: b.userName,
            amount: Math.abs(b.balance),
        }))
        .sort((a, b) => b.amount - a.amount); // Sort descending by amount

    const settlements: SettlementTransaction[] = [];

    // Greedy matching: pair largest debtor with largest creditor
    while (creditors.length > 0 && debtors.length > 0) {
        const creditor = creditors[0];
        const debtor = debtors[0];

        // Settlement amount is the minimum of what debtor owes and what creditor is owed
        const settlementAmount = Math.min(creditor.amount, debtor.amount);

        if (settlementAmount > 0.01) {
            settlements.push({
                from: {
                    userId: debtor.userId,
                    userName: debtor.userName,
                },
                to: {
                    userId: creditor.userId,
                    userName: creditor.userName,
                },
                amount: settlementAmount.toFixed(2),
            });
        }

        // Update remaining amounts
        creditor.amount -= settlementAmount;
        debtor.amount -= settlementAmount;

        // Remove settled parties
        if (creditor.amount < 0.01) {
            creditors.shift();
        }
        if (debtor.amount < 0.01) {
            debtors.shift();
        }
    }

    return settlements;
}
