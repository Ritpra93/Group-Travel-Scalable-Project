/**
 * DashboardPollWidget Component
 * Fetches and displays the most recent active poll for a trip
 */

'use client';

import { Vote, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { usePolls } from '@/lib/api/hooks/use-polls';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Poll } from '@/types/models.types';

export interface DashboardPollWidgetProps {
  tripId: string;
  className?: string;
}

export function DashboardPollWidget({ tripId, className }: DashboardPollWidgetProps) {
  const user = useAuthStore((state) => state.user);
  const { data: pollsData, isLoading } = usePolls(tripId, { status: 'ACTIVE', limit: 1 });

  const activePoll = pollsData?.data?.[0] as Poll | undefined;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('bg-white rounded-xl border border-zinc-200 shadow-sm p-7', className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-100 rounded w-24 mb-6" />
          <div className="h-5 bg-zinc-100 rounded w-48 mb-6" />
          <div className="space-y-4">
            <div className="h-10 bg-zinc-100 rounded" />
            <div className="h-10 bg-zinc-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // No active polls
  if (!activePoll) {
    return (
      <div className={cn('bg-white rounded-xl border border-zinc-200 shadow-sm p-7 relative overflow-hidden', className)}>
        <div className="absolute top-0 right-0 p-3 opacity-5">
          <Vote className="w-20 h-20 rotate-12" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Vote className="w-4 h-4 text-zinc-400" />
            <h3 className="text-base font-medium text-zinc-900">Polls</h3>
          </div>
          <p className="text-sm text-zinc-500 mb-4">No active polls for this trip.</p>
          <Link
            href={`/trips/${tripId}/polls/new`}
            className="text-sm text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
          >
            Create a poll
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  // Calculate vote totals per option
  const optionVotes = activePoll.options.map((opt) => ({
    ...opt,
    voteCount: opt.votes?.length || 0,
    hasUserVoted: opt.votes?.some((v) => v.userId === user?.id) || false,
  }));

  const totalVotes = optionVotes.reduce((sum, opt) => sum + opt.voteCount, 0);
  const maxVotes = Math.max(...optionVotes.map((opt) => opt.voteCount), 0);

  // Time remaining calculation
  const getTimeRemaining = () => {
    if (!activePoll.closesAt) return null;
    const now = new Date();
    const closes = new Date(activePoll.closesAt);
    const diffMs = closes.getTime() - now.getTime();
    if (diffMs <= 0) return 'Ended';
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins}m`;
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div className={cn('bg-white rounded-xl border border-zinc-200 shadow-sm p-7 relative overflow-hidden', className)}>
      {/* Background icon */}
      <div className="absolute top-0 right-0 p-3 opacity-5">
        <Vote className="w-20 h-20 rotate-12" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <h3 className="text-base font-medium text-zinc-900">Active Poll</h3>
        </div>
        {timeRemaining && (
          <span className="text-xs bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded">
            {timeRemaining === 'Ended' ? 'Ended' : `Ends in ${timeRemaining}`}
          </span>
        )}
      </div>

      {/* Question */}
      <h4 className="text-base font-semibold text-zinc-900 mb-6 leading-relaxed">
        {activePoll.title}
      </h4>

      {/* Options (display only) */}
      <div className="space-y-4 relative z-10">
        {optionVotes.slice(0, 4).map((option) => {
          const percentage = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
          const isLeading = option.voteCount === maxVotes && option.voteCount > 0;

          return (
            <div
              key={option.id}
              className={cn(
                'space-y-2',
                isLeading ? 'opacity-100' : 'opacity-70'
              )}
            >
              <div className="flex justify-between text-sm mb-1">
                <span className={cn(
                  'font-medium',
                  option.hasUserVoted ? 'text-zinc-900' : 'text-zinc-700'
                )}>
                  {option.label}
                  {option.hasUserVoted && (
                    <span className="ml-2 text-xs text-emerald-600">(Your vote)</span>
                  )}
                </span>
                <span className="text-zinc-500">{option.voteCount}</span>
              </div>
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    option.hasUserVoted
                      ? 'bg-emerald-500'
                      : isLeading
                        ? 'bg-zinc-800'
                        : 'bg-zinc-300'
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Vote / View link */}
      <Link
        href={`/trips/${tripId}/polls`}
        className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 relative z-10"
      >
        Vote now
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

/**
 * Placeholder widget when no trip is selected
 */
export function DashboardPollWidgetPlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl border border-zinc-200 shadow-sm p-7 relative overflow-hidden', className)}>
      <div className="absolute top-0 right-0 p-3 opacity-5">
        <Vote className="w-20 h-20 rotate-12" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Vote className="w-4 h-4 text-zinc-400" />
          <h3 className="text-base font-medium text-zinc-900">Polls</h3>
        </div>
        <p className="text-sm text-zinc-500">
          Create a trip to start polling your group.
        </p>
      </div>
    </div>
  );
}
