/**
 * ExpenseCategoryIcon Component
 * Maps expense categories to their corresponding icons
 */

import {
  Home,
  Car,
  Utensils,
  Ticket,
  ShoppingBag,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ExpenseCategory } from '@/types/models.types';

// ============================================================================
// Types
// ============================================================================

export interface ExpenseCategoryIconProps {
  category: ExpenseCategory;
  size?: 'sm' | 'md' | 'lg';
  showBackground?: boolean;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  ACCOMMODATION: Home,
  TRANSPORT: Car,
  FOOD: Utensils,
  ACTIVITIES: Ticket,
  SHOPPING: ShoppingBag,
  OTHER: MoreHorizontal,
};

const CATEGORY_COLORS: Record<ExpenseCategory, { bg: string; text: string }> = {
  ACCOMMODATION: { bg: 'bg-blue-50', text: 'text-blue-600' },
  TRANSPORT: { bg: 'bg-amber-50', text: 'text-amber-600' },
  FOOD: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  ACTIVITIES: { bg: 'bg-purple-50', text: 'text-purple-600' },
  SHOPPING: { bg: 'bg-pink-50', text: 'text-pink-600' },
  OTHER: { bg: 'bg-zinc-100', text: 'text-zinc-600' },
};

const SIZE_CLASSES = {
  sm: { wrapper: 'w-8 h-8', icon: 'w-4 h-4' },
  md: { wrapper: 'w-10 h-10', icon: 'w-5 h-5' },
  lg: { wrapper: 'w-12 h-12', icon: 'w-6 h-6' },
};

// ============================================================================
// Component
// ============================================================================

export function ExpenseCategoryIcon({
  category,
  size = 'md',
  showBackground = true,
  className,
}: ExpenseCategoryIconProps) {
  const Icon = CATEGORY_ICONS[category];
  const colors = CATEGORY_COLORS[category];
  const sizeClasses = SIZE_CLASSES[size];

  if (showBackground) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg',
          colors.bg,
          sizeClasses.wrapper,
          className
        )}
      >
        <Icon className={cn(colors.text, sizeClasses.icon)} />
      </div>
    );
  }

  return <Icon className={cn(colors.text, sizeClasses.icon, className)} />;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getCategoryLabel(category: ExpenseCategory): string {
  const labels: Record<ExpenseCategory, string> = {
    ACCOMMODATION: 'Accommodation',
    TRANSPORT: 'Transport',
    FOOD: 'Food & Drinks',
    ACTIVITIES: 'Activities',
    SHOPPING: 'Shopping',
    OTHER: 'Other',
  };
  return labels[category];
}

export function getCategoryColor(category: ExpenseCategory) {
  return CATEGORY_COLORS[category];
}
