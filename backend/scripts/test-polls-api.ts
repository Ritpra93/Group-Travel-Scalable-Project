/**
 * Polls API Integration Test Script
 *
 * Tests all poll endpoints against a RUNNING backend server.
 * This is NOT a mock test — it makes real HTTP requests and validates real responses.
 *
 * Prerequisites:
 *   1. Backend running on http://localhost:4000
 *   2. PostgreSQL and Redis running
 *
 * Usage:
 *   npx tsx backend/scripts/test-polls-api.ts
 */

const BASE_URL = 'http://localhost:4000/api/v1';

// ============================================================================
// Test Infrastructure
// ============================================================================

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (error: any) {
    failed++;
    const msg = error?.message || String(error);
    failures.push(`${name}: ${msg}`);
    console.log(`  ❌ ${name}`);
    console.log(`     ${msg}`);
  }
}

async function api(
  method: string,
  path: string,
  options: { body?: any; token?: string; expectStatus?: number } = {}
): Promise<{ status: number; data: any }> {
  const { body, token, expectStatus } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (expectStatus && res.status !== expectStatus) {
    throw new Error(
      `Expected status ${expectStatus}, got ${res.status}. Body: ${JSON.stringify(data)}`
    );
  }

  return { status: res.status, data };
}

// ============================================================================
// Test Data
// ============================================================================

const timestamp = Date.now();
const testUser = {
  email: `polltest_${timestamp}@test.com`,
  password: 'TestPass123!',
  name: `Poll Tester ${timestamp}`,
};

const testUser2 = {
  email: `polltest2_${timestamp}@test.com`,
  password: 'TestPass123!',
  name: `Poll Tester 2 ${timestamp}`,
};

let token = '';
let token2 = '';
let userId = '';
let userId2 = '';
let groupId = '';
let tripId = '';
let singleChoicePollId = '';
let multiChoicePollId = '';
let singleChoiceOptionIds: string[] = [];
let multiChoiceOptionIds: string[] = [];

// ============================================================================
// Setup
// ============================================================================

async function setup() {
  console.log('\n📋 SETUP: Creating test users, group, and trip...\n');

  // Register user 1
  const reg1 = await api('POST', '/auth/register', {
    body: testUser,
    expectStatus: 201,
  });
  token = reg1.data.data.accessToken;
  userId = reg1.data.data.user.id;
  console.log(`  Created user 1: ${testUser.email}`);

  // Register user 2
  const reg2 = await api('POST', '/auth/register', {
    body: testUser2,
    expectStatus: 201,
  });
  token2 = reg2.data.data.accessToken;
  userId2 = reg2.data.data.user.id;
  console.log(`  Created user 2: ${testUser2.email}`);

  // Create group (user 1 is OWNER)
  const group = await api('POST', '/groups', {
    body: { name: `Test Group ${timestamp}`, description: 'For poll testing' },
    token,
    expectStatus: 201,
  });
  groupId = group.data.data.id;
  console.log(`  Created group: ${groupId}`);

  // Add user 2 to group
  await api('POST', `/groups/${groupId}/members`, {
    body: { email: testUser2.email, role: 'MEMBER' },
    token,
    expectStatus: 201,
  });
  console.log(`  Added user 2 to group as MEMBER`);

  // Create trip
  const trip = await api('POST', '/trips', {
    body: {
      groupId,
      name: `Test Trip ${timestamp}`,
      description: 'For poll testing',
      status: 'PLANNING',
    },
    token,
    expectStatus: 201,
  });
  tripId = trip.data.data.id;
  console.log(`  Created trip: ${tripId}`);
}

// ============================================================================
// Poll CRUD Tests
// ============================================================================

