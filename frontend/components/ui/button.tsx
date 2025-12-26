/**
 * Button Component
 * Flexible button with multiple variants, sizes, and states
 */

import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// Types
// ============================================================================

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

// ============================================================================
// Button Component
// ============================================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Variant styles
    const variants = {
      primary:
        'bg-primary text-white hover:bg-primary/90 focus:ring-primary/50',
      secondary:
        'bg-secondary text-white hover:bg-secondary/90 focus:ring-secondary/50',
      outline:
        'border-2 border-stone-300 bg-transparent text-brown hover:bg-stone-50 focus:ring-stone-300',
      ghost:
        'bg-transparent text-brown hover:bg-stone-100 focus:ring-stone-300',
      destructive:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50',
    };

    // Size styles
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Variant & size
          variants[variant],
          sizes[size],
          // Full width
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
