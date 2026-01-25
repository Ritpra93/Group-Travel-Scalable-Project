/**
 * Polls Hooks
 * TanStack Query hooks for poll operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { pollsService, type PollWithResults } from '../services/polls.service';
import type { CreatePollDTO, UpdatePollDTO } from '@/types/api.types';
import type { PollType, PollStatus } from '@/types/models.types';

// ============================================================================
// Query Keys
// ============================================================================

export const pollsKeys = {
  all: ['polls'] as const,
  lists: () => [...pollsKeys.all, 'list'] as const,
  list: (tripId: string, filters?: Record<string, unknown>) =>
    [...pollsKeys.lists(), tripId, filters] as const,
  details: () => [...pollsKeys.all, 'detail'] as const,
  detail: (id: string) => [...pollsKeys.details(), id] as const,
  results: (id: string) => [...pollsKeys.all, 'results', id] as const,
  myVotes: (id: string) => [...pollsKeys.all, 'my-votes', id] as const,
};

// ============================================================================
// Polls Queries
// ============================================================================

/**
 * Get all polls for a trip with optional filters
 */
export function usePolls(
  tripId: string,
  params?: {
    status?: PollStatus;
    type?: PollType;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }
) {
  return useQuery({
    queryKey: pollsKeys.list(tripId, params),
    queryFn: () => pollsService.getPolls(tripId, params),
    enabled: !!tripId,
  });
}

/**
 * Get single poll by ID
 */
export function usePoll(pollId: string) {
  return useQuery({
    queryKey: pollsKeys.detail(pollId),
    queryFn: () => pollsService.getPoll(pollId),
    enabled: !!pollId,
  });
}

/**
 * Get poll results
 */
export function usePollResults(pollId: string) {
  return useQuery({
    queryKey: pollsKeys.results(pollId),
    queryFn: () => pollsService.getPollResults(pollId),
    enabled: !!pollId,
  });
}

/**
 * Get user's votes for a poll
 */
export function useMyVotes(pollId: string) {
  return useQuery({
    queryKey: pollsKeys.myVotes(pollId),
    queryFn: () => pollsService.getMyVotes(pollId),
    enabled: !!pollId,
  });
}

// ============================================================================
// Polls Mutations
// ============================================================================

/**
 * Create new poll
 */
export function useCreatePoll(tripId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreatePollDTO) => pollsService.createPoll(data),
    onSuccess: (newPoll) => {
      // Invalidate polls list for this trip
      queryClient.invalidateQueries({ queryKey: pollsKeys.list(tripId) });
      // Navigate to the poll
      router.push(`/trips/${tripId}/polls`);
    },
  });
}

/**
 * Update existing poll
 */
export function useUpdatePoll(pollId: string, tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePollDTO) => pollsService.updatePoll(pollId, data),
    onSuccess: (updatedPoll) => {
      // Update poll detail cache
      queryClient.setQueryData(pollsKeys.detail(pollId), updatedPoll);
      // Invalidate polls list
      queryClient.invalidateQueries({ queryKey: pollsKeys.list(tripId) });
    },
  });
}

/**
 * Close poll
 */
export function useClosePoll(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pollId: string) => pollsService.closePoll(pollId),
    onSuccess: (updatedPoll, pollId) => {
      // Update poll detail cache
      queryClient.setQueryData(pollsKeys.detail(pollId), updatedPoll);
      // Invalidate polls list
      queryClient.invalidateQueries({ queryKey: pollsKeys.list(tripId) });
      // Invalidate results
      queryClient.invalidateQueries({ queryKey: pollsKeys.results(pollId) });
    },
  });
}

/**
 * Delete poll
 */
export function useDeletePoll(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pollId: string) => pollsService.deletePoll(pollId),
    onSuccess: (_, pollId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: pollsKeys.detail(pollId) });
      // Invalidate polls list
      queryClient.invalidateQueries({ queryKey: pollsKeys.list(tripId) });
    },
  });
}

// ============================================================================
// Voting Mutations
// ============================================================================

/**
 * Cast a vote on a poll option
 */
export function useCastVote(pollId: string, tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (optionId: string) => pollsService.castVote(pollId, optionId),
    onSuccess: () => {
      // Invalidate poll detail to refresh vote counts
      queryClient.invalidateQueries({ queryKey: pollsKeys.detail(pollId) });
      // Invalidate results
      queryClient.invalidateQueries({ queryKey: pollsKeys.results(pollId) });
      // Invalidate my votes
      queryClient.invalidateQueries({ queryKey: pollsKeys.myVotes(pollId) });
      // Invalidate polls list (vote counts may be shown)
      queryClient.invalidateQueries({ queryKey: pollsKeys.list(tripId) });
    },
  });
}

/**
 * Change an existing vote
 */
export function useChangeVote(pollId: string, tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      oldOptionId,
      newOptionId,
    }: {
      oldOptionId: string;
      newOptionId: string;
    }) => pollsService.changeVote(pollId, oldOptionId, newOptionId),
    onSuccess: () => {
      // Invalidate poll detail
      queryClient.invalidateQueries({ queryKey: pollsKeys.detail(pollId) });
      // Invalidate results
      queryClient.invalidateQueries({ queryKey: pollsKeys.results(pollId) });
      // Invalidate my votes
      queryClient.invalidateQueries({ queryKey: pollsKeys.myVotes(pollId) });
      // Invalidate polls list
      queryClient.invalidateQueries({ queryKey: pollsKeys.list(tripId) });
    },
  });
}

/**
 * Remove a vote from a poll option
 */
export function useRemoveVote(pollId: string, tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (optionId: string) => pollsService.removeVote(pollId, optionId),
    onSuccess: () => {
      // Invalidate poll detail
      queryClient.invalidateQueries({ queryKey: pollsKeys.detail(pollId) });
      // Invalidate results
      queryClient.invalidateQueries({ queryKey: pollsKeys.results(pollId) });
      // Invalidate my votes
      queryClient.invalidateQueries({ queryKey: pollsKeys.myVotes(pollId) });
      // Invalidate polls list
      queryClient.invalidateQueries({ queryKey: pollsKeys.list(tripId) });
    },
  });
}
