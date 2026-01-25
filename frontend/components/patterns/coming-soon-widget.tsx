/**
 * ComingSoonWidget Component
 * Placeholder widgets for features not yet implemented
 */

import { type LucideIcon, Package, CloudRain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ComingSoonWidgetProps {
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: 'light' | 'dark';
  className?: string;
}

export function ComingSoonWidget({
  title,
  description,
  icon: Icon,
  variant = 'light',
  className,
}: ComingSoonWidgetProps) {
  if (variant === 'dark') {
    return (
      <div className={cn(
        'bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl shadow-lg text-white p-6 relative overflow-hidden',
        className
      )}>
        {/* Background icon */}
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Icon className="w-20 h-20" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Coming Soon
            </span>
          </div>
          <h3 className="text-xl font-light mb-2">{title}</h3>
          <p className="text-zinc-400 text-sm">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-white rounded-xl border border-zinc-200 shadow-sm p-7 relative overflow-hidden',
      className
    )}>
      {/* Background icon */}
      <div className="absolute top-0 right-0 p-3 opacity-5">
        <Icon className="w-20 h-20" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Coming Soon
          </span>
        </div>
        <h3 className="text-base font-medium text-zinc-900 mb-2">{title}</h3>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

/**
 * Pre-configured packing list placeholder
 */
export function PackingListPlaceholder({ className }: { className?: string }) {
  return (
    <ComingSoonWidget
      title="Packing Lists"
      description="Create and share packing lists with your group. Track what everyone's bringing."
      icon={Package}
      variant="light"
      className={className}
    />
  );
}

/**
 * Pre-configured weather placeholder
 */
export function WeatherPlaceholder({ className }: { className?: string }) {
  return (
    <ComingSoonWidget
      title="Weather Forecast"
      description="Get weather forecasts for your destination during your trip dates."
      icon={CloudRain}
      variant="dark"
      className={className}
    />
  );
}
