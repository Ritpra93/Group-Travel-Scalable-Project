/**
 * PackingListWidget Component
 * Checklist widget for packing items
 */

'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface PackingItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface PackingListWidgetProps {
  items: PackingItem[];
  onToggle?: (id: string) => void;
}

export function PackingListWidget({ items, onToggle }: PackingListWidgetProps) {
  const checkedCount = items.filter((item) => item.checked).length;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-medium text-zinc-900">Essentials</h3>
        <span className="text-sm text-zinc-400">
          {checkedCount}/{items.length} packed
        </span>
      </div>

      {/* Items */}
      <div className="space-y-5">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-4 group cursor-pointer"
            onClick={() => onToggle?.(item.id)}
          >
            <div
              className={cn(
                'w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0',
                item.checked
                  ? 'bg-zinc-900 border-zinc-900'
                  : 'border-zinc-300 group-hover:border-zinc-500'
              )}
            >
              {item.checked && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <span
              className={cn(
                'text-base transition-colors leading-relaxed',
                item.checked
                  ? 'text-zinc-400 line-through'
                  : 'text-zinc-600 group-hover:text-zinc-900'
              )}
            >
              {item.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