async function testPollCRUD() {
  console.log('\n🗳️  POLL CRUD TESTS\n');

  // Create single-choice poll
  await test('Create single-choice poll', async () => {
    const res = await api('POST', '/polls', {
      body: {
        tripId,
        title: 'Where should we go?',
        description: 'Pick one destination',
        type: 'PLACE',
        allowMultiple: false,
        options: [
          { label: 'Paris', description: 'City of lights' },
          { label: 'Tokyo', description: 'Land of the rising sun' },
          { label: 'New York', description: 'The Big Apple' },
        ],
      },
      token,
      expectStatus: 201,
    });
    singleChoicePollId = res.data.data.id;
    singleChoiceOptionIds = res.data.data.options.map((o: any) => o.id);
    assert(res.data.data.status === 'ACTIVE', 'Poll should be ACTIVE');
    assert(res.data.data.allowMultiple === false, 'Should be single-choice');
    assert(res.data.data.options.length === 3, 'Should have 3 options');
    assert(res.data.data.totalVotes === 0, 'Should have 0 votes');
  });

  // Create multi-choice poll with maxVotes
  await test('Create multi-choice poll with maxVotes', async () => {
    const res = await api('POST', '/polls', {
      body: {
        tripId,
        title: 'What activities interest you?',
        type: 'ACTIVITY',
        allowMultiple: true,
        maxVotes: 2,
        options: [
          { label: 'Hiking' },
          { label: 'Museums' },
          { label: 'Food Tour' },
          { label: 'Shopping' },
        ],
      },
      token,
      expectStatus: 201,
    });
    multiChoicePollId = res.data.data.id;
    multiChoiceOptionIds = res.data.data.options.map((o: any) => o.id);
    assert(res.data.data.allowMultiple === true, 'Should be multi-choice');
    assert(res.data.data.maxVotes === 2, 'maxVotes should be 2');
    assert(res.data.data.options.length === 4, 'Should have 4 options');
  });

  // Create poll with closesAt
  await test('Create poll with future closesAt', async () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await api('POST', '/polls', {
      body: {
        tripId,
        title: 'When should we go?',
        type: 'DATE',
        allowMultiple: false,
        closesAt: future,
        options: [
          { label: 'March' },
          { label: 'April' },
        ],
      },
      token,
      expectStatus: 201,
    });
    assert(res.data.data.closesAt !== null, 'closesAt should be set');
    // Clean up — delete this poll
    await api('DELETE', `/polls/${res.data.data.id}`, { token, expectStatus: 204 });
  });

  // Create poll with < 2 options should fail
  await test('Create poll with < 2 options fails (400)', async () => {
    await api('POST', '/polls', {
      body: {
        tripId,
        title: 'Bad poll',
        type: 'CUSTOM',
        allowMultiple: false,
        options: [{ label: 'Only one option' }],
      },
      token,
      expectStatus: 400,
    });
  });

  // Get single poll
  await test('Get poll returns full data', async () => {
    const res = await api('GET', `/polls/${singleChoicePollId}`, {
      token,
      expectStatus: 200,
    });
    assert(res.data.data.id === singleChoicePollId, 'Should return correct poll');
    assert(Array.isArray(res.data.data.options), 'Should include options');
    assert(Array.isArray(res.data.data.userVotes), 'Should include userVotes');
    assert(typeof res.data.data.totalVotes === 'number', 'Should include totalVotes');
  });

  // List polls for trip
  await test('List polls for trip', async () => {
    const res = await api('GET', `/trips/${tripId}/polls`, {
      token,
      expectStatus: 200,
    });
    assert(res.data.data.length >= 2, 'Should have at least 2 polls');
    assert(res.data.pagination !== undefined, 'Should include pagination');
  });

  // List polls with status filter
  await test('List polls with ACTIVE filter', async () => {
    const res = await api('GET', `/trips/${tripId}/polls?status=ACTIVE`, {
      token,
      expectStatus: 200,
    });
    const allActive = res.data.data.every((p: any) => p.status === 'ACTIVE');
    assert(allActive, 'All returned polls should be ACTIVE');
  });

  // Update poll
  await test('Update poll title', async () => {
    const res = await api('PUT', `/polls/${singleChoicePollId}`, {
      body: { title: 'Updated: Where should we go?' },
      token,
      expectStatus: 200,
    });
    assert(
      res.data.data.title === 'Updated: Where should we go?',
      'Title should be updated'
    );
  });
}

// ============================================================================
// Voting Tests — Single Choice
// ============================================================================

