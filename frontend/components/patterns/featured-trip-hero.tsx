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

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 w-full p-8 lg:p-10 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex items-end justify-between">
            {/* Left: Trip Info */}
            <div>
              <div className="flex items-center gap-2 text-white/80 text-xs font-medium tracking-widest uppercase mb-3">
                <StatusBadge variant="active">Active Trip</StatusBadge>
                <span>•</span>
                <span>
                  {startDate} - {endDate}
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-light text-white tracking-tight mb-2">
                {trip.name}
              </h1>
              <p className="text-zinc-300 font-light text-lg max-w-lg">{trip.destination}</p>
            </div>

            {/* Right: Weather + CTA */}
            <div className="hidden md:flex gap-3 items-end">
              {weather && (
                <div className="text-right text-white mr-4 border-r border-white/20 pr-6">
                  <p className="text-2xl font-light">{weather.temp}</p>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider">{weather.location}</p>
                </div>
              )}
              <Button
                variant="secondary"
                className="shadow-lg shadow-black/20 flex items-center gap-2"
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
