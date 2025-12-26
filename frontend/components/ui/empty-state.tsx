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
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-stone-100 p-4">
          <Icon className="h-10 w-10 text-stone-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-dark mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-stone-600 max-w-md mb-6">{description}</p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
