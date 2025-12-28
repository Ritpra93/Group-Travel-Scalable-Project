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
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'ghost-dark' | 'destructive';
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
    // Variant styles - zinc palette
    const variants: Record<NonNullable<typeof variant>, string> = {
      primary:
        'bg-zinc-900 text-white hover:bg-black focus:ring-zinc-400 shadow-sm rounded-md',
      secondary:
        'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 focus:ring-zinc-300 shadow-sm rounded-md',
      outline:
        'border border-zinc-200 bg-transparent text-zinc-700 hover:bg-zinc-50 focus:ring-zinc-300 rounded-md',
      ghost:
        'bg-transparent text-zinc-600 hover:bg-zinc-100 focus:ring-zinc-300 rounded-md',
      'ghost-dark':
        'bg-transparent text-white hover:bg-white/10 focus:ring-white/20 rounded-md',
      destructive:
        'bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-500/50 shadow-sm rounded-md',
    };

    // Size styles - compact and clean
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-4 py-2 text-sm',
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 font-medium',
          'transition-colors duration-150',
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
