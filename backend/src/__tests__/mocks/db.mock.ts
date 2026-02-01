/**
 * Kysely Database Mock
 *
 * Provides a mock implementation of the Kysely database for testing.
 * All queries return mock data and don't hit the actual database.
 */

// Type for mock query results
type MockResult<T> = T[];

// Generic mock builder that chains and returns mock data
interface MockQueryBuilder<T> {
  select: jest.Mock;
  selectAll: jest.Mock;
  where: jest.Mock;
  whereRef: jest.Mock;
  orderBy: jest.Mock;
  limit: jest.Mock;
  offset: jest.Mock;
  innerJoin: jest.Mock;
  leftJoin: jest.Mock;
  groupBy: jest.Mock;
  as: jest.Mock;
  execute: jest.Mock;
  executeTakeFirst: jest.Mock;
  executeTakeFirstOrThrow: jest.Mock;
}

interface MockInsertBuilder<T> {
  values: jest.Mock;
  returning: jest.Mock;
  returningAll: jest.Mock;
  onConflict: jest.Mock;
  doNothing: jest.Mock;
  doUpdateSet: jest.Mock;
  execute: jest.Mock;
  executeTakeFirst: jest.Mock;
  executeTakeFirstOrThrow: jest.Mock;
}

interface MockUpdateBuilder<T> {
  set: jest.Mock;
  where: jest.Mock;
  returning: jest.Mock;
  returningAll: jest.Mock;
  execute: jest.Mock;
  executeTakeFirst: jest.Mock;
  executeTakeFirstOrThrow: jest.Mock;
}

interface MockDeleteBuilder<T> {
  where: jest.Mock;
  returning: jest.Mock;
  returningAll: jest.Mock;
  execute: jest.Mock;
  executeTakeFirst: jest.Mock;
  executeTakeFirstOrThrow: jest.Mock;
}

// Create a chainable mock query builder
function createMockQueryBuilder<T>(defaultResult: T[] = []): MockQueryBuilder<T> {
  const builder: Partial<MockQueryBuilder<T>> = {};

  // All chainable methods return the builder itself
  builder.select = jest.fn().mockReturnValue(builder);
  builder.selectAll = jest.fn().mockReturnValue(builder);
  builder.where = jest.fn().mockReturnValue(builder);
  builder.whereRef = jest.fn().mockReturnValue(builder);
  builder.orderBy = jest.fn().mockReturnValue(builder);
  builder.limit = jest.fn().mockReturnValue(builder);
  builder.offset = jest.fn().mockReturnValue(builder);
  builder.innerJoin = jest.fn().mockReturnValue(builder);
  builder.leftJoin = jest.fn().mockReturnValue(builder);
  builder.groupBy = jest.fn().mockReturnValue(builder);
  builder.as = jest.fn().mockReturnValue(builder);

  // Terminal methods
  builder.execute = jest.fn().mockResolvedValue(defaultResult);
  builder.executeTakeFirst = jest.fn().mockResolvedValue(defaultResult[0]);
  builder.executeTakeFirstOrThrow = jest.fn().mockImplementation(async () => {
    if (defaultResult.length === 0) {
      throw new Error('no result');
    }
    return defaultResult[0];
  });

  return builder as MockQueryBuilder<T>;
}

function createMockInsertBuilder<T>(defaultResult: T[] = []): MockInsertBuilder<T> {
  const builder: Partial<MockInsertBuilder<T>> = {};

  builder.values = jest.fn().mockReturnValue(builder);
  builder.returning = jest.fn().mockReturnValue(builder);
  builder.returningAll = jest.fn().mockReturnValue(builder);
  builder.onConflict = jest.fn().mockReturnValue(builder);
  builder.doNothing = jest.fn().mockReturnValue(builder);
  builder.doUpdateSet = jest.fn().mockReturnValue(builder);

  builder.execute = jest.fn().mockResolvedValue(defaultResult);
  builder.executeTakeFirst = jest.fn().mockResolvedValue(defaultResult[0]);
  builder.executeTakeFirstOrThrow = jest.fn().mockImplementation(async () => {
    if (defaultResult.length === 0) {
      throw new Error('no result');
    }
    return defaultResult[0];
  });

  return builder as MockInsertBuilder<T>;
}

