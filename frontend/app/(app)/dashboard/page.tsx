/**
 * Dashboard Page - Aura Design
 * Hybrid layout with featured trip hero + overview cards
 */

'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { useGroups } from '@/lib/api/hooks/use-groups';
import { useTrips } from '@/lib/api/hooks/use-trips';
import { GlassPanel } from '@/components/ui/glass-panel';
import { StatusBadge } from '@/components/ui/status-badge';
import { QuickActionCard } from '@/components/patterns/quick-action-card';
import { StatCard } from '@/components/patterns/stat-card';
import { FeaturedTripHero } from '@/components/patterns/featured-trip-hero';
import { PollWidget } from '@/components/patterns/poll-widget';
import { WeatherWidget } from '@/components/patterns/weather-widget';
import { PackingListWidget } from '@/components/patterns/packing-list-widget';
import { TripCard } from '@/components/patterns/trip-card';
import { Plus, UsersRound, MailOpen, PieChart, Car, Home, Settings2, AlertCircle } from 'lucide-react';
import { UNSPLASH_IMAGES } from '@/lib/constants/unsplash-images';
import { MOCK_POLL_OPTIONS, MOCK_PACKING_ITEMS, MOCK_WEATHER_FORECAST, MOCK_ONLINE_MEMBERS } from '@/lib/constants/mock-data';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Fetch real data
  const { data: groupsData } = useGroups({ limit: 100 });
  const { data: tripsData } = useTrips({ limit: 100 });

  const trips = tripsData?.data || [];
  const groups = groupsData?.data || [];

  // Mock featured trip - replace with real "active" trip from API
  const featuredTrip = {
    id: '1',
    name: 'Iceland: Ring Road',
    destination: '10 days exploring glaciers, waterfalls, and volcanic beaches with the crew.',
    startDate: '2024-10-12',
    endDate: '2024-10-22',
    imageUrl: UNSPLASH_IMAGES.trips.iceland,
    status: 'CONFIRMED',
  };

  return (
    <main className="flex-1 flex flex-col bg-white relative">
      {/* Header - Absolute positioned glass panels */}
      <header className="absolute top-0 left-0 right-0 z-20 px-8 py-6 flex justify-between items-start pointer-events-none">
        {/* Left: Online status */}
        <div className="pointer-events-auto">
          <GlassPanel variant="dark" className="px-4 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-zinc-200">Online • 4 Members active</span>
          </GlassPanel>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <StatusBadge variant="issue">
            <AlertCircle className="w-3.5 h-3.5" />
            1 Issue
          </StatusBadge>

          <GlassPanel variant="light" className="px-4 py-2 rounded-full flex items-center gap-3">
            <div className="flex -space-x-2">
              {MOCK_ONLINE_MEMBERS.slice(0, 2).map((member, idx) => (
                <img
                  key={idx}
                  className="w-6 h-6 rounded-full border border-white"
                  src={member.avatar}
                  alt={member.name}
                />
              ))}
              <div className="w-6 h-6 rounded-full border border-white bg-zinc-100 flex items-center justify-center text-[10px] font-medium text-zinc-600">
                +2
              </div>
            </div>
            <span className="h-4 w-px bg-zinc-300/50" />
            <button className="text-xs font-medium text-zinc-800 hover:text-black">Share</button>
          </GlassPanel>

          <button className="bg-white text-zinc-900 w-9 h-9 flex items-center justify-center rounded-full shadow-md hover:bg-zinc-50 transition-colors">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Featured Trip Hero (50vh) */}
        <FeaturedTripHero trip={featuredTrip} weather={{ temp: '4°C', location: 'Reykjavík' }} />

        {/* Dashboard Content */}
        <div className="bg-zinc-50 min-h-screen">
          <div data-testid="main-content" className="max-w-7xl mx-auto px-8 lg:px-12 pt-12 relative z-30 pb-20">
            {/* Quick Actions Grid (3 cols) - Generous spacing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  badge="1 NEW"
                  variant="highlight"
                />
              </Link>
            </div>

            {/* Featured Trip Stats (4 cols) - Strong visual break */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <StatCard
                label="Total Budget"
                value="$3,240"
                subValue="/ $5,000"
                icon={PieChart}
                progress={65}
              />
              <StatCard label="Car Rental" value="Land Rover" icon={Car} />
              <StatCard label="Stay" value="Fosshotel" icon={Home} />
              <StatCard label="Add Expense" variant="action" value="Add Expense" icon={Plus} />
            </div>

            {/* Main Grid (2/3 + 1/3) - Editorial spacing */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Trip/Group Overview Cards */}
              <div className="lg:col-span-2 space-y-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-light text-zinc-900 tracking-tight">Your Trips</h3>
                  <Link
                    href="/trips"
                    className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    View all →
                  </Link>
                </div>

                {trips.length > 0 ? (
                  <div className="space-y-6">
                    {trips.slice(0, 3).map((trip: any) => (
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

              {/* Right Column: Widgets - Quieter, secondary */}
              <div className="space-y-8">
                <PollWidget
                  question="Dinner in Reykjavík?"
                  options={MOCK_POLL_OPTIONS}
                  timeRemaining="2h"
                />
                <PackingListWidget items={MOCK_PACKING_ITEMS} />
                <WeatherWidget
                  current={{ condition: 'Rainy', description: 'High Chance' }}
                  forecast={MOCK_WEATHER_FORECAST}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
