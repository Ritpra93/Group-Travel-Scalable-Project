/**
 * Label Component
 * Accessible label for form inputs
 */

import { type LabelHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// Label Component
// ============================================================================

export const Label = forwardRef<
  HTMLLabelElement,
  LabelHTMLAttributes<HTMLLabelElement>
>(({ className, children, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none text-brown',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
});

Label.displayName = 'Label';
