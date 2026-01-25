/**
 * PollCard Component
 * Interactive poll display with voting functionality
 */

'use client';

import { useState } from 'react';
import {
  Vote,
  Clock,
  Check,
  Lock,
  Trash2,
  MoreHorizontal,
  MapPin,
  Calendar,
  Compass,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { POLL_TYPE_LABELS } from '@/lib/schemas/polls.schema';
import type { Poll, PollOption, PollType, PollStatus } from '@/types/models.types';

// ============================================================================
// Types
// ============================================================================

export interface PollOptionWithVotes extends PollOption {
  voteCount: number;
  hasVoted?: boolean;
}

export interface PollCardProps {
  poll: Poll & {
    options: PollOptionWithVotes[];
    totalVotes: number;
    userVotes?: string[];
  };
  onVote: (optionId: string) => void;
  onRemoveVote?: (optionId: string) => void;
  onClose?: () => void;
  onDelete?: () => void;
  isVoting?: boolean;
  canManage?: boolean;
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

const POLL_TYPE_ICONS: Record<PollType, typeof Vote> = {
  PLACE: MapPin,
  ACTIVITY: Compass,
  DATE: Calendar,
  CUSTOM: HelpCircle,
};

function formatTimeRemaining(closesAt: string | null): string | null {
  if (!closesAt) return null;

  const closeDate = new Date(closesAt);
  const now = new Date();
  const diff = closeDate.getTime() - now.getTime();

  if (diff <= 0) return 'Closed';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d left`;
  if (hours > 0) return `${hours}h left`;

  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes}m left`;
}

function getStatusBadge(status: PollStatus): { label: string; className: string } {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Active', className: 'bg-emerald-100 text-emerald-700' };
    case 'CLOSED':
      return { label: 'Closed', className: 'bg-zinc-100 text-zinc-600' };
    case 'ARCHIVED':
      return { label: 'Archived', className: 'bg-zinc-100 text-zinc-400' };
  }
}

// ============================================================================
// Component
// ============================================================================

export function PollCard({
  poll,
  onVote,
  onRemoveVote,
  onClose,
  onDelete,
  isVoting = false,
  canManage = false,
  className,
}: PollCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const isActive = poll.status === 'ACTIVE';
  const userVotes = poll.userVotes || [];
  const canVote = isActive && (!poll.allowMultiple ? userVotes.length === 0 : true);
  const maxVotesReached = poll.maxVotes && userVotes.length >= poll.maxVotes;

  const timeRemaining = formatTimeRemaining(poll.closesAt);
  const statusBadge = getStatusBadge(poll.status);
  const Icon = POLL_TYPE_ICONS[poll.type];

  const handleOptionClick = (optionId: string) => {
    if (!isActive || isVoting) return;

    const hasVotedForThis = userVotes.includes(optionId);

    if (hasVotedForThis && onRemoveVote) {
      onRemoveVote(optionId);
    } else if (!hasVotedForThis && canVote && !maxVotesReached) {
      onVote(optionId);
    }
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-zinc-400" />
            <span className="text-xs text-zinc-500">{POLL_TYPE_LABELS[poll.type]}</span>
          </div>
          <div className="flex items-center gap-2">
            {timeRemaining && isActive && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="w-3.5 h-3.5" />
                {timeRemaining}
              </span>
            )}
            <span
              className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-full',
                statusBadge.className
              )}
            >
              {statusBadge.label}
            </span>
            {canManage && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded hover:bg-zinc-100 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-10 min-w-[140px]">
                    {isActive && onClose && (
                      <button
                        onClick={() => {
                          onClose();
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        Close Poll
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          onDelete();
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <CardTitle className="text-lg mt-2">{poll.title}</CardTitle>
        {poll.description && (
          <p className="text-sm text-zinc-500 mt-1">{poll.description}</p>
        )}
      </CardHeader>

      {/* Options */}
      <CardContent className="space-y-3">
        {poll.options.map((option) => {
          const hasVotedForThis = userVotes.includes(option.id);
          const percentage =
            poll.totalVotes > 0
              ? Math.round((option.voteCount / poll.totalVotes) * 100)
              : 0;
          const isLeading =
            option.voteCount === Math.max(...poll.options.map((o) => o.voteCount)) &&
            option.voteCount > 0;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleOptionClick(option.id)}
              disabled={!isActive || isVoting || (!canVote && !hasVotedForThis)}
              className={cn(
                'w-full p-3 rounded-lg border-2 text-left transition-all relative overflow-hidden',
                hasVotedForThis
                  ? 'border-zinc-900 bg-zinc-50'
                  : isActive && canVote && !maxVotesReached
                    ? 'border-zinc-200 hover:border-zinc-300 cursor-pointer'
                    : 'border-zinc-200 cursor-default'
              )}
            >
              {/* Progress bar background */}
              <div
                className={cn(
                  'absolute inset-y-0 left-0 transition-all',
                  hasVotedForThis
                    ? 'bg-zinc-200'
                    : isLeading
                      ? 'bg-zinc-100'
                      : 'bg-zinc-50'
                )}
                style={{ width: `${percentage}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {hasVotedForThis && (
                    <Check className="w-4 h-4 text-zinc-900 flex-shrink-0" />
                  )}
                  <div>
                    <p
                      className={cn(
                        'font-medium text-sm',
                        hasVotedForThis ? 'text-zinc-900' : 'text-zinc-700'
                      )}
                    >
                      {option.label}
                    </p>
                    {option.description && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <span>{option.voteCount} votes</span>
                  <span className="text-zinc-300">•</span>
                  <span className="font-medium">{percentage}%</span>
                </div>
              </div>
            </button>
          );
        })}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <span className="text-sm text-zinc-500">
            {poll.totalVotes} total vote{poll.totalVotes !== 1 ? 's' : ''}
          </span>
          {poll.allowMultiple && (
            <span className="text-xs text-zinc-400">
              Multiple choices allowed
              {poll.maxVotes && ` (max ${poll.maxVotes})`}
            </span>
          )}
        </div>

        {/* Voting hint */}
        {isActive && !isVoting && (
          <p className="text-xs text-zinc-400 text-center pt-2">
            {userVotes.length > 0
              ? 'Click your choice to remove vote'
              : poll.allowMultiple
                ? 'Click to vote (you can select multiple)'
                : 'Click an option to vote'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
