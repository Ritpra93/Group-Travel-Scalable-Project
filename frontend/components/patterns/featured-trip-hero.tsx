/**
 * FeaturedTripHero Component
 * 50vh immersive hero section for featured/active trips
 */

'use client';

import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';

export interface FeaturedTripHeroProps {
  trip: {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    imageUrl: string;
    status?: string;
  };
  weather?: {
    temp: string;
    location: string;
  };
}

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
    <div className="relative w-full h-[50vh] bg-zinc-900 overflow-hidden group">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/20 z-10" />

      {/* Hero Image */}
      <Image
        src={trip.imageUrl}
        alt={trip.name}
        fill
        className="object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
        priority
      />

      {/* Bottom gradient overlay - Extended for better text visibility */}
      <div className="absolute bottom-0 left-0 w-full p-10 lg:p-12 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-32">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-10">
          <div className="flex items-end justify-between gap-8">
            {/* Left: Trip Info */}
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-3 text-white/80 text-sm font-medium tracking-widest uppercase mb-4">
                <StatusBadge variant="active">Active Trip</StatusBadge>
                <span>•</span>
                <span>
                  {startDate} - {endDate}
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-light text-white tracking-tight mb-4 leading-tight drop-shadow-lg">
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
