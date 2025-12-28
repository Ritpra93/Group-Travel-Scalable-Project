/**
 * StatCard Component
 * Compact stat display card with icon, label, value, and optional progress bar
 */

import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface StatCardProps {
  label: string;
  value: string | ReactNode;
  subValue?: string;
  icon?: LucideIcon;
  progress?: number; // 0-100
  variant?: 'default' | 'dark' | 'action';
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  progress,
  variant = 'default',
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-5 rounded-lg border flex flex-col justify-between h-32 transition-colors',
        variant === 'default' && 'bg-white border-zinc-200 shadow-sm hover:border-zinc-300',
        variant === 'dark' && 'bg-zinc-900 border-zinc-900 shadow-sm text-white hover:bg-black',
        variant === 'action' && 'bg-zinc-900 border-zinc-900 shadow-sm hover:bg-black',
        onClick && 'cursor-pointer'
      )}
    >
      {/* Header with label and icon */}
      <div className="flex justify-between items-start">
        <span
          className={cn(
            'text-xs font-medium uppercase tracking-wider',
            variant === 'default' && 'text-zinc-500',
            (variant === 'dark' || variant === 'action') && 'text-zinc-400'
          )}
        >
          {label}
        </span>
        {Icon && (
          <Icon
            className={cn(
              'w-4 h-4',
              variant === 'default' && 'text-zinc-300',
              (variant === 'dark' || variant === 'action') && 'text-zinc-600'
            )}
          />
        )}
      </div>

      {/* Value */}
      <div>
        {variant === 'action' ? (
          <div className="flex flex-col items-center justify-center group">
            {Icon && <Icon className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform text-white" />}
            <span className="text-sm font-medium text-white">{value}</span>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span
                className={cn(
                  'text-2xl font-light tracking-tight',
                  variant === 'default' && 'text-zinc-900',
                  variant === 'dark' && 'text-white'
                )}
              >
                {value}
              </span>
              {subValue && (
                <span
                  className={cn(
                    'text-xs',
                    variant === 'default' && 'text-zinc-400',
                    variant === 'dark' && 'text-zinc-500'
                  )}
                >
                  {subValue}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {progress !== undefined && (
              <div className="w-full bg-zinc-100 h-1 mt-3 rounded-full overflow-hidden">
                <div
                  className="bg-zinc-800 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