async function testSingleChoiceVoting() {
  console.log('\n🗳️  SINGLE-CHOICE VOTING TESTS\n');

  // Cast first vote
  await test('Cast vote on single-choice poll (201)', async () => {
    const res = await api('POST', `/polls/${singleChoicePollId}/vote`, {
      body: { optionId: singleChoiceOptionIds[0] },
      token,
      expectStatus: 201,
    });
    assert(res.data.data.optionId === singleChoiceOptionIds[0], 'Should vote for option 0');
  });

  // Verify vote is recorded
  await test('My votes returns voted option', async () => {
    const res = await api('GET', `/polls/${singleChoicePollId}/my-votes`, {
      token,
      expectStatus: 200,
    });
    assert(res.data.data.length === 1, 'Should have 1 vote');
    assert(
      res.data.data[0].optionId === singleChoiceOptionIds[0],
      'Should be for option 0'
    );
  });

  // Duplicate vote on same option fails
  await test('Duplicate vote on same option fails (422)', async () => {
    await api('POST', `/polls/${singleChoicePollId}/vote`, {
      body: { optionId: singleChoiceOptionIds[0] },
      token,
      expectStatus: 422,
    });
  });

  // Cast vote on different option fails (must use change endpoint)
  await test('Second castVote on different option fails (422)', async () => {
    await api('POST', `/polls/${singleChoicePollId}/vote`, {
      body: { optionId: singleChoiceOptionIds[1] },
      token,
      expectStatus: 422,
    });
  });

  // Change vote
  await test('Change vote to different option (200)', async () => {
    const res = await api('PUT', `/polls/${singleChoicePollId}/vote`, {
      body: {
        oldOptionId: singleChoiceOptionIds[0],
        newOptionId: singleChoiceOptionIds[1],
      },
      token,
      expectStatus: 200,
    });
    assert(res.data.data.optionId === singleChoiceOptionIds[1], 'Should now be option 1');
  });

  // Verify results after change
  await test('Results show updated vote counts', async () => {
    const res = await api('GET', `/polls/${singleChoicePollId}/results`, {
      token,
      expectStatus: 200,
    });
    assert(res.data.data.totalVotes === 1, 'Should have 1 total vote');
    const option0 = res.data.data.options.find(
      (o: any) => o.id === singleChoiceOptionIds[0]
    );
    const option1 = res.data.data.options.find(
      (o: any) => o.id === singleChoiceOptionIds[1]
    );
    assert(Number(option0.voteCount) === 0, 'Option 0 should have 0 votes');
    assert(Number(option1.voteCount) === 1, 'Option 1 should have 1 vote');
  });

  // Remove vote
  await test('Remove vote (204)', async () => {
    await api('DELETE', `/polls/${singleChoicePollId}/vote/${singleChoiceOptionIds[1]}`, {
      token,
      expectStatus: 204,
    });
  });

  // Verify vote removed
  await test('After removal, my-votes is empty', async () => {
    const res = await api('GET', `/polls/${singleChoicePollId}/my-votes`, {
      token,
      expectStatus: 200,
    });
    assert(res.data.data.length === 0, 'Should have 0 votes');
  });

  // Remove non-existent vote fails
  await test('Remove non-existent vote fails (404)', async () => {
    await api('DELETE', `/polls/${singleChoicePollId}/vote/${singleChoiceOptionIds[0]}`, {
      token,
      expectStatus: 404,
    });
  });

  // Second user can vote
  await test('Second user can vote independently (201)', async () => {
    await api('POST', `/polls/${singleChoicePollId}/vote`, {
      body: { optionId: singleChoiceOptionIds[2] },
      token: token2,
      expectStatus: 201,
    });
  });

  // Verify results with 2 users
  await test('Results reflect votes from multiple users', async () => {
    // User 1 votes again
    await api('POST', `/polls/${singleChoicePollId}/vote`, {
      body: { optionId: singleChoiceOptionIds[0] },
      token,
      expectStatus: 201,
    });

    const res = await api('GET', `/polls/${singleChoicePollId}/results`, {
      token,
      expectStatus: 200,
    });
    assert(res.data.data.totalVotes === 2, 'Should have 2 total votes');
  });
}

// ============================================================================
// Voting Tests — Multi Choice
// ============================================================================

