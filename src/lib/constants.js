/**
 * Room status constants and their visual mappings.
 * Single source of truth for status colors across the app.
 */

export const ROOM_STATUS = {
  available: {
    label: 'Available',
    color: 'bg-emerald-500',
    colorLight: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  occupied: {
    label: 'Occupied',
    color: 'bg-rose-500',
    colorLight: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
    glow: 'shadow-rose-500/20',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'bg-amber-500',
    colorLight: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    glow: 'shadow-amber-500/20',
  },
};

export const ROOM_TYPES = ['standard', 'deluxe', 'suite', 'family'];

export const BOOKING_SOURCES = ['walk_in', 'web'];
