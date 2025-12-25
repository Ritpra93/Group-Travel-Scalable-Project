/**
 * Trips Module - Middleware and Helper Functions
 *
 * Permission helpers for trip operations based on group roles.
 */

type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

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
 * Check if user can update a trip
 *
 * Business Rule: MEMBER or higher can update trips
 *
 * @param role - User's role in the group
 * @returns True if user can update trips
 */
export function canUpdateTrip(role: GroupRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.MEMBER;
}

/**
 * Check if user can delete a trip
 *
 * Business Rule: ADMIN or higher can delete trips
 *
 * @param role - User's role in the group
 * @returns True if user can delete trips
 */
export function canDeleteTrip(role: GroupRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN;
}

/**
 * Check if user can change trip status
 *
 * Business Rule: MEMBER or higher can change trip status
 *
 * @param role - User's role in the group
 * @returns True if user can change trip status
 */
export function canChangeTripStatus(role: GroupRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.MEMBER;
}

/**
 * Validate status transition (optional - for future business rules)
 *
 * Currently allows all transitions. Can be enhanced to enforce:
 * - PLANNING → CONFIRMED → IN_PROGRESS → COMPLETED
 * - Any status → CANCELLED
 * - Cannot un-complete or un-cancel
 *
 * @param currentStatus - Current trip status
 * @param newStatus - Desired new status
 * @returns True if transition is valid
 */
export function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  // For now, allow any transition
  // Future enhancement: implement state machine logic
  return true;
}
