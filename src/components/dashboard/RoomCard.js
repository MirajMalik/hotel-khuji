'use client';

import { useState } from 'react';
import { ROOM_STATUS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

/**
 * RoomCard — A single room tile in the front desk grid.
 * Color-coded by status. Clickable when available.
 */
export default function RoomCard({ room, onBookWalkIn }) {
  const status = ROOM_STATUS[room.current_status] || ROOM_STATUS.available;
  const isAvailable = room.current_status === 'available';

  return (
    <button
      onClick={() => isAvailable && onBookWalkIn(room)}
      disabled={!isAvailable}
      className={`
        group relative flex flex-col justify-between
        rounded-xl border p-4
        transition-all duration-200 ease-out
        ${status.border} ${status.colorLight}
        ${isAvailable
          ? 'cursor-pointer hover:scale-[1.03] hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98]'
          : 'cursor-default opacity-80'
        }
      `}
    >
      {/* Status dot */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${status.dot} ${isAvailable ? 'animate-pulse-dot' : ''}`} />
        <span className={`text-[10px] font-semibold uppercase tracking-widest ${status.text}`}>
          {status.label}
        </span>
      </div>

      {/* Room number */}
      <div className="text-2xl font-bold text-zinc-100 mb-1">
        {room.room_number}
      </div>

      {/* Type & Price */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-zinc-500 capitalize">{room.type}</span>
        <span className="text-sm font-semibold text-zinc-300">
          {formatCurrency(room.base_price)}
          <span className="text-zinc-600 text-[10px]">/night</span>
        </span>
      </div>

      {/* Hover hint for available rooms */}
      {isAvailable && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/20 px-3 py-1.5 rounded-full">
            + Walk-in
          </span>
        </div>
      )}
    </button>
  );
}
