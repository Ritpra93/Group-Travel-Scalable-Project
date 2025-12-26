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
      <Card clickable hover className="h-full">
        <CardHeader className="p-0">
          {group.imageUrl ? (
            <div className="relative h-40 w-full rounded-t-xl overflow-hidden">
              <Image
                src={group.imageUrl}
                alt={group.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="relative h-40 w-full rounded-t-xl overflow-hidden bg-gradient-to-br from-primary/20 via-sky/20 to-golden/20 flex items-center justify-center">
              <Users className="h-16 w-16 text-primary/40" />
            </div>
          )}
        </CardHeader>
        <CardContent className="p-5">
          <h3 className="text-lg font-semibold text-dark mb-2 line-clamp-1">
            {group.name}
          </h3>

          {group.description && (
            <p className="text-sm text-stone-600 mb-4 line-clamp-2">
              {group.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-stone-500">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {tripCount} {tripCount === 1 ? 'trip' : 'trips'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs text-stone-400">Created {createdDate}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
