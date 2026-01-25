/**
 * Dashboard Page - Aura Design
 * Hybrid layout with featured trip hero + overview cards
 */

'use client';

import { useMemo } from 'react';
import { useGroups, useGroupMembers } from '@/lib/api/hooks/use-groups';
import { useTrips } from '@/lib/api/hooks/use-trips';
import { GlassPanel } from '@/components/ui/glass-panel';
import { QuickActionCard } from '@/components/patterns/quick-action-card';
import { StatCard } from '@/components/patterns/stat-card';
import { FeaturedTripHero, FeaturedTripHeroPlaceholder } from '@/components/patterns/featured-trip-hero';
import { DashboardPollWidget, DashboardPollWidgetPlaceholder } from '@/components/patterns/dashboard-poll-widget';
import { PackingListPlaceholder, WeatherPlaceholder } from '@/components/patterns/coming-soon-widget';
import { TripCard } from '@/components/patterns/trip-card';
import { Plus, UsersRound, MailOpen, PieChart, Settings2 } from 'lucide-react';
import Link from 'next/link';
import type { Trip } from '@/types/models.types';

// Priority order for featured trip selection
const TRIP_STATUS_PRIORITY: Record<string, number> = {
  IN_PROGRESS: 1,
  CONFIRMED: 2,
  PLANNING: 3,
  COMPLETED: 4,
  CANCELLED: 5,
};

