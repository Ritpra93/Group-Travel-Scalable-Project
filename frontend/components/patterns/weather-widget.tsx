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
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <CloudRain className="w-20 h-20" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
          Forecast
        </p>
        <div className="mb-6">
          <h3 className="text-3xl font-light mb-1">{current.condition}</h3>
          <span className="text-zinc-400 text-sm">{current.description}</span>
        </div>

        {/* 4-day forecast */}
        <div className="grid grid-cols-4 gap-3 border-t border-white/10 pt-4">
          {forecast.map((day, idx) => (
            <div key={idx} className="text-center">
              <span className="block text-xs text-zinc-400 mb-2">{day.day}</span>
              <span className="text-white text-sm font-medium">{day.temp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
