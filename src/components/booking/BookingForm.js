'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { formatCurrency, tomorrowISO, calculateNights } from '@/lib/utils';

/**
 * BookingForm — Customer-facing reservation form.
 * Mobile-first. Pay at Hotel model (no upfront payment).
 */
export default function BookingForm({ room, hotelId, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    guest_name: '',
    guest_phone: '',
    check_in_date: '',
    check_out_date: '',
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      check_in_date: prev.check_in_date || new Date().toISOString().split('T')[0],
      check_out_date: prev.check_out_date || tomorrowISO(),
    }));
  }, []);

  const nights = form.check_in_date && form.check_out_date
    ? calculateNights(form.check_in_date, form.check_out_date)
    : 1;
  const totalAmount = nights * Number(room.base_price);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Attempt Express + PostgreSQL booking endpoint
      try {
        await api.post('/bookings', {
          hotelId,
          roomId: room.id,
          guestName: form.guest_name.trim(),
          guestPhone: form.guest_phone.trim(),
          checkInDate: form.check_in_date,
          checkOutDate: form.check_out_date,
          bookingSource: 'web',
          totalAmount,
        });
        onSuccess();
        return;
      } catch (expressErr) {
        console.warn('Express booking fallback to Supabase:', expressErr.message);
      }

      // 2. Supabase Fallback
      const { error: insertErr } = await supabase.from('bookings').insert({
        hotel_id: hotelId,
        room_id: room.id,
        guest_name: form.guest_name.trim(),
        guest_phone: form.guest_phone.trim(),
        check_in_date: form.check_in_date,
        check_out_date: form.check_out_date,
        booking_source: 'web',
        total_amount: totalAmount,
      });

      if (insertErr) throw insertErr;
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to reserve room');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 modal-backdrop animate-fade-in">
      <div
        className="w-full max-w-lg bg-surface-2 border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 bg-surface-2 border-b border-zinc-800 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">
              Reserve Room {room.room_number}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5 capitalize">
              {room.type} · {formatCurrency(room.base_price)}/night
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Your Name</label>
            <input
              name="guest_name"
              value={form.guest_name}
              onChange={handleChange}
              required
              placeholder="Full name"
              className="w-full px-4 py-3 bg-surface-1 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Phone Number</label>
            <input
              name="guest_phone"
              value={form.guest_phone}
              onChange={handleChange}
              required
              type="tel"
              placeholder="+880 1XXX-XXXXXX"
              className="w-full px-4 py-3 bg-surface-1 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Check-in</label>
              <input
                name="check_in_date"
                value={form.check_in_date}
                onChange={handleChange}
                required
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-surface-1 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Check-out</label>
              <input
                name="check_out_date"
                value={form.check_out_date}
                onChange={handleChange}
                required
                type="date"
                min={tomorrowISO()}
                className="w-full px-4 py-3 bg-surface-1 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
              />
            </div>
          </div>

          {/* Price summary */}
          <div className="p-4 bg-brand-500/5 border border-brand-500/20 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">
                {nights} night{nights > 1 ? 's' : ''} × {formatCurrency(room.base_price)}
              </span>
              <span className="text-zinc-200 font-medium">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-zinc-800">
              <span className="text-zinc-300 font-semibold">Pay at Hotel</span>
              <span className="text-xl font-bold text-brand-500">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Pay at hotel badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span className="text-xs text-amber-400">No online payment required. Pay cash or card at the hotel.</span>
          </div>

          {error && (
            <div className="px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50 rounded-xl transition-colors"
          >
            {loading ? 'Reserving...' : 'Reserve Now — Pay at Hotel'}
          </button>
        </form>
      </div>
    </div>
  );
}
