'use client';

import { ROOM_STATUS } from '@/lib/constants';

/**
 * StatusBar — Shows live counts of rooms by status.
 * Sits at the top of the front desk view.
 */
export default function StatusBar({ rooms }) {
  const counts = {
    available: rooms.filter((r) => r.current_status === 'available').length,
    occupied: rooms.filter((r) => r.current_status === 'occupied').length,
    maintenance: rooms.filter((r) => r.current_status === 'maintenance').length,
  };

  const total = rooms.length;
  const occupancy = total > 0 ? Math.round((counts.occupied / total) * 100) : 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Occupancy badge */}
      <div className="flex items-center gap-2 px-4 py-2 bg-surface-2 border border-zinc-800 rounded-xl">
        <span className="text-xs text-zinc-500 font-medium">Occupancy</span>
        <span className="text-sm font-bold text-zinc-100">{occupancy}%</span>
        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${occupancy}%` }}
          />
        </div>
      </div>

      {/* Status counts */}
      {Object.entries(counts).map(([status, count]) => {
        const meta = ROOM_STATUS[status];
        return (
          <div
            key={status}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${meta.border} ${meta.colorLight}`}
          >
            <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
            <span className={`text-xs font-medium ${meta.text}`}>
              {count} {meta.label}
            </span>
          </div>
        );
      })}

      {/* Total */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-2 border border-zinc-800 rounded-xl">
        <span className="text-xs text-zinc-500">Total</span>
        <span className="text-sm font-bold text-zinc-300">{total}</span>
      </div>
    </div>
  );
}
