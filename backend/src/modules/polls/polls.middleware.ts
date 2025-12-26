import type { GroupRole, PollStatus } from '../../config/database.types';

/**
 * Role hierarchy for permission checks
 */
const ROLE_HIERARCHY: Record<GroupRole, number> = {
  VIEWER: 1,
  MEMBER: 2,
  ADMIN: 3,
  OWNER: 4,
};

/**
 * Check if user role can create polls
 * @param role - User's group role
 * @returns true if MEMBER or higher
 */
export function canCreatePoll(role: GroupRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.MEMBER;
}

/**
 * Check if user role can delete polls
 * @param role - User's group role
 * @returns true if ADMIN or higher
 */
export function canDeletePoll(role: GroupRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN;
}

/**
 * Check if poll status allows voting
 * @param status - Current poll status
 * @returns true if poll is ACTIVE
 */
export function canVoteOnPoll(status: PollStatus): boolean {
  return status === 'ACTIVE';
}

/**
 * Validate poll status transition
 * @param currentStatus - Current poll status
 * @param newStatus - Desired new status
 * @returns true if transition is valid
 *
 * Valid transitions:
 * - ACTIVE → CLOSED
 * - ACTIVE → ARCHIVED
 * - CLOSED → ARCHIVED
 * No reverse transitions allowed
 */
export function isValidStatusTransition(
  currentStatus: PollStatus,
  newStatus: PollStatus
): boolean {
  if (currentStatus === 'ACTIVE') {
    return newStatus === 'CLOSED' || newStatus === 'ARCHIVED';
  }

  if (currentStatus === 'CLOSED') {
    return newStatus === 'ARCHIVED';
  }

  // Already archived, no further transitions
  return false;
}
