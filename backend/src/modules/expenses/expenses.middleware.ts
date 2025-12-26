import type { GroupRole } from '../../config/database.types';

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
 * Check if user role can create expenses
 * @param role - User's group role
 * @returns true if MEMBER or higher
 */
export function canCreateExpense(role: GroupRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.MEMBER;
}

/**
 * Check if user role can delete expenses
 * @param role - User's group role
 * @returns true if ADMIN or higher
 */
export function canDeleteExpense(role: GroupRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN;
}

/**
 * Check if user can modify an expense
 * @param role - User's group role
 * @param isCreator - Whether user created the expense
 * @returns true if ADMIN or higher, or if user is the creator
 */
export function canModifyExpense(role: GroupRole, isCreator: boolean): boolean {
  // ADMIN can modify any, creator can modify their own
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN || isCreator;
}
