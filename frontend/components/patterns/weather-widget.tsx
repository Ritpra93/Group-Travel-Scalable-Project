/**
 * WeatherWidget Component
 * Dark gradient weather widget with forecast
 */

import { CloudRain } from 'lucide-react';

export interface WeatherWidgetProps {
  current: {
    condition: string;
    description: string;
  };
  forecast: Array<{
    day: string;
    temp: string;
  }>;
}

export function WeatherWidget({ current, forecast }: WeatherWidgetProps) {
  return (
    <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl shadow-lg text-white p-6 relative overflow-hidden">
      {/* Background icon */}
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <CloudRain className="w-16 h-16" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1">
          Forecast
        </p>
        <div className="flex items-baseline gap-2 mb-4">
          <h3 className="text-3xl font-light">{current.condition}</h3>
          <span className="text-zinc-400 text-sm">{current.description}</span>
        </div>

        {/* 4-day forecast */}
        <div className="flex justify-between text-xs text-zinc-400 border-t border-white/10 pt-3">
          {forecast.map((day, idx) => (
            <div key={idx} className="text-center">
              <span className="block mb-1">{day.day}</span>
              <span className="text-white">{day.temp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
