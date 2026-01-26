/**
 * Socket.IO React Hooks
 * Hooks for managing socket connection and real-time updates
 */

'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  joinTripRoom,
  leaveTripRoom,
  isSocketConnected,
} from './socket.client';
import { pollsKeys } from '@/lib/api/hooks/use-polls';
import { expensesKeys } from '@/lib/api/hooks/use-expenses';
import type {
  SocketEvent,
  PollVotedData,
  PollCreatedData,
  PollClosedData,
  PollDeletedData,
  ExpenseCreatedData,
  ExpenseUpdatedData,
  ExpenseDeletedData,
  SplitUpdatedData,
} from './socket.types';

/**
 * Hook to manage socket connection based on authentication state
 * Call this once at the app level (e.g., in providers.tsx)
 */
export function useSocketConnection() {
  // Use selectors to prevent re-renders on unrelated state changes
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    // Connect when we have an access token
    if (accessToken && !isConnectedRef.current) {
      connectSocket();
      isConnectedRef.current = true;
    }

    // Disconnect when token is removed (logout)
    if (!accessToken && isConnectedRef.current) {
      disconnectSocket();
      isConnectedRef.current = false;
    }

    // Cleanup on unmount
    return () => {
      if (isConnectedRef.current) {
        disconnectSocket();
        isConnectedRef.current = false;
      }
    };
  }, [accessToken]);

  return { isConnected: isSocketConnected(), userId: user?.id };
}

/**
 * Hook to join a trip room and receive real-time updates
 * Automatically invalidates React Query cache on events
 */
export function useTripSocket(tripId: string | undefined) {
  const queryClient = useQueryClient();
  // Use selector to prevent re-renders on unrelated state changes
  const user = useAuthStore((state) => state.user);
  const joinedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!tripId) return;

    const socket = getSocket();
    if (!socket?.connected) {
      console.log('[useTripSocket] Socket not connected, waiting...');
      return;
    }

    // Join the trip room
    if (joinedRef.current !== tripId) {
      // Leave previous room if any
      if (joinedRef.current) {
        leaveTripRoom(joinedRef.current);
      }
      joinTripRoom(tripId);
      joinedRef.current = tripId;
    }

    // Skip invalidation for own events
    const shouldInvalidate = (eventUserId: string) => {
      return eventUserId !== user?.id;
    };

    // ========================================================================
    // Poll Event Handlers
    // ========================================================================

    const handlePollVoted = (event: SocketEvent<PollVotedData>) => {
      if (!shouldInvalidate(event.userId)) return;
      console.log('[Socket] Poll voted:', event.data);

      queryClient.invalidateQueries({ queryKey: pollsKeys.detail(event.data.pollId) });
      queryClient.invalidateQueries({ queryKey: pollsKeys.results(event.data.pollId) });
      queryClient.invalidateQueries({ queryKey: pollsKeys.list(tripId) });
    };

    const handlePollCreated = (event: SocketEvent<PollCreatedData>) => {
      if (!shouldInvalidate(event.userId)) return;
      console.log('[Socket] Poll created:', event.data);

      queryClient.invalidateQueries({ queryKey: pollsKeys.list(tripId) });
    };

    const handlePollClosed = (event: SocketEvent<PollClosedData>) => {
      if (!shouldInvalidate(event.userId)) return;
      console.log('[Socket] Poll closed:', event.data);

      queryClient.invalidateQueries({ queryKey: pollsKeys.detail(event.data.pollId) });
      queryClient.invalidateQueries({ queryKey: pollsKeys.list(tripId) });
    };

    const handlePollDeleted = (event: SocketEvent<PollDeletedData>) => {
      if (!shouldInvalidate(event.userId)) return;
      console.log('[Socket] Poll deleted:', event.data);

      queryClient.removeQueries({ queryKey: pollsKeys.detail(event.data.pollId) });
      queryClient.invalidateQueries({ queryKey: pollsKeys.list(tripId) });
    };

    // ========================================================================
    // Expense Event Handlers
    // ========================================================================

    const handleExpenseCreated = (event: SocketEvent<ExpenseCreatedData>) => {
      if (!shouldInvalidate(event.userId)) return;
      console.log('[Socket] Expense created:', event.data);

      queryClient.invalidateQueries({ queryKey: expensesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expensesKeys.balances(tripId) });
    };

    const handleExpenseUpdated = (event: SocketEvent<ExpenseUpdatedData>) => {
      if (!shouldInvalidate(event.userId)) return;
      console.log('[Socket] Expense updated:', event.data);

      queryClient.invalidateQueries({ queryKey: expensesKeys.detail(event.data.expenseId) });
      queryClient.invalidateQueries({ queryKey: expensesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expensesKeys.balances(tripId) });
    };

    const handleExpenseDeleted = (event: SocketEvent<ExpenseDeletedData>) => {
      if (!shouldInvalidate(event.userId)) return;
      console.log('[Socket] Expense deleted:', event.data);

      queryClient.removeQueries({ queryKey: expensesKeys.detail(event.data.expenseId) });
      queryClient.invalidateQueries({ queryKey: expensesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expensesKeys.balances(tripId) });
    };

    const handleSplitUpdated = (event: SocketEvent<SplitUpdatedData>) => {
      if (!shouldInvalidate(event.userId)) return;
      console.log('[Socket] Split updated:', event.data);

      queryClient.invalidateQueries({ queryKey: expensesKeys.detail(event.data.expenseId) });
      queryClient.invalidateQueries({ queryKey: expensesKeys.balances(tripId) });
      queryClient.invalidateQueries({ queryKey: expensesKeys.settlements(tripId) });
    };

    // Register event listeners
    socket.on('poll:voted', handlePollVoted);
    socket.on('poll:created', handlePollCreated);
    socket.on('poll:closed', handlePollClosed);
    socket.on('poll:deleted', handlePollDeleted);
    socket.on('expense:created', handleExpenseCreated);
    socket.on('expense:updated', handleExpenseUpdated);
    socket.on('expense:deleted', handleExpenseDeleted);
    socket.on('expense:split:updated', handleSplitUpdated);

    // Cleanup
    return () => {
      socket.off('poll:voted', handlePollVoted);
      socket.off('poll:created', handlePollCreated);
      socket.off('poll:closed', handlePollClosed);
      socket.off('poll:deleted', handlePollDeleted);
      socket.off('expense:created', handleExpenseCreated);
      socket.off('expense:updated', handleExpenseUpdated);
      socket.off('expense:deleted', handleExpenseDeleted);
      socket.off('expense:split:updated', handleSplitUpdated);

      // Leave the room when unmounting
      if (joinedRef.current === tripId) {
        leaveTripRoom(tripId);
        joinedRef.current = null;
      }
    };
  }, [tripId, queryClient, user?.id]);

  return { isConnected: isSocketConnected() };
}