async function testMultiChoiceVoting() {
  console.log('\n🗳️  MULTI-CHOICE VOTING TESTS\n');

  // Cast first vote
  await test('Cast first vote on multi-choice (201)', async () => {
    await api('POST', `/polls/${multiChoicePollId}/vote`, {
      body: { optionId: multiChoiceOptionIds[0] },
      token,
      expectStatus: 201,
    });
  });

  // Cast second vote (within maxVotes=2)
  await test('Cast second vote within maxVotes limit (201)', async () => {
    await api('POST', `/polls/${multiChoicePollId}/vote`, {
      body: { optionId: multiChoiceOptionIds[1] },
      token,
      expectStatus: 201,
    });
  });

  // Third vote exceeds maxVotes
  await test('Third vote exceeds maxVotes=2 (422)', async () => {
    await api('POST', `/polls/${multiChoicePollId}/vote`, {
      body: { optionId: multiChoiceOptionIds[2] },
      token,
      expectStatus: 422,
    });
  });

  // Remove one vote, then can vote again
  await test('After removing a vote, can vote again', async () => {
    await api('DELETE', `/polls/${multiChoicePollId}/vote/${multiChoiceOptionIds[0]}`, {
      token,
      expectStatus: 204,
    });

    await api('POST', `/polls/${multiChoicePollId}/vote`, {
      body: { optionId: multiChoiceOptionIds[2] },
      token,
      expectStatus: 201,
    });
  });

  // Verify my-votes
  await test('My votes shows correct multi-choice selections', async () => {
    const res = await api('GET', `/polls/${multiChoicePollId}/my-votes`, {
      token,
      expectStatus: 200,
    });
    assert(res.data.data.length === 2, 'Should have 2 votes');
    const votedIds = res.data.data.map((v: any) => v.optionId);
    assert(votedIds.includes(multiChoiceOptionIds[1]), 'Should include option 1');
    assert(votedIds.includes(multiChoiceOptionIds[2]), 'Should include option 2');
  });
}

// ============================================================================
// Poll Lifecycle Tests
// ============================================================================

async function testPollLifecycle() {
  console.log('\n🔒 POLL LIFECYCLE TESTS\n');

  // Close poll
  await test('Close poll changes status to CLOSED (200)', async () => {
    const res = await api('PATCH', `/polls/${singleChoicePollId}/close`, {
      token,
      expectStatus: 200,
    });
    assert(res.data.data.status === 'CLOSED', 'Status should be CLOSED');
  });

  // Vote on closed poll fails
  await test('Vote on closed poll fails (422)', async () => {
    await api('POST', `/polls/${singleChoicePollId}/vote`, {
      body: { optionId: singleChoiceOptionIds[2] },
      token: token2,
      expectStatus: 422,
    });
  });

  // Remove vote on closed poll fails
  await test('Remove vote on closed poll fails (422)', async () => {
    await api('DELETE', `/polls/${singleChoicePollId}/vote/${singleChoiceOptionIds[2]}`, {
      token: token2,
      expectStatus: 422,
    });
  });

  // Close already closed poll fails
  await test('Close already-closed poll fails (422)', async () => {
    await api('PATCH', `/polls/${singleChoicePollId}/close`, {
      token,
      expectStatus: 422,
    });
  });

  // Results still available after close
  await test('Results available after poll is closed', async () => {
    const res = await api('GET', `/polls/${singleChoicePollId}/results`, {
      token,
      expectStatus: 200,
    });
    assert(res.data.data.totalVotes >= 1, 'Should still have votes');
    assert(res.data.data.status === 'CLOSED', 'Status should show CLOSED');
  });
}

// ============================================================================
// Permission Tests
// ============================================================================

