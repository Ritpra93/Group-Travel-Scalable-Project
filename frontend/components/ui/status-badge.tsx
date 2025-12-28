/**
 * StatusBadge Component
 * Colored badges for different status indicators
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface StatusBadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant: 'active' | 'online' | 'issue' | 'new';
  pulse?: boolean;
  children: ReactNode;
}

export const StatusBadge = forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ variant, pulse = false, className, children, ...props }, ref) => {
    const variants = {
      active: 'bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-white border border-white/10',
      online: 'bg-emerald-500/10 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200',
      issue: 'bg-rose-500 text-white px-3 py-1.5 rounded-full shadow-lg shadow-rose-900/20',
      new: 'bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 font-medium text-xs',
          variants[variant],
          className
        )}
        {...props}
      >
        {pulse && (
          <span className={cn(
            'w-1.5 h-1.5 rounded-full animate-pulse',
            variant === 'online' && 'bg-emerald-400',
            variant === 'active' && 'bg-white',
            variant === 'issue' && 'bg-white',
          )} />
        )}
        {children}
      </div>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';
