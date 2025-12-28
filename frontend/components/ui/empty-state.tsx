/**
 * Empty State Component
 * Display when no data/content is available
 */

import { type ReactNode } from 'react';
import { Button } from './button';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// Empty State Component
// ============================================================================

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      {Icon && (
        <div className="mb-6">
          <Icon className="h-16 w-16 text-slate-300" />
        </div>
      )}
      <h3 className="font-serif text-3xl font-bold text-slate-900 mb-3">{title}</h3>
      {description && (
        <p className="text-lg text-slate-600 max-w-lg mb-8">{description}</p>
      )}
      {action && (
        <Button variant="primary" size="lg" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
