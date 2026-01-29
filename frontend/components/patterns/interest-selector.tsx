/**
 * Interest Selector Component
 * Multi-select component for choosing interests from predefined categories
 */

'use client';

import { useState, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// Types
// ============================================================================

interface InterestSelectorProps {
  availableInterests: string[];
  selectedInterests: string[];
  onChange: (interests: string[]) => void;
  maxInterests?: number;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function InterestSelector({
  availableInterests,
  selectedInterests,
  onChange,
  maxInterests = 20,
  disabled = false,
  className,
}: InterestSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter interests based on search
  const filteredInterests = useMemo(() => {
    if (!searchTerm.trim()) return availableInterests;
    const term = searchTerm.toLowerCase();
    return availableInterests.filter((interest) =>
      interest.toLowerCase().includes(term)
    );
  }, [availableInterests, searchTerm]);

  // Group selected at top
  const sortedInterests = useMemo(() => {
    const selected = filteredInterests.filter((i) =>
      selectedInterests.includes(i)
    );
    const unselected = filteredInterests.filter(
      (i) => !selectedInterests.includes(i)
    );
    return [...selected, ...unselected];
  }, [filteredInterests, selectedInterests]);

  const toggleInterest = (interest: string) => {
    if (disabled) return;

    if (selectedInterests.includes(interest)) {
      onChange(selectedInterests.filter((i) => i !== interest));
    } else if (selectedInterests.length < maxInterests) {
      onChange([...selectedInterests, interest]);
    }
  };

  const removeInterest = (interest: string) => {
    if (disabled) return;
    onChange(selectedInterests.filter((i) => i !== interest));
  };

  const canAddMore = selectedInterests.length < maxInterests;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Selected interests display */}
      {selectedInterests.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700">
              Selected ({selectedInterests.length}/{maxInterests})
            </span>
            {selectedInterests.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-zinc-500 hover:text-zinc-700"
                disabled={disabled}
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map((interest) => (
              <span
                key={interest}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm',
                  'bg-zinc-900 text-white',
                  disabled && 'opacity-50'
                )}
              >
                {interest}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeInterest(interest)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search interests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
          className={cn(
            'w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200',
            'text-sm placeholder:text-zinc-400',
            'focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400',
            'disabled:bg-zinc-50 disabled:cursor-not-allowed'
          )}
        />
      </div>

      {/* Available interests grid */}
      <div className="max-h-64 overflow-y-auto border border-zinc-200 rounded-lg p-2">
        {sortedInterests.length === 0 ? (
          <p className="text-center py-4 text-sm text-zinc-500">
            No interests found matching &quot;{searchTerm}&quot;
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {sortedInterests.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              const isDisabled = disabled || (!isSelected && !canAddMore);

              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  disabled={isDisabled}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                    isSelected
                      ? 'bg-zinc-100 text-zinc-900 font-medium'
                      : 'hover:bg-zinc-50 text-zinc-600',
                    isDisabled && !isSelected && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span
                    className={cn(
                      'flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center',
                      isSelected
                        ? 'bg-zinc-900 border-zinc-900 text-white'
                        : 'border-zinc-300'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </span>
                  <span className="truncate">{interest}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Limit warning */}
      {!canAddMore && (
        <p className="text-xs text-amber-600">
          Maximum {maxInterests} interests allowed. Remove some to add more.
        </p>
      )}
    </div>
  );
}
