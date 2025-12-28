/**
 * Group Card Component
 * Card component for displaying group information in list views
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Group } from '@/types/models.types';

// ============================================================================
// Group Card Component
// ============================================================================

export interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const memberCount = group._count?.members || 0;
  const tripCount = group._count?.trips || 0;

  // Format creation date
  const createdDate = new Date(group.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link href={`/groups/${group.id}`}>
      <Card clickable hover className="h-full overflow-hidden group border border-stone-200/50">
        {/* Hero Image with Overlay Text */}
        <div className="relative h-56 w-full overflow-hidden">
          {group.imageUrl ? (
            <Image
              src={group.imageUrl}
              alt={group.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 bg-stone-100 flex items-center justify-center">
              <Users className="h-16 w-16 text-stone-300" />
            </div>
          )}

          {/* Refined Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />

          {/* Group Name - Bottom Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-7">
            <h3 className="font-serif text-2xl font-semibold text-white line-clamp-2 tracking-tight">
              {group.name}
            </h3>
          </div>
        </div>

        {/* Details Below Image */}
        <CardContent className="p-7">
          {group.description && (
            <p className="text-sm text-stone-600 mb-5 line-clamp-2 font-light leading-relaxed">
              {group.description}
            </p>
          )}

          <div className="flex items-center gap-6 text-sm text-stone-600 font-light">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-stone-400" />
              <span>
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-stone-400" />
              <span>
                {tripCount} {tripCount === 1 ? 'trip' : 'trips'}
              </span>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-stone-200">
            <p className="text-xs text-stone-500 font-light">Created {createdDate}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
