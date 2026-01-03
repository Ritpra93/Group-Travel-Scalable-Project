/**
 * QuickActionCard Component
 * Horizontal card with icon, title, description, and optional badge
 */

import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string; // e.g., "1 NEW"
  variant?: 'default' | 'highlight';
  onClick?: () => void;
}

export function QuickActionCard({
  icon: Icon,
  title,
  description,
  badge,
  variant = 'default',
  onClick,
}: QuickActionCardProps) {
  return (
    <button
      data-testid="action-card"
      onClick={onClick}
      className={cn(
        'bg-white p-5 rounded-xl border shadow-sm flex items-center gap-4 hover:shadow-md transition-all group text-left w-full relative overflow-hidden',
        variant === 'default' && 'border-zinc-200 hover:border-zinc-300',
        variant === 'highlight' && 'border-zinc-200 hover:border-orange-300'
      )}
    >
      {/* Highlight background accent */}
      {variant === 'highlight' && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-100 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50" />
      )}

      {/* Icon */}
      <div
        className={cn(
          'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors relative z-10',
          variant === 'default' && 'bg-zinc-100 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white',
          variant === 'highlight' && 'bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white'
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="block text-base font-semibold text-zinc-900">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
              {badge}
            </span>
          )}
        </div>
        <span className="text-sm text-zinc-500 leading-relaxed">{description}</span>
      </div>
    </button>
  );
}
