/**
 * Group Detail Page
 * View and manage a specific group
 */

'use client';

import { useState } from 'react';
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
import { GroupRole } from '@/types/models.types';

// ============================================================================
// Group Detail Page Component
// ============================================================================

export default function GroupDetailPage({
  params,
}: {
  params: { groupId: string };
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch group and members
  const { data: group, isLoading, error } = useGroup(params.groupId);
  const { data: members, isLoading: membersLoading } = useGroupMembers(
    params.groupId
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
      deleteGroup(params.groupId);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  // Handle leave
  const handleLeave = () => {
    leaveGroup(params.groupId);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Group Header Card */}
      <Card>
        <CardContent className="p-0">
          {/* Cover Image */}
          {group.imageUrl ? (
            <div className="relative h-64 w-full rounded-t-xl overflow-hidden">
              <Image
                src={group.imageUrl}
                alt={group.name}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </div>
          ) : (
            <div className="relative h-64 w-full rounded-t-xl overflow-hidden bg-gradient-to-br from-primary/20 via-sky/20 to-golden/20 flex items-center justify-center">
              <Users className="h-24 w-24 text-primary/40" />
            </div>
          )}

          {/* Group Info */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-serif font-bold text-dark mb-2">
                  {group.name}
                </h1>
                {group.description && (
                  <p className="text-stone-600">{group.description}</p>
                )}
              </div>
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/groups/${group.id}/settings`)}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-stone-600">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  {memberCount} {memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {tripCount} {tripCount === 1 ? 'trip' : 'trips'}
                </span>
              </div>
              {currentMember && (
                <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {currentMember.role}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                {memberCount} {memberCount === 1 ? 'person' : 'people'} in this
                group
              </CardDescription>
            </div>
            {isAdmin && (
              <Button variant="outline" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-stone-100 rounded animate-pulse" />
              ))}
            </div>
          ) : members && members.length > 0 ? (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium text-sm">
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-dark">{member.user.name}</p>
                      <p className="text-sm text-stone-500">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-600 font-medium">
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
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isOwner && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-stone-200">
              <div>
                <p className="font-medium text-dark">Leave Group</p>
                <p className="text-sm text-stone-600">
                  Remove yourself from this group
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleLeave}
                loading={isLeaving}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Leave
              </Button>
            </div>
          )}
          {isOwner && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
              <div>
                <p className="font-medium text-red-900">Delete Group</p>
                <p className="text-sm text-red-700">
                  {showDeleteConfirm
                    ? 'Click again to confirm deletion'
                    : 'Permanently delete this group and all its data'}
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDelete}
                loading={isDeleting}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
