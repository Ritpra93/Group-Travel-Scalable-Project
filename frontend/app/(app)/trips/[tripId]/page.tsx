/**
 * Trip Detail Page - Aura Redesign
 * Editorial style overview with strong vertical rhythm and sectioned layout
 */

'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Settings,
  Plus,
  Car,
  Hotel,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  Cloud,
  Map as MapIcon,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { useTrip } from '@/lib/api/hooks/use-trips';
import { useTripExpenses, useTripBalances } from '@/lib/api/hooks/use-expenses';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useTripSocket } from '@/lib/socket';
import { ExpenseCategoryIcon, getCategoryLabel } from '@/components/patterns/expense-category-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

// ============================================================================
// Aura Components (Local for now, could be extracted)
// ============================================================================

const SectionHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-8">
    <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">{title}</h2>
    {action}
  </div>
);

const ContentCard = ({
  icon: Icon,
  label,
  value,
  subtext,
  action,
}: {
  icon?: React.ElementType;
  label: string;
  value: React.ReactNode;
  subtext?: string;
  action?: React.ReactNode;
}) => (
  <Card className="h-full hover:shadow-hover transition-shadow duration-300">
    <CardContent className="p-6 flex flex-col justify-between h-full min-h-[160px]">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">
            {label}
          </p>
          <div className="text-2xl sm:text-3xl font-light text-zinc-900 tracking-tight">
            {value}
          </div>
          {subtext && <p className="text-sm text-zinc-400 mt-1 font-medium">{subtext}</p>}
        </div>
        {Icon && <Icon className="w-5 h-5 text-zinc-300" />}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </CardContent>
  </Card>
);

