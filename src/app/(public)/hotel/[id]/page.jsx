'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, todayISO, tomorrowISO, calculateNights } from '@/lib/utils';
import {
  MapPin,
  Phone,
  MessageCircle,
  Car,
  Clock,
  ShieldCheck,
  Check,
  CheckCircle2,
  Calendar,
  Plane,
  X,
  CreditCard,
  Building2,
  BedDouble,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
  Globe,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

// Fallback images
const FALLBACK_COVER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80';
const DEFAULT_ROOM_PHOTOS = [
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
];

function generateBookingRef(phone = '', name = '') {
  const cleanDigits = phone.replace(/\D/g, '').slice(-4) || '2026';
  const nameLen = String(name.length || 8);
  return `HK-${(cleanDigits + nameLen).padStart(6, '0').slice(0, 6)}`;
}

// ─── Moving Room Images Component (Auto-cycling Slideshow) ───────────────────
function RoomImageCarousel({ images = [], roomNumber }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  const photoList = useMemo(() => {
    let list = [];
    if (Array.isArray(images) && images.length > 0) {
      list = images.filter(Boolean);
    } else if (typeof images === 'string' && images.trim()) {
      list = images.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return list.length > 0 ? list : DEFAULT_ROOM_PHOTOS;
  }, [images]);

  // Animated continuous image slideshow (cycles every 3.2 seconds)
  useEffect(() => {
    if (photoList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % photoList.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [photoList.length]);

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-900 group">
      {photoList.map((imgUrl, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={idx}
          src={imgUrl}
          alt={`Room ${roomNumber} photo ${idx + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
            idx === currentIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
          }`}
          loading="lazy"
        />
      ))}

      {/* Subtle bottom gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

      {/* Manual previous / next arrows on hover */}
      {photoList.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIdx((prev) => (prev - 1 + photoList.length) % photoList.length);
            }}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-10"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIdx((prev) => (prev + 1) % photoList.length);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-10"
            aria-label="Next photo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Indicator dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {photoList.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIdx(i);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIdx ? 'w-6 bg-brand-400' : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Photo count indicator */}
      {photoList.length > 1 && (
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white border border-white/20">
          📷 {currentIdx + 1}/{photoList.length}
        </span>
      )}
    </div>
  );
}

// ─── Online Room Booking Modal ────────────────────────────────────────────────
function OnlineRoomBookingModal({ hotel, room, onClose, onSuccess }) {
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkInDate, setCheckInDate] = useState(todayISO());
  const [checkOutDate, setCheckOutDate] = useState(tomorrowISO());
  const [flightNumber, setFlightNumber] = useState('');
  const [flightDepartureTime, setFlightDepartureTime] = useState('');
  const [advanceConfirmed, setAdvanceConfirmed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bkash');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const nights = Math.max(1, calculateNights(checkInDate, checkOutDate));
  const roomPrice = Number(room?.price || room?.base_price || 0);
  const totalAmount = nights * roomPrice;

  const requiresAdvance = Boolean(room?.requires_advance);
  const advanceAmount = Number(room?.advance_amount || 0);

  // 2 hours prior wake-up call computation
  const computedWakeupTime = flightDepartureTime ? (() => {
    try {
      const dep = new Date(flightDepartureTime);
      if (isNaN(dep.getTime())) return null;
      return new Date(dep.getTime() - 2 * 60 * 60 * 1000);
    } catch {
      return null;
    }
  })() : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!guestPhone.trim()) {
      setError('Please provide your active phone or WhatsApp number.');
      return;
    }
    if (requiresAdvance && !advanceConfirmed) {
      setError(`This room requires an advance payment of ৳${advanceAmount}. Please confirm your advance payment.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      hotelId: hotel.id,
      roomId: room.id,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      guestEmail: guestEmail.trim() || null,
      checkInDate,
      checkOutDate,
      bookingSource: 'online', // Registered as an online booking!
      totalAmount,
      advanceRequired: requiresAdvance,
      advancePaid: requiresAdvance ? advanceAmount : 0,
      flightNumber: flightNumber.trim() ? flightNumber.trim().toUpperCase() : null,
      flightDepartureTime: flightDepartureTime ? new Date(flightDepartureTime).toISOString() : null,
      wakeupCallTime: computedWakeupTime ? computedWakeupTime.toISOString() : null,
    };

    try {
      const res = await api.post('/bookings', payload);
      const bookingData = res.data || payload;
      setConfirmation({
        ...bookingData,
        id: bookingData.id || generateBookingRef(guestPhone, guestName),
        room,
        hotel,
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Online booking error:', err);
      setError(err.message || 'Failed to submit online booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-surface-1 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-2 hover:bg-surface-3 text-zinc-400 hover:text-white flex items-center justify-center transition-colors z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ═══════ CONFIRMATION SCREEN ═══════ */}
        {confirmation ? (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5" />
                <span>Online Booking Registered</span>
              </span>
              <h2 className="text-2xl font-black text-white mt-2">Reservation Confirmed!</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Your online reservation for Room {room.room_number} ({room.type}) at {hotel.name} has been placed in the hotel front-desk system.
              </p>
            </div>

            {/* Voucher Card */}
            <div className="p-5 rounded-2xl bg-surface-2/60 border border-zinc-800 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800">
                <span className="text-zinc-400">Booking Reference</span>
                <span className="font-mono font-black text-brand-400">#{confirmation.id}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800">
                <span className="text-zinc-400">Hotel Property</span>
                <span className="font-bold text-white">{hotel.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800">
                <span className="text-zinc-400">Reserved Room</span>
                <span className="font-bold text-brand-300">Room {room.room_number} ({room.type})</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800">
                <span className="text-zinc-400">Dates</span>
                <span className="text-zinc-200">
                  {formatDate(checkInDate)} → {formatDate(checkOutDate)} ({nights} {nights === 1 ? 'night' : 'nights'})
                </span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800">
                <span className="text-zinc-400">Guest Name</span>
                <span className="font-bold text-white">{guestName} ({guestPhone})</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800">
                <span className="text-zinc-400">Advance Payment</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{requiresAdvance ? `৳${advanceAmount} Paid Online` : 'Zero Advance (100% Pay at Hotel)'}</span>
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 text-sm">
                <span className="font-bold text-white">Total Amount</span>
                <span className="text-lg font-black text-brand-400">{formatCurrency(totalAmount)}</span>
              </div>

              {confirmation.flightNumber && (
                <div className="mt-3 p-3 rounded-xl bg-brand-950/40 border border-brand-500/30 text-brand-200 space-y-1">
                  <div className="flex justify-between font-bold items-center">
                    <span className="flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5 text-brand-400" />
                      <span>Synced Flight: {confirmation.flightNumber}</span>
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-brand-300">Front Desk Alerted</span>
                  </div>
                  {computedWakeupTime && (
                    <div className="text-emerald-400 font-semibold flex items-center gap-1.5 text-[11px] pt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Guaranteed Wake-Up Call: {computedWakeupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Direct Contact Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/${hotel.whatsapp}?text=${encodeURIComponent(
                  `Hello Front Desk of ${hotel.name}, I just confirmed online booking #${confirmation.id} for Room ${room.room_number}. Please confirm reception.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with Front Desk on WhatsApp</span>
              </a>

              <a
                href={`tel:${hotel.phone}`}
                className="py-3 px-4 rounded-xl bg-surface-2 hover:bg-surface-3 text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 border border-zinc-700 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Call Desk</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ═══════ BOOKING FORM ═══════ */
          <div>
            <div className="border-b border-zinc-800 pb-4 mb-5">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-[10px] font-bold uppercase tracking-wider">
                Online Reservation
              </span>
              <h2 className="text-xl font-black text-white mt-1">
                Book Room {room.room_number} • {room.type}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">{hotel.name} • {hotel.address}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Room & Price Pill */}
              <div className="p-3.5 rounded-2xl bg-surface-2/60 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Nightly Rate</span>
                  <span className="text-base font-black text-white block">{formatCurrency(roomPrice)} / night</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Estimated Total ({nights} night)</span>
                  <span className="text-base font-black text-brand-400 block">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {/* Advance Payment Policy Notice & Actions */}
              <div className={`p-4 rounded-2xl border ${
                requiresAdvance
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              }`}>
                {requiresAdvance ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-amber-300">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span>Advance Payment Required by Owner</span>
                      </span>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ৳{advanceAmount} Advance
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      The hotel owner requires ৳{advanceAmount} advance payment to guarantee and hold Room {room.room_number}. The remaining balance (৳{totalAmount - advanceAmount}) is paid upon arrival.
                    </p>

                    <div className="pt-2 border-t border-amber-500/20 space-y-2">
                      <label className="text-[11px] font-bold block text-zinc-300">Select Advance Payment Method:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['bkash', 'nagad', 'card'].map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border capitalize transition-all ${
                              paymentMethod === method
                                ? 'bg-amber-500 text-black border-amber-400 font-black shadow-md'
                                : 'bg-surface-2 border-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {method === 'bkash' ? 'bKash' : method === 'nagad' ? 'Nagad' : 'Card'}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="advanceCheck"
                          checked={advanceConfirmed}
                          onChange={(e) => setAdvanceConfirmed(e.target.checked)}
                          className="w-4 h-4 rounded border-zinc-700 text-brand-500 focus:ring-brand-500 accent-brand-500"
                        />
                        <label htmlFor="advanceCheck" className="text-xs font-bold text-white cursor-pointer">
                          I confirm paying ৳{advanceAmount} advance via {paymentMethod.toUpperCase()}
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-emerald-300 block">
                        Zero Advance Required • 100% Pay at Hotel
                      </span>
                      <span className="text-[11px] text-zinc-400 block mt-0.5">
                        This room allows instant reservation without any upfront advance deposit. Pay when you arrive at the front desk.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Guest Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suman Roy"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Phone / WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+880 1700-000000"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Check-in Date</label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-xs focus:border-brand-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Check-out Date</label>
                  <input
                    type="date"
                    required
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-xs focus:border-brand-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Transit Flight Sync (Optional) */}
              <div className="p-3.5 rounded-2xl bg-surface-2/40 border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-brand-400" />
                    <span>Transit Flight Sync (Optional)</span>
                  </span>
                  <span className="text-[10px] text-brand-400 font-semibold">
                    Guaranteed 2-Hour Pre-Flight Wake-Up
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Flight Number (e.g. BG 027)"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-zinc-700 text-white text-xs uppercase"
                  />
                  <input
                    type="datetime-local"
                    value={flightDepartureTime}
                    onChange={(e) => setFlightDepartureTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-zinc-700 text-white text-xs [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Confirming Online Booking...</span>
                    </>
                  ) : (
                    <span>Confirm Online Reservation →</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Customer Hotel Details Page Component ───────────────────────────────
function HotelDetailsContent() {
  const params = useParams();
  const hotelId = params?.id;

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2-Tab Layout State: 'info' (Hotel Information) or 'rooms' (Rooms)
  const [activeTab, setActiveTab] = useState('info');

  // Booking Modal State
  const [bookingModal, setBookingModal] = useState({ open: false, room: null });

  // Fetch hotel and room data
  useEffect(() => {
    let isMounted = true;
    async function loadHotel() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/hotels/${hotelId}`);
        if (isMounted && res?.data) {
          setHotel(res.data);
          setRooms(res.data.rooms || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load hotel:', err);
          setError(err.message || 'Unable to load hotel details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (hotelId) {
      loadHotel();
    }
    return () => {
      isMounted = false;
    };
  }, [hotelId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-xs font-semibold">Loading hotel details & rooms...</p>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-surface-0 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-1 border border-zinc-800 rounded-3xl p-8 text-center space-y-4">
          <Building2 className="w-12 h-12 text-zinc-600 mx-auto" />
          <h2 className="text-xl font-bold text-white">Hotel Not Found</h2>
          <p className="text-xs text-zinc-400">{error || 'The requested hotel could not be loaded.'}</p>
          <Link
            href="/hotels"
            className="inline-block py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors"
          >
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const coverImage = hotel.cover_image_url || FALLBACK_COVER;
  const amenitiesList = Array.isArray(hotel.amenities) && hotel.amenities.length > 0
    ? hotel.amenities
    : ['Free 24/7 Airport Shuttle', 'Air Conditioning', 'Free High-Speed Wi-Fi', '24/7 Generator Backup', 'Geyser / Hot Water'];

  const availableRooms = rooms.filter((r) => (r.status || r.current_status) === 'available');

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800 bg-surface-1/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/hotels"
            className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Hotels</span>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${hotel.phone || '+8801711000111'}`}
              className="py-1.5 px-3 rounded-xl bg-surface-2 hover:bg-surface-3 border border-zinc-750 text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-zinc-400" />
              <span>Call Reception</span>
            </a>

            <a
              href={`https://wa.me/${hotel.whatsapp || '8801711000111'}?text=${encodeURIComponent(
                `Hello, I would like to inquire about rooms at ${hotel.name} via Hotel Khuji.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ══════════════════════════════════════════════════════════
            TWO-TAB BAR: 1. Hotel Information  2. Rooms
           ══════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 px-6 rounded-2xl text-sm font-black transition-all flex items-center gap-2.5 ${
              activeTab === 'info'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 ring-2 ring-brand-500/30'
                : 'bg-surface-1 hover:bg-surface-2 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. Hotel Information</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rooms')}
            className={`py-3 px-6 rounded-2xl text-sm font-black transition-all flex items-center gap-2.5 ${
              activeTab === 'rooms'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 ring-2 ring-brand-500/30'
                : 'bg-surface-1 hover:bg-surface-2 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <BedDouble className="w-4 h-4" />
            <span>2. Rooms</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'rooms' ? 'bg-white/20 text-white' : 'bg-surface-2 text-brand-400'
            }`}>
              {availableRooms.length} Available
            </span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
            TAB 1: HOTEL INFORMATION
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'info' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* HERO COVER IMAGE BANNER */}
            <div className="relative aspect-[21/9] sm:aspect-[24/9] rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage}
                alt={hotel.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

              <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-brand-600/80 backdrop-blur-md text-white text-[11px] font-extrabold uppercase tracking-wider">
                      Verified Transit Hotel
                    </span>
                    {hotel.shuttle_available && (
                      <span className="px-3 py-1 rounded-full bg-emerald-600/80 backdrop-blur-md text-white text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                        <Car className="w-3.5 h-3.5" />
                        Free Airport Shuttle
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                    {hotel.name}
                  </h1>
                  <p className="text-zinc-300 text-xs sm:text-sm mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                    <span>{hotel.address}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('rooms')}
                  className="py-3 px-6 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-brand-600/30 transition-all flex items-center gap-2 self-start sm:self-auto shrink-0"
                >
                  <span>View Available Rooms ({availableRooms.length})</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Grid: Description & Amenities vs Contact Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left 2 Columns: Description & Services */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                <div className="p-6 sm:p-8 rounded-3xl bg-surface-1 border border-zinc-800 shadow-xl space-y-4">
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-brand-400" />
                    <span>About the Hotel</span>
                  </h2>
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                    {hotel.description || 'Welcome to this premier transit accommodation near Hazrat Shahjalal International Airport (DAC). Perfectly tailored for transit travelers, providing clean rooms, seamless wake-up services, and airport shuttle facilities.'}
                  </p>

                  {hotel.location_url && (
                    <div className="pt-2">
                      <a
                        href={hotel.location_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 underline underline-offset-4"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>View exact location on Google Maps →</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Services & Amenities */}
                <div className="p-6 sm:p-8 rounded-3xl bg-surface-1 border border-zinc-800 shadow-xl space-y-4">
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-400" />
                    <span>Hotel Services & Special Facilities</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {amenitiesList.map((amenity, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-surface-2/60 border border-zinc-750 flex items-center gap-3"
                      >
                        <span className="w-7 h-7 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 flex items-center justify-center text-xs font-bold">
                          ✓
                        </span>
                        <span className="text-xs font-bold text-zinc-200">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Direct Contact & Location Card */}
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-surface-1 border border-zinc-800 shadow-xl space-y-5">
                  <h3 className="text-base font-black text-white">Direct Reception Contact</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Have flight schedule queries or need urgent airport pickup? Reach the front desk instantly:
                  </p>

                  <div className="space-y-2.5">
                    <a
                      href={`https://wa.me/${hotel.whatsapp || '8801711000111'}?text=${encodeURIComponent(
                        `Hello Front Desk of ${hotel.name}, I found your hotel on Hotel Khuji and would like to inquire about booking.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat on WhatsApp: {hotel.whatsapp || '+880 1711-000111'}</span>
                    </a>

                    <a
                      href={`tel:${hotel.phone || '+8801711000111'}`}
                      className="w-full py-3.5 px-4 rounded-2xl bg-surface-2 hover:bg-surface-3 border border-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                    >
                      <Phone className="w-4 h-4 text-brand-400" />
                      <span>Direct Phone: {hotel.phone || '+880 1711-000111'}</span>
                    </a>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-2/40 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-brand-300">
                      <Clock className="w-4 h-4 text-brand-400" />
                      <span>24/7 Front Desk Active</span>
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Front desk staff is available 24 hours to accommodate late-night and early-morning transit arrivals.
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-brand-950/20 border border-brand-500/30 shadow-xl space-y-3">
                  <span className="text-xs font-black text-brand-400 uppercase tracking-wider block">
                    Fast Room Booking
                  </span>
                  <h4 className="text-base font-bold text-white">Ready to choose your room?</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Check out our live room inventory with animated photos and instant online reservations.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('rooms')}
                    className="w-full py-3 px-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-black uppercase tracking-wider shadow-lg transition-all"
                  >
                    Go to Rooms Tab →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: ROOMS (WITH MOVING ROOM IMAGES & ADVANCE POLICY)
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'rooms' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Available Rooms at {hotel.name}</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Choose a room category. Room photos keep moving automatically. Advance payment policies are clearly displayed.
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-surface-1 border border-zinc-800 text-brand-400 self-start sm:self-auto">
                {availableRooms.length} Rooms Ready for Booking
              </span>
            </div>

            {rooms.length === 0 ? (
              <div className="p-16 text-center bg-surface-1 border border-zinc-800 rounded-3xl space-y-3">
                <BedDouble className="w-12 h-12 text-zinc-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No Rooms Currently Listed</h3>
                <p className="text-xs text-zinc-400">The hotel owner has not added rooms to this property yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => {
                  const facilities = Array.isArray(room.facilities)
                    ? room.facilities
                    : typeof room.facilities === 'string'
                    ? room.facilities.split(',').map((s) => s.trim()).filter(Boolean)
                    : ['AC', 'Free Wi-Fi', 'Attached Bath'];

                  const price = Number(room.price || room.base_price || 0);
                  const isAvailable = (room.status || room.current_status) === 'available';
                  const requiresAdvance = Boolean(room.requires_advance);
                  const advanceAmount = Number(room.advance_amount || 0);

                  return (
                    <div
                      key={room.id}
                      className="bg-surface-1 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-brand-500/50 transition-all duration-300"
                    >
                      <div>
                        {/* ─── MOVING ROOM IMAGES (Auto-cycling Slideshow) ─── */}
                        <div className="relative p-2.5 pb-0">
                          <RoomImageCarousel images={room.image_urls} roomNumber={room.room_number} />

                          {/* Room Number Badge */}
                          <div className="absolute top-5 left-5 z-20">
                            <span className="px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md text-white text-xs font-black border border-white/20">
                              Room {room.room_number}
                            </span>
                          </div>
                        </div>

                        {/* Room Info */}
                        <div className="p-5 space-y-3.5">
                          {/* Title & Price */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-400">
                                {room.type || 'Standard Room'}
                              </span>
                              <h3 className="text-lg font-black text-white leading-snug">
                                {room.type} Room
                              </h3>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xl font-black text-white block">
                                {formatCurrency(price)}
                              </span>
                              <span className="text-[10px] text-zinc-400 block">/ night</span>
                            </div>
                          </div>

                          {/* ADVANCE MONEY REQUIREMENT POLICY BADGE */}
                          <div className="pt-1">
                            {requiresAdvance ? (
                              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>Advance Required</span>
                                </span>
                                <span className="text-xs font-black text-amber-200">
                                  ৳{advanceAmount}
                                </span>
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span>Zero Advance</span>
                                </span>
                                <span className="text-[11px] font-semibold text-emerald-300">
                                  100% Pay at Hotel
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Special Services / Facilities Chips */}
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                              Special Services Included:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {facilities.map((fac, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-surface-2 border border-zinc-750 text-zinc-300 flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3 text-brand-400" />
                                  <span>{fac}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Action: Book Button */}
                      <div className="p-5 pt-0">
                        {isAvailable ? (
                          <button
                            type="button"
                            onClick={() => setBookingModal({ open: true, room })}
                            className="w-full py-3 px-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <span>Book Room {room.room_number}</span>
                            <span>→</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="w-full py-3 px-4 rounded-2xl bg-surface-2 text-zinc-500 font-bold text-xs uppercase tracking-wider cursor-not-allowed border border-zinc-800"
                          >
                            Currently Occupied
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Online Room Booking Modal */}
      {bookingModal.open && bookingModal.room && (
        <OnlineRoomBookingModal
          hotel={hotel}
          room={bookingModal.room}
          onClose={() => setBookingModal({ open: false, room: null })}
          onSuccess={() => {
            // refresh data
            api.get(`/hotels/${hotelId}`).then((res) => {
              if (res?.data) {
                setHotel(res.data);
                setRooms(res.data.rooms || []);
              }
            });
          }}
        />
      )}
    </div>
  );
}

export default function HotelDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-0 flex items-center justify-center text-zinc-400">
          Loading hotel details...
        </div>
      }
    >
      <HotelDetailsContent />
    </Suspense>
  );
}
