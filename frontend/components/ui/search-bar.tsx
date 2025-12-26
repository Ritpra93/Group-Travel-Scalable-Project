/**
 * Search Bar Component
 * Input field for search/filter functionality
 */

'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// Search Bar Component
// ============================================================================

export interface SearchBarProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
  containerClassName?: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, containerClassName, onClear, value, ...props }, ref) => {
    const hasValue = value && String(value).length > 0;

    return (
      <div className={cn('relative', containerClassName)}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          ref={ref}
          type="text"
          value={value}
          className={cn(
            'h-10 w-full rounded-lg border border-stone-300 bg-white pl-10 pr-10 text-sm',
            'placeholder:text-stone-400',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            'transition-colors',
            className
          )}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
