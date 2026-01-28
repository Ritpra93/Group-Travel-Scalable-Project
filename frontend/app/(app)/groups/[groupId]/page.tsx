/**
 * Group Detail Page
 * View and manage a specific group
 */

'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Users,
  Calendar,
  Settings,
  UserPlus,
  LogOut,
  Trash2,
} from 'lucide-react';
import { useGroup, useGroupMembers, useDeleteGroup, useLeaveGroup } from '@/lib/api/hooks/use-groups';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { GroupRole } from '@/types';

// ============================================================================
// Group Detail Page Component
// ============================================================================

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch group and members
  const { data: group, isLoading, error } = useGroup(groupId);
  const { data: members, isLoading: membersLoading } = useGroupMembers(
    groupId
  );

  // Mutations
  const { mutate: deleteGroup, isPending: isDeleting } = useDeleteGroup();
  const { mutate: leaveGroup, isPending: isLeaving } = useLeaveGroup();

  // Check user's role in this group
  const currentMember = members?.find((m) => m.userId === user?.id);
  const isOwner = currentMember?.role === GroupRole.OWNER;
  const isAdmin = currentMember?.role === GroupRole.ADMIN || isOwner;

  // Handle delete
  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteGroup(groupId);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  // Handle leave
  const handleLeave = () => {
    leaveGroup(groupId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-32 bg-stone-100 rounded animate-pulse" />
        <div className="h-80 bg-stone-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-stone-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Error state
  if (error || !group) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <EmptyState
          title="Group not found"
          description="This group doesn't exist or you don't have access to it."
          action={{
            label: 'Back to Groups',
            onClick: () => router.push('/groups'),
          }}
        />
      </div>
    );
  }

  const memberCount = members?.length || 0;
  const tripCount = group._count?.trips || 0;

  return (
    <div>
      {/* Hero Cover Image */}
      <div className="relative h-[50vh] w-full overflow-hidden -ml-[70px] lg:-ml-64">
        {group.imageUrl ? (
          <Image
            src={group.imageUrl}
            alt={group.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            quality={90}
          />
        ) : (
          <div className="absolute inset-0 bg-stone-100 flex items-center justify-center">
            <Users className="h-32 w-32 text-stone-300" />
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

        {/* Back button - top left */}
        <div className="absolute top-8 left-8">
          <Button
            variant="secondary"
            onClick={() => router.back()}
            className="gap-2 backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Settings button - top right */}
        {isAdmin && (
          <div className="absolute top-8 right-8">
            <Button
              variant="secondary"
              onClick={() => router.push(`/groups/${group.id}/settings`)}
              className="gap-2 backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        )}

        {/* Group name overlay - bottom */}
        <div className="absolute bottom-0 left-0 right-0 pb-10 pt-28">
          <div className="max-w-7xl mx-auto w-full pl-[78px] pr-8 lg:pl-[268px] lg:pr-12">
            <h1 className="font-serif text-6xl font-semibold text-white mb-4 tracking-tight">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-xl text-white/80 mb-6 max-w-3xl font-light leading-relaxed">
                {group.description}
              </p>
            )}

            {/* Stats inline */}
            <div className="flex items-center gap-8 text-white/90">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-lg font-light">
                  {memberCount} {memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="text-lg font-light">
                  {tripCount} {tripCount === 1 ? 'trip' : 'trips'}
                </span>
              </div>
              {currentMember && (
                <div className="px-4 py-1.5 rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-white text-sm font-medium uppercase tracking-wide">
                  {currentMember.role}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-16 space-y-16">
        {/* Members Section */}
        <div>
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-stone-900 mb-2 tracking-tight">
                Travel Crew
              </h2>
              <p className="text-base text-stone-600 font-light">
                {memberCount} {memberCount === 1 ? 'person' : 'people'} in this group
              </p>
            </div>
            {isAdmin && (
              <Button variant="primary" size="lg" className="gap-2">
                <UserPlus className="h-5 w-5" />
                Add Member
              </Button>
            )}
          </div>

          {membersLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-stone-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : members && members.length > 0 ? (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-6 rounded-2xl border border-stone-200/50 bg-white shadow-soft hover:shadow-hover transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold text-lg">
                        {member.user?.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900 text-base">{member.user?.name || 'Unknown'}</p>
                      <p className="text-sm text-stone-500 font-light">
                        {member.user?.email || 'No email'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-stone-100 text-stone-700 text-xs font-medium uppercase tracking-wide">
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No members yet"
              description="Add members to start collaborating on trips."
            />
          )}
        </div>

        {/* Danger Zone */}
        <div className="pt-8 border-t border-stone-200">
          <h2 className="font-serif text-2xl font-semibold text-red-600 mb-6 tracking-tight">
            Danger Zone
          </h2>
          <div className="space-y-4">
            {!isOwner && (
              <div className="flex items-center justify-between p-6 rounded-2xl border border-stone-200/50 bg-white">
                <div>
                  <p className="font-semibold text-stone-900 mb-1">Leave Group</p>
                  <p className="text-sm text-stone-600 font-light">
                    Remove yourself from this group
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleLeave}
                  loading={isLeaving}
                  className="gap-2"
                >
                  <LogOut className="h-5 w-5" />
                  Leave
                </Button>
              </div>
            )}
            {isOwner && (
              <div className="flex items-center justify-between p-6 rounded-2xl border border-red-200 bg-red-50">
                <div>
                  <p className="font-semibold text-red-900 mb-1">Delete Group</p>
                  <p className="text-sm text-red-700 font-light">
                    {showDeleteConfirm
                      ? 'Click again to confirm deletion'
                      : 'Permanently delete this group and all its data'}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleDelete}
                  loading={isDeleting}
                  className="gap-2"
                >
                  <Trash2 className="h-5 w-5" />
                  {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
