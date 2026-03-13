/**
 * Trip Polls Page
 * List all polls for a trip with voting functionality
 */

'use client';

import { use } from 'react';
import Link from 'next/link';
import { Plus, Vote, ArrowLeft, Filter } from 'lucide-react';
import { useTrip } from '@/lib/api/hooks/use-trips';
import {
  usePolls,
  useClosePoll,
  useDeletePoll,
  pollsKeys,
} from '@/lib/api/hooks/use-polls';
import { pollsService } from '@/lib/api/services/polls.service';
import { useQueryClient } from '@tanstack/react-query';
import { useTripSocket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PollCard } from '@/components/patterns/poll-card';
import { cn } from '@/lib/utils/cn';
import type { PollStatus } from '@/types/models.types';
import { useState } from 'react';

interface PollsPageProps {
  params: Promise<{ tripId: string }>;
}

export default function PollsPage({ params }: PollsPageProps) {
  const { tripId } = use(params);
  const [statusFilter, setStatusFilter] = useState<PollStatus | 'ALL'>('ALL');

  // Enable real-time updates for this trip
  useTripSocket(tripId);

  // Fetch trip and polls
  const { data: trip, isLoading: isLoadingTrip } = useTrip(tripId);
  const { data: pollsData, isLoading: isLoadingPolls } = usePolls(tripId, {
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  // Mutations
  const queryClient = useQueryClient();
  const closePoll = useClosePoll(tripId);
  const deletePoll = useDeletePoll(tripId);

  const polls = pollsData?.data || [];
  const isLoading = isLoadingTrip || isLoadingPolls;

  // Track which poll is currently being voted on
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  const [voteError, setVoteError] = useState<string | null>(null);

  const invalidatePollQueries = (pollId: string) => {
    queryClient.invalidateQueries({ queryKey: pollsKeys.detail(pollId) });
    queryClient.invalidateQueries({ queryKey: pollsKeys.results(pollId) });
    queryClient.invalidateQueries({ queryKey: pollsKeys.myVotes(pollId) });
    // Use lists() prefix to match all list queries regardless of filter params
    queryClient.invalidateQueries({ queryKey: pollsKeys.lists() });
  };

  const handleVote = async (pollId: string, optionId: string) => {
    setVotingPollId(pollId);
    setVoteError(null);
    try {
      const poll = polls.find((p) => p.id === pollId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userVotes: string[] = (poll as any)?.userVotes || [];

      if (!poll?.allowMultiple && userVotes.length > 0) {
        // Single-choice poll, user already voted — change vote
        await pollsService.changeVote(pollId, userVotes[0], optionId);
      } else {
        await pollsService.castVote(pollId, optionId);
      }
      invalidatePollQueries(pollId);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to vote';
      setVoteError(message);
    } finally {
      setVotingPollId(null);
    }
  };

  const handleRemoveVote = async (pollId: string, optionId: string) => {
    setVotingPollId(pollId);
    setVoteError(null);
    try {
      await pollsService.removeVote(pollId, optionId);
      invalidatePollQueries(pollId);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to remove vote';
      setVoteError(message);
    } finally {
      setVotingPollId(null);
    }
  };

  const handleDelete = (pollId: string) => {
    if (window.confirm('Are you sure you want to delete this poll? This cannot be undone.')) {
      deletePoll.mutate(pollId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent mx-auto mb-4" />
          <p className="text-zinc-500">Loading polls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href={`/trips/${tripId}`}
            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Polls</h1>
            <p className="text-zinc-500">{trip?.name}</p>
          </div>
        </div>
        <Link href={`/trips/${tripId}/polls/new`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Poll
          </Button>
        </Link>
      </div>

      {/* Vote Error */}
      {voteError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-600">{voteError}</p>
          <button
            onClick={() => setVoteError(null)}
            className="text-red-400 hover:text-red-600 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-zinc-400" />
        <div className="flex gap-2">
          {(['ALL', 'ACTIVE', 'CLOSED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-full transition-colors',
                statusFilter === status
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              )}
            >
              {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Polls List */}
      {polls.length === 0 ? (
        <EmptyState
          icon={Vote}
          title="No polls yet"
          description={
            statusFilter === 'ALL'
              ? "Create a poll to help your group make decisions together"
              : `No ${statusFilter.toLowerCase()} polls found`
          }
          action={
            statusFilter !== 'ALL'
              ? { label: 'View All Polls', onClick: () => setStatusFilter('ALL') }
              : undefined
          }
        >
          {statusFilter === 'ALL' && (
            <Link href={`/trips/${tripId}/polls/new`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Poll
              </Button>
            </Link>
          )}
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll as any}
              onVote={(optionId) => handleVote(poll.id, optionId)}
              onRemoveVote={(optionId) => handleRemoveVote(poll.id, optionId)}
              onClose={() => closePoll.mutate(poll.id)}
              onDelete={() => handleDelete(poll.id)}
              isVoting={votingPollId === poll.id}
              canManage={true} // TODO: Check actual permissions
            />
          ))}
        </div>
      )}
    </div>
  );
}
