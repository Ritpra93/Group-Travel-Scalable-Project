/**
 * PollWidget Component
 * Interactive poll with voting options and results
 */

'use client';

import { Vote } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

export interface PollOption {
  id: string;
  label: string;
  votes: number;
  voters?: Array<{ name: string; avatar: string }>;
}

export interface PollWidgetProps {
  question: string;
  options: PollOption[];
  timeRemaining?: string;
  onVote?: (optionId: string) => void;
}

export function PollWidget({ question, options, timeRemaining, onVote }: PollWidgetProps) {
  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);
  const maxVotes = Math.max(...options.map((opt) => opt.votes));

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-7 relative overflow-hidden">
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
            Ends in {timeRemaining}
          </span>
        )}
      </div>

      {/* Question */}
      <h4 className="text-base font-semibold text-zinc-900 mb-6 leading-relaxed">{question}</h4>

      {/* Options */}
      <div className="space-y-5 relative z-10">
        {options.map((option) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          const isLeading = option.votes === maxVotes && option.votes > 0;

          return (
            <div
              key={option.id}
              className={cn(
                'space-y-2 group cursor-pointer',
                isLeading ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              )}
              onClick={() => onVote?.(option.id)}
            >
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-zinc-700">{option.label}</span>
                <span className="text-zinc-500">{option.votes} votes</span>
              </div>
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    isLeading
                      ? 'bg-zinc-800 group-hover:bg-zinc-900'
                      : 'bg-zinc-300'
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {option.voters && option.voters.length > 0 && (
                <div className="flex -space-x-1 pt-1">
                  {option.voters.map((voter, idx) => (
                    <img
                      key={idx}
                      className="w-4 h-4 rounded-full border border-white"
                      src={voter.avatar}
                      alt={voter.name}
                      title={voter.name}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cast Vote Button */}
      <Button
        variant="secondary"
        size="sm"
        fullWidth
        className="mt-6 text-xs font-medium"
        onClick={() => onVote?.(options[0]?.id)}
      >
        Cast Vote
      </Button>
    </div>
  );
}