async function testPermissions() {
  console.log('\n🔐 PERMISSION TESTS\n');

  // MEMBER (user2) cannot delete poll
  await test('MEMBER cannot delete poll (403)', async () => {
    await api('DELETE', `/polls/${multiChoicePollId}`, {
      token: token2,
      expectStatus: 403,
    });
  });

  // OWNER (user1) can delete poll
  await test('OWNER can delete poll (204)', async () => {
    await api('DELETE', `/polls/${multiChoicePollId}`, {
      token,
      expectStatus: 204,
    });
  });

  // Verify deleted poll returns 404
  await test('Deleted poll returns 404', async () => {
    await api('GET', `/polls/${multiChoicePollId}`, {
      token,
      expectStatus: 404,
    });
  });

  // Unauthenticated request fails
  await test('Unauthenticated request fails (401)', async () => {
    await api('GET', `/trips/${tripId}/polls`, {
      expectStatus: 401,
    });
  });
}

// ============================================================================
// Edge Case Tests
// ============================================================================

async function testEdgeCases() {
  console.log('\n⚡ EDGE CASE TESTS\n');

  // Create poll with no auth
  await test('Create poll without auth fails (401)', async () => {
    await api('POST', '/polls', {
      body: {
        tripId,
        title: 'No auth poll',
        type: 'CUSTOM',
        allowMultiple: false,
        options: [{ label: 'A' }, { label: 'B' }],
      },
      expectStatus: 401,
    });
  });

  // Vote with invalid optionId
  await test('Vote with invalid optionId fails (404)', async () => {
    // Re-create a poll for this test
    const res = await api('POST', '/polls', {
      body: {
        tripId,
        title: 'Edge case poll',
        type: 'CUSTOM',
        allowMultiple: false,
        options: [{ label: 'X' }, { label: 'Y' }],
      },
      token,
      expectStatus: 201,
    });
    const edgePollId = res.data.data.id;

    await api('POST', `/polls/${edgePollId}/vote`, {
      body: { optionId: 'nonexistent-option-id-12345' },
      token,
      expectStatus: 404,
    });

    // Clean up
    await api('DELETE', `/polls/${edgePollId}`, { token, expectStatus: 204 });
  });

  // Get non-existent poll
  await test('Get non-existent poll fails (404)', async () => {
    await api('GET', '/polls/nonexistent-poll-id-12345', {
      token,
      expectStatus: 404,
    });
  });

  // Create poll with maxVotes but allowMultiple=false fails
  await test('maxVotes without allowMultiple fails validation (400)', async () => {
    await api('POST', '/polls', {
      body: {
        tripId,
        title: 'Bad config poll',
        type: 'CUSTOM',
        allowMultiple: false,
        maxVotes: 3,
        options: [{ label: 'A' }, { label: 'B' }],
      },
      token,
      expectStatus: 400,
    });
  });
}

// ============================================================================
// Cleanup
// ============================================================================

async function cleanup() {
  console.log('\n🧹 CLEANUP\n');

  try {
    // Delete remaining polls
    await api('DELETE', `/polls/${singleChoicePollId}`, { token }).catch(() => {});

    // Delete trip
    await api('DELETE', `/trips/${tripId}`, { token }).catch(() => {});

    // Delete group
    await api('DELETE', `/groups/${groupId}`, { token }).catch(() => {});

    console.log('  Cleaned up test data');
  } catch {
    console.log('  Cleanup completed (some resources may have already been deleted)');
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║        POLLS API INTEGRATION TEST SUITE         ║');
  console.log('║  Testing against: http://localhost:4000         ║');
  console.log('╚══════════════════════════════════════════════════╝');

  try {
    // Verify server is running
    try {
      await fetch(`${BASE_URL}/health`);
    } catch {
      console.error('\n❌ Cannot connect to backend at http://localhost:4000');
      console.error('   Make sure the backend is running: cd backend && npm run dev\n');
      process.exit(1);
    }

    await setup();
    await testPollCRUD();
    await testSingleChoiceVoting();
    await testMultiChoiceVoting();
    await testPollLifecycle();
    await testPermissions();
    await testEdgeCases();
    await cleanup();
  } catch (error: any) {
    console.error(`\n💥 Fatal error: ${error.message}`);
    await cleanup().catch(() => {});
  }

  // Summary
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log(`║  Results: ${passed} passed, ${failed} failed${' '.repeat(Math.max(0, 27 - String(passed).length - String(failed).length))}║`);
  console.log('╚══════════════════════════════════════════════════╝');

  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach((f) => console.log(`  ❌ ${f}`));
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

main();
