/**
 * Polls Service
 * API calls for poll management
 */

import { apiClient } from '../client';
import type {
  Poll,
  PollOption,
  CreatePollDTO,
  UpdatePollDTO,
  PaginatedResponse,
} from '@/types/api.types';
import type { PollType, PollStatus } from '@/types/models.types';

// ============================================================================
// Response Types
// ============================================================================

export interface PollWithResults extends Poll {
  totalVotes: number;
  userVotes?: string[]; // Option IDs user has voted for
}

export interface PollResults {
  pollId: string;
  totalVotes: number;
  options: Array<{
    id: string;
    label: string;
    voteCount: number;
    hasVoted?: boolean;
  }>;
  status: PollStatus;
}

// ============================================================================
// Polls CRUD
// ============================================================================

/**
 * Get all polls for a trip with optional filters
 */
export async function getPolls(
  tripId: string,
  params?: {
    status?: PollStatus;
    type?: PollType;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }
): Promise<PaginatedResponse<PollWithResults>> {
  const response = await apiClient.get(`/trips/${tripId}/polls`, { params });
  return response.data;
}

/**
 * Get single poll by ID
 */
export async function getPoll(pollId: string): Promise<PollWithResults> {
  const response = await apiClient.get(`/polls/${pollId}`);
  return response.data.data;
}

/**
 * Create new poll
 */
export async function createPoll(data: CreatePollDTO): Promise<Poll> {
  const response = await apiClient.post('/polls', data);
  return response.data.data;
}

/**
 * Update existing poll
 */
export async function updatePoll(
  pollId: string,
  data: UpdatePollDTO
): Promise<Poll> {
  const response = await apiClient.put(`/polls/${pollId}`, data);
  return response.data.data;
}

/**
 * Close a poll (no more voting allowed)
 */
export async function closePoll(pollId: string): Promise<Poll> {
  const response = await apiClient.patch(`/polls/${pollId}/close`);
  return response.data.data;
}

/**
 * Delete poll
 */
export async function deletePoll(pollId: string): Promise<void> {
  await apiClient.delete(`/polls/${pollId}`);
}

// ============================================================================
// Voting
// ============================================================================

/**
 * Cast a vote on a poll option
 */
export async function castVote(
  pollId: string,
  optionId: string
): Promise<{ id: string; pollId: string; optionId: string; userId: string; createdAt: string }> {
  const response = await apiClient.post(`/polls/${pollId}/vote`, { optionId });
  return response.data.data;
}

/**
 * Change an existing vote
 */
export async function changeVote(
  pollId: string,
  oldOptionId: string,
  newOptionId: string
): Promise<{ id: string; pollId: string; optionId: string; userId: string; createdAt: string }> {
  const response = await apiClient.put(`/polls/${pollId}/vote`, {
    oldOptionId,
    newOptionId,
  });
  return response.data.data;
}

/**
 * Remove a vote from a poll option
 */
export async function removeVote(
  pollId: string,
  optionId: string
): Promise<void> {
  await apiClient.delete(`/polls/${pollId}/vote/${optionId}`);
}

/**
 * Get poll results
 */
export async function getPollResults(pollId: string): Promise<PollResults> {
  const response = await apiClient.get(`/polls/${pollId}/results`);
  return response.data.data;
}

/**
 * Get user's votes for a poll
 */
export async function getMyVotes(pollId: string): Promise<string[]> {
  const response = await apiClient.get(`/polls/${pollId}/my-votes`);
  return response.data.data;
}

// ============================================================================
// Exports
// ============================================================================

export const pollsService = {
  getPolls,
  getPoll,
  createPoll,
  updatePoll,
  closePoll,
  deletePoll,
  castVote,
  changeVote,
  removeVote,
  getPollResults,
  getMyVotes,
};
