/**
 * Socket Connection Manager
 * Manages socket connection based on authentication state
 */

'use client';

import { useSocketConnection } from '@/lib/socket';

/**
 * Component that manages the socket connection lifecycle
 * Renders nothing - just handles connection/disconnection
 */
export function SocketConnectionManager() {
  // This hook connects when authenticated and disconnects on logout
  useSocketConnection();

  // This component renders nothing
  return null;
}
