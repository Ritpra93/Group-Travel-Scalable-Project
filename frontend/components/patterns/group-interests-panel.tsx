/**
 * Group Interests Panel
 * Displays interest overlap analysis for group members
 */

'use client';

import { useState } from 'react';
import { Sparkles, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useGroupInterestAnalysis } from '@/lib/api/hooks/use-users';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// Types
// ============================================================================

interface GroupInterestsPanelProps {
  groupId: string;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function GroupInterestsPanel({ groupId, className }: GroupInterestsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: analysis, isLoading, error } = useGroupInterestAnalysis(groupId);

  if (isLoading) {
    return (
      <div className={cn('p-6 rounded-2xl border border-stone-200/50 bg-white', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-stone-100 rounded" />
          <div className="h-20 bg-stone-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return null; // Silently fail - interests are optional
  }

  // Check if any members have interests
  const hasInterestData = analysis.topInterests.length > 0;

  if (!hasInterestData) {
    return (
      <div className={cn('p-6 rounded-2xl border border-stone-200/50 bg-white', className)}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-50">
            <Sparkles className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-1">Discover Common Interests</h3>
            <p className="text-sm text-stone-600 font-light">
              Add interests to your profile to find activities everyone will enjoy.
              <a href="/profile" className="text-primary ml-1 hover:underline">
                Update your profile
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const topInterests = analysis.topInterests.slice(0, 5);
  const membersWithOverlap = analysis.members.filter((m) => m.overlapScore > 0);

  return (
    <div className={cn('rounded-2xl border border-stone-200/50 bg-white overflow-hidden', className)}>
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-start justify-between text-left hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-50">
            <Sparkles className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-1">Group Interests</h3>
            <p className="text-sm text-stone-600 font-light">
              {topInterests.length} shared {topInterests.length === 1 ? 'interest' : 'interests'} among members
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-stone-400">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-stone-100">
          {/* Top Shared Interests */}
          <div className="pt-4">
            <h4 className="text-sm font-medium text-stone-700 mb-3">Most Popular Interests</h4>
            <div className="flex flex-wrap gap-2">
              {topInterests.map(({ interest, count }) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm"
                >
                  {interest}
                  <span className="text-emerald-500 text-xs">({count})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Member Overlap */}
          {membersWithOverlap.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-stone-700 mb-3">Interest Compatibility</h4>
              <div className="space-y-3">
                {membersWithOverlap
                  .sort((a, b) => b.overlapScore - a.overlapScore)
                  .slice(0, 5)
                  .map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-3 rounded-xl bg-stone-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {member.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-stone-900 text-sm">{member.userName}</p>
                          <p className="text-xs text-stone-500">
                            {member.commonInterests.length} shared{' '}
                            {member.commonInterests.length === 1 ? 'interest' : 'interests'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${member.overlapScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-stone-600 w-10 text-right">
                          {Math.round(member.overlapScore)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Average overlap stat */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <Users className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-stone-900">
                Average interest overlap: {Math.round(analysis.averageOverlap)}%
              </p>
              <p className="text-xs text-stone-600">
                Based on {analysis.totalMembers} group members
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
