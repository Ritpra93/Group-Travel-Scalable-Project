import type { GroupRole } from '../../config/enums';

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
 * Check if user role can create itinerary items
 * @param role - User's group role
 * @returns true if MEMBER or higher
 */
export function canCreateItineraryItem(role: GroupRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.MEMBER;
}

/**
 * Check if user role can delete itinerary items
 * @param role - User's group role
 * @param isCreator - Whether user created the itinerary item
 * @returns true if ADMIN or higher, or if user is the creator
 */
export function canDeleteItineraryItem(role: GroupRole, isCreator: boolean): boolean {
  // ADMIN can delete any, creator can delete their own
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN || isCreator;
}

/**
 * Check if user can modify an itinerary item
 * @param role - User's group role
 * @param isCreator - Whether user created the itinerary item
 * @returns true if ADMIN or higher, or if user is the creator
 */
export function canModifyItineraryItem(role: GroupRole, isCreator: boolean): boolean {
  // ADMIN can modify any, creator can modify their own
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN || isCreator;
}
