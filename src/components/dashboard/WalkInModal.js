'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { formatCurrency, todayISO, tomorrowISO, calculateNights } from '@/lib/utils';

/**
 * WalkInModal — Speed-first form for logging a walk-in guest.
 * Auto-focuses the name field. Keyboard-submittable. 
 * Auto-calculates total from nights × base_price.
 */
export default function WalkInModal({ room, hotelId, onClose, onSuccess }) {
  const nameRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    guest_name: '',
    guest_phone: '',
    check_out_date: tomorrowISO(),
    total_amount: room.base_price,
  });

  // Auto-focus name field on mount for speed
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Recalculate total when checkout date changes
  useEffect(() => {
    const nights = calculateNights(todayISO(), form.check_out_date);
    setForm((prev) => ({
      ...prev,
      total_amount: nights * Number(room.base_price),
    }));
  }, [form.check_out_date, room.base_price]);

  const nights = calculateNights(todayISO(), form.check_out_date);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Attempt Express + PostgreSQL Walk-in API
      try {
        await api.post('/bookings/walk-in', {
          hotelId,
          roomId: room.id,
          guestName: form.guest_name.trim(),
          guestPhone: form.guest_phone.trim(),
          checkInDate: todayISO(),
          checkOutDate: form.check_out_date,
          bookingSource: 'walk_in',
          totalAmount: form.total_amount,
        });
        onSuccess();
        return;
      } catch (expressErr) {
        console.warn('Express walk-in fallback to Supabase:', expressErr.message);
      }

      // 2. Supabase Fallback
      const { error: insertErr } = await supabase.from('bookings').insert({
        hotel_id: hotelId,
        room_id: room.id,
        guest_name: form.guest_name.trim(),
        guest_phone: form.guest_phone.trim(),
        check_in_date: todayISO(),
        check_out_date: form.check_out_date,
        booking_source: 'walk_in',
        total_amount: form.total_amount,
      });

      if (insertErr) throw insertErr;

      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 modal-backdrop animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-2 border border-zinc-800 rounded-2xl shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">
              Walk-in — Room {room.room_number}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {room.type} · {formatCurrency(room.base_price)}/night
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Guest Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Guest Name *
            </label>
            <input
              ref={nameRef}
              name="guest_name"
              value={form.guest_name}
              onChange={handleChange}
              required
              placeholder="e.g. Karim Ahmed"
              className="w-full px-3.5 py-2.5 bg-surface-1 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
            />
          </div>

          {/* Guest Phone */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Phone Number *
            </label>
            <input
              name="guest_phone"
              value={form.guest_phone}
              onChange={handleChange}
              required
              type="tel"
              placeholder="+880 1XXX-XXXXXX"
              className="w-full px-3.5 py-2.5 bg-surface-1 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
            />
          </div>

          {/* Check-out Date */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Check-out Date *
            </label>
            <input
              name="check_out_date"
              value={form.check_out_date}
              onChange={handleChange}
              required
              type="date"
              min={tomorrowISO()}
              className="w-full px-3.5 py-2.5 bg-surface-1 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
            />
          </div>

          {/* Cash Summary */}
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <div>
              <p className="text-xs text-zinc-500">
                {nights} night{nights > 1 ? 's' : ''} × {formatCurrency(room.base_price)}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">Cash collected</p>
            </div>
            <span className="text-xl font-bold text-emerald-400">
              {formatCurrency(form.total_amount)}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Booking...
                </span>
              ) : (
                'Confirm & Check In'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
