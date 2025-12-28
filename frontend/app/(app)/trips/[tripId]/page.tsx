/**
 * Trip Detail Page
 * View and manage a specific trip with tabs
 */

'use client';

import { use, useState } from 'react';
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
import { TripStatus } from '@/types';

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
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch trip
  const { data: trip, isLoading, error } = useTrip(tripId);

  // Mutations
  const { mutate: deleteTrip, isPending: isDeleting } = useDeleteTrip();
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateTripStatus(tripId);

  // Handle delete
  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteTrip(tripId);
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
    <div className="-m-4 sm:-m-6 lg:-m-8">
      {/* Cinematic Hero Cover */}
      <div className="relative min-h-screen w-full overflow-hidden flex flex-col">
        {trip.imageUrl ? (
          <Image
            src={trip.imageUrl}
            alt={trip.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            quality={90}
          />
        ) : (
          <div className="absolute inset-0 bg-stone-100 flex items-center justify-center">
            <MapPin className="h-40 w-40 text-stone-300" />
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/40 to-black/80" />

        {/* Back button - top left */}
        <div className="absolute top-8 left-8 z-20">
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
        <div className="absolute top-8 right-8 z-20">
          <Button
            variant="secondary"
            onClick={() => router.push(`/trips/${trip.id}/settings`)}
            className="gap-2 backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>

        {/* Centered content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
          <h1 className="font-serif text-7xl md:text-8xl font-semibold text-white mb-6 tracking-tight max-w-5xl">
            {trip.name}
          </h1>
          <div className="flex items-center gap-3 text-white/90 mb-4">
            <MapPin className="h-6 w-6" />
            <span className="text-2xl font-light">{trip.destination}</span>
          </div>
          <p className="text-lg text-white/80 font-light max-w-2xl">
            {startDate} – {endDate}
          </p>
          {trip.description && (
            <p className="text-xl text-white/70 mt-6 max-w-3xl font-light leading-relaxed">
              {trip.description}
            </p>
          )}
        </div>

        {/* Stats bar at bottom with glass morphism */}
        <div className="relative z-10 p-8">
          <div className="container mx-auto px-6">
            <div className="glass-card rounded-3xl p-8 backdrop-blur-xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white">
                <div className="text-center">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-white/70" />
                  <p className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wider">
                    Duration
                  </p>
                  <p className="text-3xl font-semibold font-serif">
                    {duration} {duration === 1 ? 'day' : 'days'}
                  </p>
                </div>
                {trip.budget && (
                  <div className="text-center">
                    <DollarSign className="h-6 w-6 mx-auto mb-2 text-white/70" />
                    <p className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wider">
                      Budget
                    </p>
                    <p className="text-3xl font-semibold font-serif">
                      ${trip.budget.toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-white/70" />
                  <p className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wider">
                    Members
                  </p>
                  <p className="text-3xl font-semibold font-serif">{memberCount}</p>
                </div>
                <div className="text-center">
                  <div className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wider">
                    Status
                  </p>
                  <select
                    value={trip.status}
                    onChange={(e) =>
                      handleStatusChange(e.target.value as TripStatus)
                    }
                    disabled={isUpdatingStatus}
                    className="bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white text-sm font-medium backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value} className="bg-stone-900">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {trip.group && (
                <div className="mt-6 pt-6 border-t border-white/20 text-center">
                  <button
                    onClick={() => router.push(`/groups/${trip.group.id}`)}
                    className="text-white/90 font-light hover:text-white transition-colors"
                  >
                    Part of <span className="font-semibold">{trip.group.name}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
