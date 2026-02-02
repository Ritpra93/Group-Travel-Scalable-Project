/**
 * Trip Card Component
 * Card component for displaying trip information in list views
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Trip } from '@/types';
import { TripStatus } from '@/types';

// ============================================================================
// Trip Card Component
// ============================================================================

export interface TripCardProps {
  trip: Trip;
}

// Status badge colors
const statusColors: Record<TripStatus, string> = {
  [TripStatus.PLANNING]: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  [TripStatus.UPCOMING]: 'bg-orange-100 text-orange-700 border-orange-200',
  [TripStatus.ONGOING]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [TripStatus.COMPLETED]: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  [TripStatus.CANCELLED]: 'bg-rose-100 text-rose-700 border-rose-200',
};

export function TripCard({ trip }: TripCardProps) {
  // Format dates
  const startDate = new Date(trip.startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const endDate = new Date(trip.endDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate trip duration in days
  const duration = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const memberCount = trip._count?.members || 0;

  // Handle budget - backend returns as string (Decimal)
  const budget = trip.totalBudget ? parseFloat(trip.totalBudget) : null;

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card data-testid="content-card" clickable hover className="h-full overflow-hidden group border border-zinc-200/50">
        {/* Hero Image with Overlay Text */}
        <div className="relative h-72 w-full overflow-hidden">
          {trip.imageUrl ? (
            <Image
              src={trip.imageUrl}
              alt={trip.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
              unoptimized={trip.imageUrl.includes('localhost')}
            />
          ) : (
            <div className="absolute inset-0 bg-zinc-100 flex items-center justify-center">
              <MapPin className="h-20 w-20 text-zinc-300" />
            </div>
          )}

          {/* Refined Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />

          {/* Status Badge - Top Right */}
          <div className="absolute top-5 right-5">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-medium uppercase tracking-wide backdrop-blur-md ${
                statusColors[trip.status]
              }`}
            >
              {trip.status}
            </span>
          </div>

          {/* Title and Destination - Bottom Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-7">
            <h3 className="font-serif text-2xl font-semibold text-white mb-2 line-clamp-2 tracking-tight">
              {trip.name}
            </h3>
            <div className="flex items-center gap-2 text-white/80">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-sm font-light line-clamp-1">{trip.destination}</span>
            </div>
          </div>
        </div>

        {/* Details Below Image */}
        <CardContent className="p-7">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-sm text-zinc-600 font-light">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>
                {startDate} – {endDate} · {duration}{' '}
                {duration === 1 ? 'day' : 'days'}
              </span>
            </div>

            <div className="flex items-center gap-6">
              {budget && (
                <div className="flex items-center gap-1.5 text-sm text-zinc-600 font-light">
                  <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
                  <span>${budget.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-zinc-600 font-light">
                <Users className="h-3.5 w-3.5 text-zinc-400" />
                <span>
                  {memberCount} {memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>
            </div>
          </div>

          {trip.group && (
            <div className="mt-5 pt-5 border-t border-zinc-200">
              <p className="text-xs text-zinc-500 font-light">
                {trip.group.name}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
