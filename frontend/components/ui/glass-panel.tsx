/**
 * GlassPanel Component
 * Glass morphism panel with blur effect for overlay elements
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark';
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ variant = 'light', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'backdrop-blur-[12px]',
          variant === 'light' && 'glass-panel',
          variant === 'dark' && 'glass-dark',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';
