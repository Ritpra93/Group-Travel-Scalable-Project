/**
 * ItineraryItemCard Component
 * Display card for a single itinerary item with actions
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Car,
  Compass,
  UtensilsCrossed,
  MoreHorizontal,
  Clock,
  MapPin,
  DollarSign,
  ExternalLink,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ITEM_TYPE_LABELS } from '@/lib/schemas/itinerary.schema';
import type { ItineraryItem, ItineraryItemType } from '@/types/models.types';

// ============================================================================
// Types
// ============================================================================

export interface ItineraryItemCardProps {
  item: ItineraryItem;
  tripId: string;
  onDelete?: (itemId: string) => void;
  isDeleting?: boolean;
  canManage?: boolean;
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

const ITEM_TYPE_ICONS: Record<ItineraryItemType, typeof Building2> = {
  ACCOMMODATION: Building2,
  TRANSPORT: Car,
  ACTIVITY: Compass,
  MEAL: UtensilsCrossed,
  CUSTOM: MoreHorizontal,
};

const ITEM_TYPE_COLORS: Record<ItineraryItemType, string> = {
  ACCOMMODATION: 'bg-blue-100 text-blue-700',
  TRANSPORT: 'bg-amber-100 text-amber-700',
  ACTIVITY: 'bg-emerald-100 text-emerald-700',
  MEAL: 'bg-rose-100 text-rose-700',
  CUSTOM: 'bg-zinc-100 text-zinc-700',
};

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(startTime: string, endTime?: string | null): string | null {
  if (!endTime) return null;

  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours === 0) return `${diffMins}m`;
  if (diffMins === 0) return `${diffHours}h`;
  return `${diffHours}h ${diffMins}m`;
}

function formatCost(cost: string | null): string | null {
  if (!cost) return null;
  const num = parseFloat(cost);
  return `$${num.toFixed(2)}`;
}

// ============================================================================
// Component
// ============================================================================

export function ItineraryItemCard({
  item,
  tripId,
  onDelete,
  isDeleting = false,
  canManage = false,
  className,
}: ItineraryItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const Icon = ITEM_TYPE_ICONS[item.type];
  const colorClass = ITEM_TYPE_COLORS[item.type];
  const duration = formatDuration(item.startTime, item.endTime);
  const cost = formatCost(item.cost);

  const hasDetails = item.description || item.notes || item.url;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-zinc-200 overflow-hidden transition-shadow hover:shadow-sm',
        className
      )}
    >
      {/* Main Content */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
              colorClass
            )}
          >
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-zinc-900 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {ITEM_TYPE_LABELS[item.type]}
                </p>
              </div>

              {/* Actions Menu */}
              {canManage && (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-10 min-w-[120px]">
                      <Link
                        href={`/trips/${tripId}/itinerary/${item.id}/edit`}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2"
                        onClick={() => setShowMenu(false)}
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </Link>
                      {onDelete && (
                        <button
                          onClick={() => {
                            onDelete(item.id);
                            setShowMenu(false);
                          }}
                          disabled={isDeleting}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2 text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Time & Location */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm">
              <div className="flex items-center gap-1.5 text-zinc-600">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span>{formatDateTime(item.startTime)}</span>
                {duration && (
                  <span className="text-zinc-400">({duration})</span>
                )}
              </div>

              {item.location && (
                <div className="flex items-center gap-1.5 text-zinc-600">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  <span className="line-clamp-1">{item.location}</span>
                </div>
              )}

              {cost && (
                <div className="flex items-center gap-1.5 text-zinc-600">
                  <DollarSign className="w-4 h-4 text-zinc-400" />
                  <span>{cost}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expand Toggle */}
        {hasDetails && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-3 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show more
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && hasDetails && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-zinc-100 mt-2">
          {item.description && (
            <div className="pt-3">
              <p className="text-sm text-zinc-600 whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}

          {item.notes && (
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Notes</p>
              <p className="text-sm text-zinc-600 whitespace-pre-wrap">
                {item.notes}
              </p>
            </div>
          )}

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View booking
            </a>
          )}
        </div>
      )}
    </div>
  );
}