function createMockUpdateBuilder<T>(defaultResult: T[] = []): MockUpdateBuilder<T> {
  const builder: Partial<MockUpdateBuilder<T>> = {};

  builder.set = jest.fn().mockReturnValue(builder);
  builder.where = jest.fn().mockReturnValue(builder);
  builder.returning = jest.fn().mockReturnValue(builder);
  builder.returningAll = jest.fn().mockReturnValue(builder);

  builder.execute = jest.fn().mockResolvedValue(defaultResult);
  builder.executeTakeFirst = jest.fn().mockResolvedValue(defaultResult[0]);
  builder.executeTakeFirstOrThrow = jest.fn().mockImplementation(async () => {
    if (defaultResult.length === 0) {
      throw new Error('no result');
    }
    return defaultResult[0];
  });

  return builder as MockUpdateBuilder<T>;
}

function createMockDeleteBuilder<T>(defaultResult: T[] = []): MockDeleteBuilder<T> {
  const builder: Partial<MockDeleteBuilder<T>> = {};

  builder.where = jest.fn().mockReturnValue(builder);
  builder.returning = jest.fn().mockReturnValue(builder);
  builder.returningAll = jest.fn().mockReturnValue(builder);

  builder.execute = jest.fn().mockResolvedValue(defaultResult);
  builder.executeTakeFirst = jest.fn().mockResolvedValue(defaultResult[0]);
  builder.executeTakeFirstOrThrow = jest.fn().mockImplementation(async () => {
    if (defaultResult.length === 0) {
      throw new Error('no result');
    }
    return defaultResult[0];
  });

  return builder as MockDeleteBuilder<T>;
}

// Define the mock database type explicitly to avoid circular reference
interface MockDatabase {
  selectFrom: jest.Mock;
  insertInto: jest.Mock;
  updateTable: jest.Mock;
  deleteFrom: jest.Mock;
  transaction: jest.Mock;
  destroy: jest.Mock;
}

// Mock database instance
export const mockDb: MockDatabase = {
  selectFrom: jest.fn(() => createMockQueryBuilder()),
  insertInto: jest.fn(() => createMockInsertBuilder()),
  updateTable: jest.fn(() => createMockUpdateBuilder()),
  deleteFrom: jest.fn(() => createMockDeleteBuilder()),
  transaction: jest.fn().mockReturnValue({
    execute: jest.fn(async (callback: (trx: MockDatabase) => Promise<unknown>) => {
      return callback(mockDb);
    }),
  }),
  destroy: jest.fn().mockResolvedValue(undefined),
};

// Helper to set mock return values for specific queries
export function mockSelectResult<T>(result: T[]) {
  const builder = createMockQueryBuilder(result);
  mockDb.selectFrom.mockReturnValueOnce(builder);
  return builder;
}

export function mockInsertResult<T>(result: T[]) {
  const builder = createMockInsertBuilder(result);
  mockDb.insertInto.mockReturnValueOnce(builder);
  return builder;
}

export function mockUpdateResult<T>(result: T[]) {
  const builder = createMockUpdateBuilder(result);
  mockDb.updateTable.mockReturnValueOnce(builder);
  return builder;
}

export function mockDeleteResult<T>(result: T[]) {
  const builder = createMockDeleteBuilder(result);
  mockDb.deleteFrom.mockReturnValueOnce(builder);
  return builder;
}

// Reset all mocks
export function resetDbMocks() {
  mockDb.selectFrom.mockClear();
  mockDb.insertInto.mockClear();
  mockDb.updateTable.mockClear();
  mockDb.deleteFrom.mockClear();
  mockDb.transaction.mockClear();
}

export default mockDb;
