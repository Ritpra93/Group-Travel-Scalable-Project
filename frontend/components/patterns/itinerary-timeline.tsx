/**
 * ItineraryTimeline Component
 * Day-by-day timeline with events
 */

'use client';

import { type LucideIcon, Plane, Navigation, Coffee, Waves } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

const iconMap: Record<string, LucideIcon> = {
  Plane,
  Navigation,
  Coffee,
  Waves,
};

export interface ItineraryEvent {
  time: string;
  title: string;
  description?: string;
  icon?: string;
  image?: string;
  addedBy?: {
    name: string;
    avatar: string;
  };
}

export interface ItineraryDay {
  day: number;
  date: string;
  label?: string;
  events: ItineraryEvent[];
}

export interface ItineraryTimelineProps {
  days: ItineraryDay[];
}

export function ItineraryTimeline({ days }: ItineraryTimelineProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      {days.map((dayData) => (
        <div key={dayData.day} className="p-0">
          {/* Day Header */}
          <div className="bg-zinc-50/50 px-6 py-3 border-b border-zinc-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-900 text-sm">Day {dayData.day}</span>
              <span className="text-zinc-400 text-sm">•</span>
              <span className="text-zinc-500 text-sm">{dayData.date}</span>
            </div>
            {dayData.label && (
              <span className="text-[10px] font-semibold bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded">
                {dayData.label}
              </span>
            )}
          </div>

          {/* Events */}
          <div className="relative p-6">
            {/* Vertical line */}
            <div className="absolute left-6 top-6 bottom-6 w-px bg-zinc-200" />

            {dayData.events.map((event, idx) => {
              const Icon = event.icon ? iconMap[event.icon] : null;

              return (
                <div
                  key={idx}
                  className={cn(
                    'relative pl-8 group cursor-pointer',
                    idx < dayData.events.length - 1 && 'mb-8'
                  )}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-zinc-400 group-hover:bg-zinc-900 shadow-sm z-10 transition-colors" />

                  {/* Event content */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="text-xs font-medium text-zinc-400 block mb-0.5">
                        {event.time}
                      </span>
                      <h4 className="text-base font-medium text-zinc-900">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                          {event.description}
                        </p>
                      )}
                      {event.addedBy && (
                        <div className="flex items-center gap-2 mt-2">
                          <img
                            src={event.addedBy.avatar}
                            className="w-5 h-5 rounded-full border border-white"
                            alt={event.addedBy.name}
                          />
                          <span className="text-xs text-zinc-400">
                            Added by {event.addedBy.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Icon or Image */}
                    {event.image ? (
                      <div className="w-12 h-12 rounded bg-zinc-100 overflow-hidden flex-shrink-0 ml-4 border border-zinc-100 relative group-hover:shadow-md transition-all">
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          className="object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                        />
                      </div>
                    ) : Icon ? (
                      <Icon className="w-4 h-4 text-zinc-300 flex-shrink-0 ml-4" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
