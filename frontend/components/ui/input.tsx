/**
 * Input Component
 * Flexible input with error states and support for various types
 */

import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// Types
// ============================================================================

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

// ============================================================================
// Input Component
// ============================================================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-brown"
          >
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            // Base styles
            'w-full rounded-lg border px-4 py-2.5 text-base',
            'transition-all duration-200',
            'placeholder:text-stone-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            // Normal state
            !error && 'border-stone-300 focus:border-primary focus:ring-primary/20',
            // Error state
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            // Disabled state
            'disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500',
            className
          )}
          {...props}
        />

        {/* Helper text or error message */}
        {(helperText || error) && (
          <p
            className={cn(
              'mt-1.5 text-sm',
              error ? 'text-red-600' : 'text-stone-600'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
