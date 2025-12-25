import crypto from 'crypto';
import type { InvitationStatus } from './invitations.types';

/**
 * Invitations Module - Utility Functions
 *
 * Helper functions for invitation token generation, URL creation, and status checks.
 */

/**
 * Generate a secure random invitation token
 *
 * @returns A URL-safe random token (32 bytes, hex-encoded = 64 characters)
 */
export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate invitation URL for frontend
 *
 * @param token - The invitation token
 * @param frontendUrl - Base URL of the frontend (from env var)
 * @returns Full invitation URL that can be sent via email
 */
export function generateInvitationUrl(token: string, frontendUrl: string): string {
  const baseUrl = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
  return `${baseUrl}/invitations/accept?token=${token}`;
}

/**
 * Calculate default expiration date for invitations
 *
 * @param daysFromNow - Number of days until expiration (default: 7)
 * @returns Expiration date
 */
export function getDefaultExpirationDate(daysFromNow: number = 7): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

/**
 * Check if an invitation is expired
 *
 * @param expiresAt - Expiration date of the invitation
 * @returns true if expired, false otherwise
 */
export function isInvitationExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

/**
 * Check if invitation can be responded to (accepted/declined)
 *
 * @param status - Current status of the invitation
 * @param expiresAt - Expiration date
 * @returns true if invitation can be responded to, false otherwise
 */
export function canRespondToInvitation(status: InvitationStatus, expiresAt: Date): boolean {
  if (status !== 'PENDING') {
    return false;
  }
  return !isInvitationExpired(expiresAt);
}

/**
 * Check if invitation can be resent
 *
 * @param status - Current status of the invitation
 * @returns true if invitation can be resent, false otherwise
 */
export function canResendInvitation(status: InvitationStatus): boolean {
  // Can only resend PENDING or EXPIRED invitations
  return status === 'PENDING' || status === 'EXPIRED';
}

/**
 * Check if invitation can be canceled
 *
 * @param status - Current status of the invitation
 * @returns true if invitation can be canceled, false otherwise
 */
export function canCancelInvitation(status: InvitationStatus): boolean {
  // Can only cancel PENDING invitations
  return status === 'PENDING';
}

/**
 * Sanitize email for invitation lookup
 *
 * @param email - Email address
 * @returns Lowercased, trimmed email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
