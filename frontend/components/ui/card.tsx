/**
 * Card Component
 * Flexible card container with header, content, and footer sections
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// Card Root
// ============================================================================

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  clickable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, clickable = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border border-zinc-200 bg-white shadow-sm',
          hover && 'transition-shadow duration-200 hover:shadow-hover',
          clickable && 'cursor-pointer transition-all duration-200 hover:shadow-hover',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

// ============================================================================
// Card Header
// ============================================================================

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-6', className)}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

// ============================================================================
// Card Title
// ============================================================================

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          'text-base font-medium leading-none tracking-tight text-zinc-900',
          className
        )}
        {...props}
      />
    );
  }
);

CardTitle.displayName = 'CardTitle';

// ============================================================================
// Card Description
// ============================================================================

export interface CardDescriptionProps
  extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-zinc-500', className)}
      {...props}
    />
  );
});

CardDescription.displayName = 'CardDescription';

// ============================================================================
// Card Content
// ============================================================================

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
    );
  }
);

CardContent.displayName = 'CardContent';

// ============================================================================
// Card Footer
// ============================================================================

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center p-6 pt-0', className)}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';
