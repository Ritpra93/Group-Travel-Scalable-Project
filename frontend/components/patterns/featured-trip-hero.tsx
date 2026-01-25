/**
 * FeaturedTripHero Component
 * 50vh immersive hero section for featured/active trips
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Plus, Compass } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';

export interface FeaturedTripHeroProps {
  trip: {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    imageUrl?: string;
    status?: string;
  };
  weather?: {
    temp: string;
    location: string;
  };
}

// Default placeholder image for trips without images
const DEFAULT_TRIP_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80';

export function FeaturedTripHero({ trip, weather }: FeaturedTripHeroProps) {
  // Format dates
  const startDate = new Date(trip.startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const endDate = new Date(trip.endDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div data-testid="hero" className="relative w-full h-[40vh] bg-zinc-900 overflow-hidden group -ml-[var(--sidebar-width-mobile)] lg:-ml-[var(--sidebar-width-desktop)]">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/20 z-10" />

      {/* Hero Image */}
      <Image
        src={trip.imageUrl || DEFAULT_TRIP_IMAGE}
        alt={trip.name}
        fill
        className="object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
        priority
      />

      {/* Bottom gradient overlay - Extended for better text visibility */}
      <div className="absolute bottom-0 left-0 w-full pb-10 pt-28 z-20 bg-gradient-to-t from-black/95 via-black/75 to-transparent">
        <div className="max-w-7xl mx-auto w-full pl-[calc(var(--sidebar-width-mobile)+8px)] pr-6 lg:pl-[calc(var(--sidebar-width-desktop)+8px)] lg:pr-8">
          <div className="flex items-end justify-between gap-8">
            {/* Left: Trip Info */}
            <div className="flex-1 min-w-0 pb-0">
              <div className="flex items-center gap-3 text-white/80 text-sm font-medium tracking-widest uppercase mb-4">
                <StatusBadge variant="active">Active Trip</StatusBadge>
                <span>•</span>
                <span>
                  {startDate} - {endDate}
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-light text-white tracking-tight mb-5 leading-tight drop-shadow-lg">
                {trip.name}
              </h1>
              <p className="text-zinc-200 font-light text-lg lg:text-xl leading-relaxed drop-shadow-md max-w-2xl">{trip.destination}</p>
            </div>

            {/* Right: Weather + CTA */}
            <div className="hidden lg:flex gap-4 items-end flex-shrink-0">
              {weather && (
                <div className="text-right text-white mr-6 border-r border-white/20 pr-8">
                  <p className="text-3xl font-light mb-1">{weather.temp}</p>
                  <p className="text-sm text-zinc-400 uppercase tracking-wider">{weather.location}</p>
                </div>
              )}
              <Button
                variant="secondary"
                className="shadow-lg shadow-black/20 flex items-center gap-2 px-6 py-3"
              >
                <MapPin className="w-4 h-4" /> View Map
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Placeholder hero when no trips exist
 */
export function FeaturedTripHeroPlaceholder() {
  return (
    <div data-testid="hero-placeholder" className="relative w-full h-[40vh] bg-zinc-900 overflow-hidden -ml-[var(--sidebar-width-mobile)] lg:-ml-[var(--sidebar-width-desktop)]">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 z-10" />

      {/* Decorative pattern */}
      <div className="absolute inset-0 z-10 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-white rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 border border-white rounded-full" />
        <div className="absolute bottom-1/4 left-1/3 w-32 h-32 border border-white rounded-full" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full pb-10 pt-28 z-20 bg-gradient-to-t from-black/50 to-transparent">
        <div className="max-w-7xl mx-auto w-full pl-[calc(var(--sidebar-width-mobile)+8px)] pr-6 lg:pl-[calc(var(--sidebar-width-desktop)+8px)] lg:pr-8">
          <div className="flex items-end justify-between gap-8">
            {/* Left: Welcome message */}
            <div className="flex-1 min-w-0 pb-0">
              <div className="flex items-center gap-2 text-zinc-400 mb-4">
                <Compass className="w-5 h-5" />
                <span className="text-sm font-medium tracking-widest uppercase">Welcome to Wanderlust</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-light text-white tracking-tight mb-5 leading-tight">
                Start Your Journey
              </h1>
              <p className="text-zinc-400 font-light text-lg lg:text-xl leading-relaxed max-w-2xl">
                Create your first trip to begin planning your next adventure with friends.
              </p>
            </div>

            {/* Right: CTA */}
            <div className="hidden lg:flex gap-4 items-end flex-shrink-0">
              <Link href="/trips/new">
                <Button
                  variant="secondary"
                  className="shadow-lg shadow-black/20 flex items-center gap-2 px-6 py-3"
                >
                  <Plus className="w-4 h-4" /> Create Trip
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
