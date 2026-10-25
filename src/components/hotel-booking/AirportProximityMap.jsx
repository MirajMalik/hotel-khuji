'use client';

import { useState } from 'react';
import { Plane, MapPin, Navigation, Star, X, ArrowRight, Car } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AirportProximityMap({ hotels, onSelectHotel, currencySymbol = '৳', isBn }) {
  const [activeHotel, setActiveHotel] = useState(hotels[0] || null);

  const landmarks = [
    { name: 'DAC Terminal 3 (International)', x: '52%', y: '42%', type: 'terminal', icon: Plane },
    { name: 'Terminal 1 & 2 (Departures)', x: '38%', y: '30%', type: 'terminal', icon: Plane },
    { name: 'Airport Runway 14L/32R', x: '45%', y: '50%', type: 'runway' },
    { name: 'Airport Railway Station', x: '25%', y: '68%', type: 'rail' },
    { name: 'Ashkona Transit Zone', x: '65%', y: '55%', type: 'zone' },
    { name: 'Uttara Sector 1 & 3', x: '28%', y: '22%', type: 'zone' },
  ];

  const hotelPins = hotels.map((h, i) => {
    const coords = [
      { x: '62%', y: '50%' }, // Ashkona Transit Grand
      { x: '32%', y: '28%' }, // Dhaka Airport Transit Inn
      { x: '68%', y: '60%' }, // Platinum Residence Ashkona
      { x: '24%', y: '62%' }, // Airport Sleeping Pods
      { x: '26%', y: '18%' }, // Uttara Sky Executive
    ];
    return {
      hotel: h,
      pos: coords[i % coords.length],
    };
  });

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xl mb-8">
      {/* Map Header */}
      <div className="p-4 sm:p-5 bg-gray-50 dark:bg-[#0f172a] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            <span>
              {isBn
                ? 'ঢাকা বিমানবন্দর (DAC) হোটেল অবস্থান ও টার্মিনাল দূরত্ব'
                : 'Dhaka Airport (DAC) Hotel Locations & Terminal Distances'}
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Click any hotel price pin to inspect terminal proximity and walking/shuttle minutes.
          </p>
        </div>
      </div>

      {/* Visual Runway Canvas */}
      <div className="relative w-full h-[450px] sm:h-[500px] bg-[#090e1a] overflow-hidden select-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />

        {/* Runway Graphic */}
        <div
          className="absolute w-72 sm:w-96 h-12 bg-zinc-800 border-2 border-dashed border-amber-400/70 rounded-md -rotate-45 flex items-center justify-around text-[10px] font-mono text-zinc-400 pointer-events-none"
          style={{ left: '30%', top: '35%' }}
        >
          <span className="text-amber-400 font-bold">14L</span>
          <span className="tracking-widest hidden sm:inline">DAC MAIN RUNWAY</span>
          <span className="text-amber-400 font-bold">32R</span>
        </div>

        {/* Airport Highway Line */}
        <div
          className="absolute w-[500px] h-3 bg-amber-500/20 -rotate-12 border-t border-b border-amber-500/40 pointer-events-none"
          style={{ left: '10%', top: '65%' }}
        >
          <span className="absolute -top-4 left-1/3 text-[9px] font-mono text-amber-400">
            Airport Highway (Elevated Expressway)
          </span>
        </div>

        {/* Landmarks */}
        {landmarks.map((lm, idx) => (
          <div
            key={idx}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{ left: lm.x, top: lm.y }}
          >
            {lm.type === 'terminal' ? (
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 ring-2 ring-blue-300">
                  <Plane className="w-5 h-5 -rotate-45" />
                </div>
                <span className="mt-1 px-2 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-bold whitespace-nowrap shadow-md">
                  {lm.name}
                </span>
              </div>
            ) : lm.type === 'zone' ? (
              <div className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold">
                📍 {lm.name}
              </div>
            ) : null}
          </div>
        ))}

        {/* Hotel Price Pins */}
        {hotelPins.map(({ hotel, pos }, idx) => {
          const isSelected = activeHotel?.id === hotel.id;
          const price = Number(hotel.base_price || 2800);

          return (
            <div
              key={hotel.id || idx}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
              style={{ left: pos.x, top: pos.y }}
              onClick={() => setActiveHotel(hotel)}
            >
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-xs shadow-2xl transition-all duration-200 ${
                  isSelected
                    ? 'bg-rose-600 text-white scale-110 ring-4 ring-rose-400/50 z-30'
                    : 'bg-white text-blue-600 hover:scale-105 border border-blue-500'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 fill-current" />
                <span>
                  {currencySymbol} {price.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}

        {/* Active Hotel Preview Card */}
        {activeHotel && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 bg-white dark:bg-[#1e293b] rounded-2xl p-4 shadow-2xl border border-gray-200 dark:border-gray-700 z-30 animate-in fade-in slide-in-from-bottom-2">
            <button
              onClick={() => setActiveHotel(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex gap-3">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    activeHotel.cover_image_url ||
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={activeHotel.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {activeHotel.distanceToAirport || '650m to Terminal 3'}
                </span>
                <h4 className="text-sm font-black text-gray-900 dark:text-white truncate mt-1">
                  {activeHotel.name}
                </h4>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-amber-500">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span className="font-bold">{activeHotel.rating || 9.1}</span>
                  <span className="text-gray-400 text-[10px]">({activeHotel.reviewCount || 480})</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-base font-black text-blue-600 dark:text-blue-400">
                    {currencySymbol} {Number(activeHotel.base_price || 2800).toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectHotel(activeHotel)}
                    className="py-1 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                  >
                    <span>Book</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
