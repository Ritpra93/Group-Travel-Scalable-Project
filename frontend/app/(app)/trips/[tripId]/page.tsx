/**
 * Trip Detail Page
 * View and manage a specific trip with tabs
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Settings,
  Trash2,
  Home,
  Receipt,
  Vote,
  Map,
} from 'lucide-react';
import { useTrip, useDeleteTrip, useUpdateTripStatus } from '@/lib/api/hooks/use-trips';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TripStatus } from '@/types/models.types';

// ============================================================================
// Trip Detail Page Component
// ============================================================================

const TABS = [
  { id: 'overview', name: 'Overview', icon: Home },
  { id: 'expenses', name: 'Expenses', icon: Receipt },
  { id: 'polls', name: 'Polls', icon: Vote },
  { id: 'itinerary', name: 'Itinerary', icon: Map },
];

const statusOptions = [
  { label: 'Planning', value: TripStatus.PLANNING },
  { label: 'Upcoming', value: TripStatus.UPCOMING },
  { label: 'Ongoing', value: TripStatus.ONGOING },
  { label: 'Completed', value: TripStatus.COMPLETED },
  { label: 'Cancelled', value: TripStatus.CANCELLED },
];

export default function TripDetailPage({
  params,
}: {
  params: { tripId: string };
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch trip
  const { data: trip, isLoading, error } = useTrip(params.tripId);

  // Mutations
  const { mutate: deleteTrip, isPending: isDeleting } = useDeleteTrip();
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateTripStatus(params.tripId);

  // Handle delete
  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteTrip(params.tripId);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  // Handle status change
  const handleStatusChange = (status: TripStatus) => {
    updateStatus(status);
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
  if (error || !trip) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <EmptyState
          title="Trip not found"
          description="This trip doesn't exist or you don't have access to it."
          action={{
            label: 'Back to Trips',
            onClick: () => router.push('/trips'),
          }}
        />
      </div>
    );
  }

  // Format dates
  const startDate = new Date(trip.startDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const endDate = new Date(trip.endDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const duration = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const memberCount = trip._count?.members || 0;

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

      {/* Trip Header Card */}
      <Card>
        <CardContent className="p-0">
          {/* Cover Image */}
          {trip.imageUrl ? (
            <div className="relative h-80 w-full rounded-t-xl overflow-hidden">
              <Image
                src={trip.imageUrl}
                alt={trip.name}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </div>
          ) : (
            <div className="relative h-80 w-full rounded-t-xl overflow-hidden bg-gradient-to-br from-primary/20 via-sky/20 to-golden/20 flex items-center justify-center">
              <MapPin className="h-32 w-32 text-primary/40" />
            </div>
          )}

          {/* Trip Info */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-serif font-bold text-dark mb-2">
                  {trip.name}
                </h1>
                <div className="flex items-center gap-2 text-stone-600 mb-3">
                  <MapPin className="h-5 w-5" />
                  <span className="text-lg">{trip.destination}</span>
                </div>
                {trip.description && (
                  <p className="text-stone-600">{trip.description}</p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => router.push(`/trips/${trip.id}/settings`)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-stone-50">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-stone-500">Duration</p>
                  <p className="font-medium text-dark">
                    {duration} {duration === 1 ? 'day' : 'days'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-stone-50">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-stone-500">Dates</p>
                  <p className="font-medium text-dark text-sm">
                    {startDate} - {endDate}
                  </p>
                </div>
              </div>

              {trip.budget && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-stone-50">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-stone-500">Budget</p>
                    <p className="font-medium text-dark">
                      ${trip.budget.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 rounded-lg bg-stone-50">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-stone-500">Members</p>
                  <p className="font-medium text-dark">{memberCount}</p>
                </div>
              </div>
            </div>

            {/* Status & Group */}
            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-stone-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-600">Status:</span>
                <select
                  value={trip.status}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as TripStatus)
                  }
                  disabled={isUpdatingStatus}
                  className="px-3 py-1 rounded-lg border border-stone-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {trip.group && (
                <div className="text-sm text-stone-600">
                  Group:{' '}
                  <button
                    onClick={() => router.push(`/groups/${trip.group.id}`)}
                    className="text-primary font-medium hover:underline"
                  >
                    {trip.group.name}
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-stone-200">
        <div className="flex gap-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-stone-600 hover:text-dark'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>Trip Overview</CardTitle>
            <CardDescription>
              General information about your trip
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Overview content coming soon"
              description="This section will display trip highlights, weather, and other overview information."
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'expenses' && (
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>Track and split trip costs</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Receipt}
              title="No expenses yet"
              description="Start tracking expenses to manage your trip budget and split costs with your crew."
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'polls' && (
        <Card>
          <CardHeader>
            <CardTitle>Polls</CardTitle>
            <CardDescription>Vote on trip decisions together</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Vote}
              title="No polls yet"
              description="Create polls to make group decisions about activities, dining, and more."
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'itinerary' && (
        <Card>
          <CardHeader>
            <CardTitle>Itinerary</CardTitle>
            <CardDescription>Plan your daily activities</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Map}
              title="No itinerary items yet"
              description="Build a day-by-day plan for your trip with activities and locations."
            />
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
            <div>
              <p className="font-medium text-red-900">Delete Trip</p>
              <p className="text-sm text-red-700">
                {showDeleteConfirm
                  ? 'Click again to confirm deletion'
                  : 'Permanently delete this trip and all its data'}
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
        </CardContent>
      </Card>
    </div>
  );
}
