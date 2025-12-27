/**
 * Dashboard Page
 * Overview of user's trips, groups, and recent activity
 */

'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, MapPin, Users, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Placeholder data - will be replaced with real API calls
  const stats = [
    { name: 'Total Trips', value: '0', icon: MapPin, color: 'bg-primary' },
    { name: 'Groups', value: '0', icon: Users, color: 'bg-secondary' },
    { name: 'Upcoming', value: '0', icon: Calendar, color: 'bg-accent' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="mb-2 font-serif text-4xl font-bold text-dark">
          Welcome back, {user?.name || 'Adventurer'}! 👋
        </h1>
        <p className="text-stone-600">
          Ready to plan your next unforgettable journey?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/trips/new"
          className="group flex items-center gap-4 rounded-xl border-2 border-dashed border-stone-300 bg-white p-6 transition-all hover:border-primary hover:bg-primary/5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
            <Plus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-dark">Create Trip</h3>
            <p className="text-sm text-stone-600">Start planning</p>
          </div>
        </Link>

        <Link
          href="/groups/new"
          className="group flex items-center gap-4 rounded-xl border-2 border-dashed border-stone-300 bg-white p-6 transition-all hover:border-secondary hover:bg-secondary/5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-white">
            <Plus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-dark">New Group</h3>
            <p className="text-sm text-stone-600">Invite friends</p>
          </div>
        </Link>

        <Link
          href="/invitations"
          className="group flex items-center gap-4 rounded-xl border-2 border-dashed border-stone-300 bg-white p-6 transition-all hover:border-accent hover:bg-accent/5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-white">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-dark">Invitations</h3>
            <p className="text-sm text-stone-600">View pending</p>
          </div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="rounded-xl bg-white p-6 shadow-sm border border-stone-200"
            >
              <div className="flex items-center gap-4">
                <div className={cn('rounded-lg p-3', stat.color)}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-600">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-dark">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      <div className="rounded-xl border-2 border-dashed border-stone-300 bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mb-2 font-serif text-2xl font-bold text-dark">
          No trips yet
        </h2>
        <p className="mb-6 text-stone-600">
          Start planning your first adventure and invite your crew!
        </p>
        <Link href="/trips/new">
          <Button variant="primary" size="lg">
            <Plus className="h-5 w-5" />
            Create Your First Trip
          </Button>
        </Link>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