export default function DashboardPage() {
  // Fetch real data
  const { data: groupsData } = useGroups({ limit: 100 });
  const { data: tripsData, isLoading: isLoadingTrips } = useTrips({ limit: 100 });

  const trips = (tripsData?.data || []) as Trip[];
  const groups = groupsData?.data || [];

  // Select featured trip: prefer IN_PROGRESS > CONFIRMED > PLANNING
  const featuredTrip = useMemo(() => {
    if (trips.length === 0) return null;

    // Sort by status priority, then by start date (upcoming first)
    const sorted = [...trips].sort((a, b) => {
      const priorityA = TRIP_STATUS_PRIORITY[a.status] || 99;
      const priorityB = TRIP_STATUS_PRIORITY[b.status] || 99;
      if (priorityA !== priorityB) return priorityA - priorityB;

      // For same priority, sort by start date (closest upcoming first)
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    // Return first non-cancelled trip
    return sorted.find(t => t.status !== 'CANCELLED') || null;
  }, [trips]);

  // Fetch group members for featured trip
  // useGroupMembers returns GroupMember[] directly, not a paginated response
  const { data: members = [] } = useGroupMembers(featuredTrip?.groupId || '');

  // Format featured trip for hero component
  const heroTrip = featuredTrip ? {
    id: featuredTrip.id,
    name: featuredTrip.name,
    destination: featuredTrip.description || featuredTrip.destination,
    startDate: featuredTrip.startDate,
    endDate: featuredTrip.endDate,
    imageUrl: featuredTrip.imageUrl || undefined,
    status: featuredTrip.status,
  } : null;

  // Calculate member count display
  const visibleMembers = members.slice(0, 2);
  const remainingCount = Math.max(0, members.length - 2);

  return (
    <main className="flex-1 flex flex-col bg-white relative">
      {/* Header - Absolute positioned glass panels */}
      <header className="absolute top-0 left-0 right-0 z-20 px-8 py-6 flex justify-between items-start pointer-events-none">
        {/* Left: Online status */}
        <div className="pointer-events-auto">
          <GlassPanel variant="dark" className="px-4 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-zinc-200">
              Online {members.length > 0 && `• ${members.length} Member${members.length !== 1 ? 's' : ''}`}
            </span>
          </GlassPanel>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {members.length > 0 && (
            <GlassPanel variant="light" className="px-4 py-2 rounded-full flex items-center gap-3">
              <div className="flex -space-x-2">
                {visibleMembers.map((member) => (
                  member.user?.avatarUrl ? (
                    <img
                      key={member.id}
                      className="w-6 h-6 rounded-full border border-white object-cover"
                      src={member.user.avatarUrl}
                      alt={member.user.name}
                    />
                  ) : (
                    <div
                      key={member.id}
                      className="w-6 h-6 rounded-full border border-white bg-zinc-200 flex items-center justify-center"
                    >
                      <span className="text-[10px] font-medium text-zinc-600">
                        {member.user?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )
                ))}
                {remainingCount > 0 && (
                  <div className="w-6 h-6 rounded-full border border-white bg-zinc-100 flex items-center justify-center text-[10px] font-medium text-zinc-600">
                    +{remainingCount}
                  </div>
                )}
              </div>
              {featuredTrip && (
                <>
                  <span className="h-4 w-px bg-zinc-300/50" />
                  <Link
                    href={`/trips/${featuredTrip.id}`}
                    className="text-xs font-medium text-zinc-800 hover:text-black"
                  >
                    View Trip
                  </Link>
                </>
              )}
            </GlassPanel>
          )}

          <button className="bg-white text-zinc-900 w-9 h-9 flex items-center justify-center rounded-full shadow-md hover:bg-zinc-50 transition-colors">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Featured Trip Hero (40vh) */}
        {heroTrip ? (
          <FeaturedTripHero trip={heroTrip} />
        ) : (
          <FeaturedTripHeroPlaceholder />
        )}

        {/* Dashboard Content */}
        <div className="bg-zinc-50">
          <div data-testid="main-content" className="max-w-7xl mx-auto px-6 lg:px-8 pt-12 relative z-30 pb-20">
            {/* Quick Actions Grid (3 cols) - Generous spacing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Link href="/trips/new">
                <QuickActionCard icon={Plus} title="Create Trip" description="Plan a new journey" />
              </Link>
              <Link href="/groups/new">
                <QuickActionCard icon={UsersRound} title="New Group" description="Invite your crew" />
              </Link>
              <Link href="/invitations">
                <QuickActionCard
                  icon={MailOpen}
                  title="Invitations"
                  description="View pending invites"
                />
              </Link>
            </div>

            {/* Featured Trip Stats (3 cols) - only show if we have a trip */}
            {featuredTrip && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                <StatCard
                  label="Budget"
                  value={featuredTrip.totalBudget ? `$${parseFloat(featuredTrip.totalBudget).toLocaleString()}` : 'Not set'}
                  icon={PieChart}
                />
                <Link href={`/trips/${featuredTrip.id}/expenses`}>
                  <StatCard
                    label="Expenses"
                    value="View"
                    variant="action"
                    icon={PieChart}
                  />
                </Link>
                <Link href={`/trips/${featuredTrip.id}/expenses/new`}>
                  <StatCard
                    label="Add Expense"
                    variant="action"
                    value="Add"
                    icon={Plus}
                  />
                </Link>
              </div>
            )}

            {/* Main Grid (2/3 + 1/3) - Editorial spacing */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Trip/Group Overview Cards */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-light text-zinc-900 tracking-tight">Your Trips</h3>
                  <Link
                    href="/trips"
                    className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    View all →
                  </Link>
                </div>

                {isLoadingTrips ? (
                  <div className="bg-white rounded-xl border border-zinc-200 p-16 text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent mx-auto mb-4" />
                    <p className="text-zinc-500 text-base">Loading trips...</p>
                  </div>
                ) : trips.length > 0 ? (
                  <div className="space-y-6">
                    {trips.slice(0, 3).map((trip) => (
                      <TripCard key={trip.id} trip={trip} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-zinc-200 p-16 text-center">
                    <p className="text-zinc-500 text-base">No trips yet. Create your first trip!</p>
                  </div>
                )}

                <div className="flex items-center justify-between mb-6 pt-4">
                  <h3 className="text-xl font-light text-zinc-900 tracking-tight">Your Groups</h3>
                  <Link
                    href="/groups"
                    className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    View all →
                  </Link>
                </div>

                {groups.length > 0 ? (
                  <div className="space-y-5">
                    {groups.slice(0, 2).map((group: any) => (
                      <Link
                        key={group.id}
                        href={`/groups/${group.id}`}
                        className="block bg-white rounded-xl border border-zinc-200 p-8 hover:border-zinc-300 hover:shadow-sm transition-all"
                      >
                        <h4 className="font-medium text-zinc-900 mb-3 text-lg leading-tight">{group.name}</h4>
                        <p className="text-base text-zinc-500 leading-relaxed">{group.description || 'No description'}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-zinc-200 p-16 text-center">
                    <p className="text-zinc-500 text-base">No groups yet. Create your first group!</p>
                  </div>
                )}
              </div>

              {/* Right Column: Widgets */}
              <div className="space-y-8">
                {featuredTrip ? (
                  <DashboardPollWidget tripId={featuredTrip.id} />
                ) : (
                  <DashboardPollWidgetPlaceholder />
                )}
                <PackingListPlaceholder />
                <WeatherPlaceholder />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