const TimelineItem = ({
  time,
  title,
  description,
  users,
  isLast,
}: {
  time: string;
  title: string;
  description: string;
  users?: string[];
  isLast?: boolean;
}) => (
  <div className="relative pl-8 pb-12 last:pb-0">
    {/* Line */}
    {!isLast && (
      <div className="absolute left-[11px] top-3 bottom-0 w-px bg-zinc-200" />
    )}
    {/* Dot */}
    <div className="absolute left-[7px] top-2.5 w-2.5 h-2.5 rounded-full bg-zinc-300 ring-4 ring-white" />

    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-zinc-400 tracking-wide">{time}</span>
      <h4 className="text-base font-medium text-zinc-900">{title}</h4>
      <p className="text-sm text-zinc-500 max-w-md">{description}</p>
      {users && (
        <div className="flex -space-x-2 mt-2">
          {users.map((u, i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-zinc-600">
              {u}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ============================================================================
// Page Component
// ============================================================================

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Enable real-time updates for this trip
  useTripSocket(tripId);

  // Fetch trip
  // Note: Assuming useTrip returns the same shape. If fields are missing in backend, we handle gracefully.
  const { data: trip, isLoading, error } = useTrip(tripId);

  // Fetch recent expenses
  const { data: expensesData } = useTripExpenses(tripId, { limit: 3 });
  const { data: balances } = useTripBalances(tripId);

  if (isLoading) return <div className="h-screen flex items-center justify-center text-zinc-400">Loading Aura...</div>;
  if (error || !trip) return <div>Trip not found</div>;

  const recentExpenses = expensesData?.data || [];
  const totalExpenses = recentExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  // Calculate user's balance
  const userBalance = balances?.find((b) => b.userId === user?.id);
  const userBalanceAmount = userBalance ? parseFloat(userBalance.balance) : 0;

  // Derived State
  const startDate = new Date(trip.startDate).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  });
  const endDate = new Date(trip.endDate).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  });

  return (
    <div className="bg-zinc-50 min-h-screen pb-24">

      {/* 1. Hero Section - Cinematic & Clean */}
      <div className="relative h-[40vh] w-full group overflow-hidden -ml-[70px] lg:-ml-64">
        {trip.imageUrl ? (
          <Image
            src={trip.imageUrl}
            alt={trip.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-200 flex items-center justify-center">
            <MapPin className="h-20 w-20 text-zinc-300" />
          </div>
        )}

        {/* Gradient Overlay - Subtle Fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 pb-10 pt-28">
          <div className="max-w-7xl mx-auto w-full pl-[78px] pr-8 lg:pl-[268px] lg:pr-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-100 text-[10px] font-bold tracking-wider uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active Trip
                  </span>
                  <span className="text-white/60 text-sm font-medium tracking-wide uppercase">
                    {startDate} - {endDate}
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-light text-white tracking-tight mb-2">
                  {trip.name}
                </h1>
                <p className="text-lg text-white/80 font-light max-w-xl line-clamp-2">
                  10 days exploring glaciers, waterfalls, and volcanic beaches with the crew.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button className="bg-white text-zinc-900 hover:bg-zinc-100">
                  <MapIcon className="w-4 h-4 mr-2" />
                  View Map
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Container */}
      <div className="max-w-7xl mx-auto px-8 lg:px-12 pt-12">

        {/* Context Grid - Budget, Transport, Stay */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <ContentCard
            label="Total Budget"
            value={
              <span>
                ${trip.budget?.toLocaleString() || '0'}
                <span className="text-zinc-300 text-lg ml-1 font-normal">/ $5,000</span>
              </span>
            }
            icon={Clock}
            action={
              <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-zinc-900 h-full w-[65%]" />
              </div>
            }
          />
          <ContentCard
            label="Car Rental"
            value="Land Rover"
            subtext="Pickup at KEF Airport"
            icon={Car}
          />
          <ContentCard
            label="Stay"
            value="Fosshotel"
            subtext="3 nights booked"
            icon={Hotel}
          />
        </div>

        {/* Two Column Layout - Itinerary vs Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 sm:gap-16">

          {/* Left: Itinerary (Span 2) */}
          <div className="lg:col-span-2">
            <SectionHeader
              title="Itinerary"
              action={
                <div className="flex gap-4 text-sm font-medium text-zinc-400">
                  <span className="text-zinc-900 border-b border-zinc-900 pb-0.5 cursor-pointer">Timeline</span>
                  <span className="hover:text-zinc-600 cursor-pointer">Map View</span>
                </div>
              }
            />

            <div className="bg-white rounded-2xl border border-zinc-100 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-medium text-zinc-900">Day 1 <span className="text-zinc-400 mx-2">•</span> <span className="text-zinc-500 text-base font-normal">Oct 12</span></h3>
                <span className="px-2 py-1 rounded bg-zinc-100 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Arrival</span>
              </div>

              <div className="space-y-2">
                {/* Mock Data for visual - would map trip.itineraryItems here */}
                <TimelineItem
                  time="09:30 AM"
                  title="Land at Keflavík International"
                  description="Added by Alex"
                  users={['A']}
                />
                <TimelineItem
                  time="11:00 AM"
                  title="Blue Lagoon Reservation"
                  description="Booking #99281. Don't forget swimwear. Towels included in package."
                  users={['A', 'J', 'M']}
                />
                <TimelineItem
                  time="02:00 PM"
                  title="Drive to Vík"
                  description="2h 30m drive via Route 1."
                  isLast
                />
              </div>
            </div>
          </div>

          {/* Right: Widgets (Span 1) */}
          <div className="space-y-8">

            {/* Active Poll Widget */}
            <div>
              <SectionHeader title="Active Poll" />
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-sm font-medium text-zinc-900">Dinner in Reykjavík?</h4>
                    <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 px-2 py-1 rounded-full">Ends in 2h</span>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-zinc-700">Grillmarket</span>
                        <span className="text-zinc-400">3 votes</span>
                      </div>
                      <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-zinc-800 h-full w-[75%]" />
                      </div>
                      <div className="flex -space-x-1 mt-2">
                        {['A', 'B', 'C'].map(u => (
                          <div key={u} className="w-5 h-5 rounded-full bg-zinc-200 border border-white" />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-zinc-700">Fish Company</span>
                        <span className="text-zinc-400">1 vote</span>
                      </div>
                      <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-zinc-300 h-full w-[25%]" />
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full text-xs h-9">Cast Vote</Button>
                </CardContent>
              </Card>
            </div>

            {/* Essentials / Packing List */}
            <div>
              <SectionHeader title="Essentials" action={<span className="text-xs text-zinc-400">3/8 packed</span>} />
              <Card>
                <CardContent className="p-0">
                  {[
                    { label: 'Waterproof Jacket', checked: false },
                    { label: 'Hiking Boots', checked: true },
                    { label: 'Power Bank', checked: false }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors cursor-pointer">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${item.checked ? 'bg-zinc-900 border-zinc-900 text-white' : 'border-zinc-200'}`}>
                        {item.checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-sm ${item.checked ? 'text-zinc-400 line-through' : 'text-zinc-600'}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Expenses Widget */}
            <div>
              <SectionHeader
                title="Expenses"
                action={
                  <Link
                    href={`/trips/${tripId}/expenses`}
                    className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1"
                  >
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
              <Card>
                <CardContent className="p-6">
                  {/* Balance summary */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Your Balance</p>
                      <p className={`text-2xl font-light ${userBalanceAmount > 0 ? 'text-emerald-600' : userBalanceAmount < 0 ? 'text-rose-600' : 'text-zinc-500'}`}>
                        {userBalanceAmount >= 0 ? '+' : ''}${Math.abs(userBalanceAmount).toFixed(2)}
                      </p>
                    </div>
                    <Receipt className="w-5 h-5 text-zinc-300" />
                  </div>

                  {/* Recent expenses */}
                  {recentExpenses.length > 0 ? (
                    <div className="space-y-3">
                      {recentExpenses.map((expense) => (
                        <Link
                          key={expense.id}
                          href={`/trips/${tripId}/expenses/${expense.id}`}
                          className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-zinc-50 transition-colors"
                        >
                          <ExpenseCategoryIcon category={expense.category} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 truncate">{expense.title}</p>
                            <p className="text-xs text-zinc-400">{expense.payer?.name}</p>
                          </div>
                          <span className="text-sm font-medium text-zinc-900">
                            ${parseFloat(expense.amount).toFixed(2)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400 text-center py-4">No expenses yet</p>
                  )}

                  <Link href={`/trips/${tripId}/expenses/new`}>
                    <Button variant="outline" className="w-full mt-4 text-xs h-9">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Expense
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Weather Widget */}
            <div className="bg-zinc-900 rounded-2xl p-6 text-white relative overflow-hidden">
              <Cloud className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5" />
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Forecast</p>
              <div className="flex items-end gap-3 mb-1">
                <span className="text-4xl font-light">Rainy</span>
                <span className="text-sm text-white/60 mb-1">High chance</span>
              </div>
              <p className="text-xs text-white/40">12°C / 8°C • Wind 12km/h</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
