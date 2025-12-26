/**
 * Trip Card Component
 * Card component for displaying trip information in list views
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Trip } from '@/types/models.types';
import { TripStatus } from '@/types/models.types';

// ============================================================================
// Trip Card Component
// ============================================================================

export interface TripCardProps {
  trip: Trip;
}

// Status badge colors
const statusColors: Record<TripStatus, string> = {
  [TripStatus.PLANNING]: 'bg-sky/10 text-sky border-sky/20',
  [TripStatus.UPCOMING]: 'bg-golden/10 text-golden border-golden/20',
  [TripStatus.ONGOING]: 'bg-primary/10 text-primary border-primary/20',
  [TripStatus.COMPLETED]: 'bg-stone-500/10 text-stone-700 border-stone-200',
  [TripStatus.CANCELLED]: 'bg-red-500/10 text-red-700 border-red-200',
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

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card clickable hover className="h-full">
        <CardHeader className="p-0">
          {trip.imageUrl ? (
            <div className="relative h-48 w-full rounded-t-xl overflow-hidden">
              <Image
                src={trip.imageUrl}
                alt={trip.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {/* Status Badge Overlay */}
              <div className="absolute top-3 right-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${
                    statusColors[trip.status]
                  }`}
                >
                  {trip.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="relative h-48 w-full rounded-t-xl overflow-hidden bg-gradient-to-br from-primary/20 via-sky/20 to-golden/20 flex items-center justify-center">
              <MapPin className="h-20 w-20 text-primary/40" />
              <div className="absolute top-3 right-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    statusColors[trip.status]
                  }`}
                >
                  {trip.status}
                </span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-5">
          <h3 className="text-lg font-semibold text-dark mb-1 line-clamp-1">
            {trip.name}
          </h3>

          <div className="flex items-center gap-1 text-sm text-stone-600 mb-3">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{trip.destination}</span>
          </div>

          {trip.description && (
            <p className="text-sm text-stone-600 mb-4 line-clamp-2">
              {trip.description}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Calendar className="h-4 w-4" />
              <span>
                {startDate} - {endDate} ({duration}{' '}
                {duration === 1 ? 'day' : 'days'})
              </span>
            </div>

            <div className="flex items-center gap-4">
              {trip.budget && (
                <div className="flex items-center gap-1 text-sm text-stone-600">
                  <DollarSign className="h-4 w-4" />
                  <span>${trip.budget.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-stone-600">
                <Users className="h-4 w-4" />
                <span>
                  {memberCount} {memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>
            </div>
          </div>

          {trip.group && (
            <div className="mt-4 pt-4 border-t border-stone-100">
              <p className="text-xs text-stone-400">
                Group: {trip.group.name}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
