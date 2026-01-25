/**
 * Socket.IO Client
 * Singleton socket instance with connection management
 */

import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { ServerToClientEvents, ClientToServerEvents } from './socket.types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Singleton socket instance
 */
let socket: TypedSocket | null = null;

/**
 * Connection state
 */
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Get the socket URL from environment
 */
function getSocketUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';
}

/**
 * Connect to the socket server
 * Uses the access token from auth store for authentication
 */
export function connectSocket(): TypedSocket | null {
  // Don't connect if already connected or connecting
  if (socket?.connected || isConnecting) {
    return socket;
  }

  // Get access token from auth store
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    console.warn('[Socket] No access token, cannot connect');
    return null;
  }

  isConnecting = true;
  reconnectAttempts = 0;

  const socketUrl = getSocketUrl();
  console.log('[Socket] Connecting to', socketUrl);

  socket = io(socketUrl, {
    auth: {
      token: accessToken,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  // Connection handlers
  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
    isConnecting = false;
    reconnectAttempts = 0;
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    isConnecting = false;
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
    isConnecting = false;
    reconnectAttempts++;

    // If auth error, don't retry
    if (error.message.includes('Authentication') || error.message.includes('unauthorized')) {
      console.log('[Socket] Auth error, stopping reconnection attempts');
      socket?.disconnect();
    }
  });

  socket.io.on('reconnect_attempt', (attempt) => {
    console.log('[Socket] Reconnect attempt:', attempt);

    // Update token on reconnect in case it was refreshed
    const newToken = useAuthStore.getState().accessToken;
    if (newToken && socket) {
      socket.auth = { token: newToken };
    }
  });

  socket.io.on('reconnect', (attempt) => {
    console.log('[Socket] Reconnected after', attempt, 'attempts');
  });

  socket.io.on('reconnect_failed', () => {
    console.error('[Socket] Reconnection failed after', MAX_RECONNECT_ATTEMPTS, 'attempts');
  });

  socket.on('error', (data) => {
    console.error('[Socket] Server error:', data.message);
  });

  return socket;
}

/**
 * Disconnect from the socket server
 */
export function disconnectSocket(): void {
  if (socket) {
    console.log('[Socket] Disconnecting');
    socket.disconnect();
    socket = null;
  }
  isConnecting = false;
  reconnectAttempts = 0;
}

/**
 * Get the current socket instance
 */
export function getSocket(): TypedSocket | null {
  return socket;
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

/**
 * Join a trip room to receive real-time updates
 */
export function joinTripRoom(tripId: string): void {
  if (!socket?.connected) {
    console.warn('[Socket] Cannot join room, not connected');
    return;
  }
  console.log('[Socket] Joining trip room:', tripId);
  socket.emit('trip:join', tripId);
}

/**
 * Leave a trip room
 */
export function leaveTripRoom(tripId: string): void {
  if (!socket?.connected) {
    return;
  }
  console.log('[Socket] Leaving trip room:', tripId);
  socket.emit('trip:leave', tripId);
}
