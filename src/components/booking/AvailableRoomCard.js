'use client';

import { formatCurrency } from '@/lib/utils';

/**
 * AvailableRoomCard — Public-facing room card for customer booking page.
 * Shows room type, price, and a Book Now CTA.
 */
export default function AvailableRoomCard({ room, onSelect }) {
  return (
    <div className="group relative flex flex-col bg-surface-2 border border-zinc-800 rounded-2xl overflow-hidden transition-all duration-200 hover:border-zinc-700 hover:shadow-lg hover:shadow-brand-500/5">
      {/* Room visual header */}
      <div className="h-28 bg-gradient-to-br from-brand-500/10 via-surface-2 to-emerald-500/5 flex items-center justify-center relative">
        <div className="text-4xl font-bold text-zinc-700 group-hover:text-zinc-600 transition-colors">
          {room.room_number}
        </div>
        {/* Available badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
          <span className="text-[10px] font-medium text-emerald-400">Available</span>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-zinc-200 capitalize">{room.type}</span>
          <div className="text-right">
            <span className="text-lg font-bold text-zinc-100">{formatCurrency(room.base_price)}</span>
            <span className="text-xs text-zinc-500 block">per night</span>
          </div>
        </div>

        {/* Features placeholder */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['AC', 'Wi-Fi', 'TV'].map((feat) => (
            <span key={feat} className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full">
              {feat}
            </span>
          ))}
        </div>

        <button
          onClick={() => onSelect(room)}
          className="mt-auto w-full py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-colors"
        >
          Book Now — Pay at Hotel
        </button>
      </div>
    </div>
  );
}
