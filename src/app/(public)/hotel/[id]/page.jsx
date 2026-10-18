'use client';

import { useState, useEffect, Suspense, use } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

/**
 * STEP 4: NEXT.JS CUSTOMER BOOKING FLOW (B2C)
 * Route: /app/(public)/hotel/[id]/page.jsx
 * 
 * Features:
 * - Room selection from live PostgreSQL data
 * - Flight Number (Optional) and Expected Departure Time inputs
 * - Promotional banner: "Enter your flight details and the hotel will arrange a guaranteed wake-up call and shuttle timing."
 * - Automatic wake-up call computation (2 hours before flight)
 * - Pure ES6+ JavaScript, TailwindCSS, Express JSON API integration
 */
function HotelBookingContent() {
  const params = useParams();
  const router = useRouter();
  const hotelId = params?.id || process.env.NEXT_PUBLIC_DEMO_HOTEL_ID || 'a0000000-0000-0000-0000-000000000001';

  // Hotel & rooms state
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Booking form state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [flightDepartureTime, setFlightDepartureTime] = useState('');
  const [customWakeupTime, setCustomWakeupTime] = useState('');

  // Hydrate initial dates on client mount (prevents SSR Date mismatch)
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    setCheckInDate(today.toISOString().split('T')[0]);
    setCheckOutDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Fetch hotel and room data
  useEffect(() => {
    let isMounted = true;
    async function fetchHotel() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/hotels/${hotelId}`);
        if (isMounted && res?.data) {
          const hotelData = res.data;
          setHotel(hotelData);
          const roomList = hotelData.rooms || [];
          setRooms(roomList);
          // Auto-select first available room
          const firstAvailable = roomList.find((r) => (r.status || r.current_status) === 'available');
          if (firstAvailable) {
            setSelectedRoom(firstAvailable);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch hotel details:', err);
          setError(err.message || 'Unable to load hotel rooms. Please try again.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (hotelId) {
      fetchHotel();
    }

    return () => {
      isMounted = false;
    };
  }, [hotelId]);

  // Compute recommended wake-up call time (2 hours before flight departure)
  const computedWakeupTime = flightDepartureTime ? (() => {
    try {
      const dep = new Date(flightDepartureTime);
      if (isNaN(dep.getTime())) return null;
      const wakeup = new Date(dep.getTime() - 2 * 60 * 60 * 1000);
      return wakeup;
    } catch {
      return null;
    }
  })() : null;

  // Handle form submission to Express POST /api/bookings
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!selectedRoom) {
      setError('Please select an available room.');
      return;
    }
    if (!guestName.trim()) {
      setError('Please provide your name.');
      return;
    }
    if (!guestPhone.trim()) {
      setError('Please provide your contact phone number.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const roomPrice = Number(selectedRoom.price || selectedRoom.base_price || 0);

    const payload = {
      hotelId: hotel.id,
      roomId: selectedRoom.id,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      checkInDate,
      checkOutDate,
      bookingSource: 'online_b2c',
      totalAmount: roomPrice,
      flightNumber: flightNumber.trim() ? flightNumber.trim().toUpperCase() : null,
      flightDepartureTime: flightDepartureTime ? new Date(flightDepartureTime).toISOString() : null,
      wakeupCallTime: customWakeupTime 
        ? new Date(customWakeupTime).toISOString() 
        : (computedWakeupTime ? computedWakeupTime.toISOString() : null),
    };

    try {
      const response = await api.post('/bookings', payload);
      setBookingSuccess({
        booking: response.data || payload,
        room: selectedRoom,
        flightNumber: payload.flightNumber,
        departureTime: payload.flightDepartureTime,
        wakeupTime: payload.wakeupCallTime,
      });
    } catch (err) {
      console.error('Booking submission failed:', err);
      setError(err.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 text-sm">Loading transit hotel & room options...</p>
        </div>
      </div>
    );
  }

  // Booking Confirmation View
  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-surface-0 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-surface-1 border border-emerald-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-center text-white">Transit Stay Confirmed!</h2>
          <p className="text-zinc-400 text-center mt-1 text-sm">
            Your room has been reserved and your flight departure schedule is synced with the front desk.
          </p>

          <div className="mt-8 bg-surface-2/60 border border-surface-3 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-surface-3/50 pb-3">
              <span className="text-zinc-400 text-sm">Hotel</span>
              <span className="font-semibold text-white">{hotel?.name || 'Transit Hotel'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-surface-3/50 pb-3">
              <span className="text-zinc-400 text-sm">Room Number</span>
              <span className="font-bold text-brand-400">Room {bookingSuccess.room?.room_number} ({bookingSuccess.room?.type})</span>
            </div>
            <div className="flex justify-between items-center border-b border-surface-3/50 pb-3">
              <span className="text-zinc-400 text-sm">Guest</span>
              <span className="text-white">{guestName} ({guestPhone})</span>
            </div>

            {bookingSuccess.flightNumber && (
              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-lg p-3 space-y-2 mt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                    ✈️ Flight Number:
                  </span>
                  <span className="font-mono font-bold text-white bg-emerald-900/60 px-2 py-0.5 rounded">
                    {bookingSuccess.flightNumber}
                  </span>
                </div>
                {bookingSuccess.departureTime && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-300 font-medium">🛫 Departure Time:</span>
                    <span className="text-zinc-200">
                      {new Date(bookingSuccess.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(bookingSuccess.departureTime).toLocaleDateString()})
                    </span>
                  </div>
                )}
                {bookingSuccess.wakeupTime && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      ⏰ Guaranteed Wake-Up Call:
                    </span>
                    <span className="text-emerald-300 font-bold">
                      {new Date(bookingSuccess.wakeupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                {hotel?.shuttle_available && (
                  <p className="text-xs text-emerald-400/90 pt-1 border-t border-emerald-500/20">
                    🚐 Airport shuttle will be ready 90 minutes before your departure.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setBookingSuccess(null);
                setFlightNumber('');
                setFlightDepartureTime('');
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-surface-2 hover:bg-surface-3 text-zinc-200 text-sm font-medium transition"
            >
              Book Another Stay
            </button>
            <Link
              href="/hotels"
              className="flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-center text-sm font-semibold transition"
            >
              Browse All Hotels
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const availableRooms = rooms.filter((r) => (r.status || r.current_status) === 'available');

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      {/* Top Navbar */}
      <header className="border-b border-surface-2 bg-surface-1/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/hotels" className="flex items-center gap-2 text-zinc-300 hover:text-white transition">
            <span className="text-lg">←</span>
            <span className="text-sm font-medium">Back to Hotels</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-brand-500/10 text-brand-400 border border-brand-500/30 px-3 py-1 rounded-full font-medium">
              ✈️ Transit Hotel SaaS
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* REQUIRED STEP 4 BANNER */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-brand-600/30 via-emerald-600/20 to-brand-600/30 border border-brand-500/40 p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
            <span className="text-9xl">✈️</span>
          </div>
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-500/20 border border-brand-400/30 px-3 py-1 rounded-full text-brand-300 text-xs font-semibold uppercase tracking-wider mb-3">
              Guaranteed Transit Reliability
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {hotel?.name || 'Airport Transit Hotel'}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-emerald-300 font-medium leading-relaxed">
              &ldquo;Enter your flight details and the hotel will arrange a guaranteed wake-up call and shuttle timing.&rdquo;
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-300">
              {hotel?.shuttle_available ? (
                <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-md font-medium">
                  🚐 Free Airport Shuttle Available
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-zinc-400 bg-zinc-800/40 px-2.5 py-1 rounded-md">
                  📍 5 mins from International Terminal
                </span>
              )}
              <span className="flex items-center gap-1.5 text-brand-300 bg-brand-950/40 border border-brand-500/30 px-2.5 py-1 rounded-md font-medium">
                ⏰ Front Desk Automated Wake-Up System
              </span>
              {hotel?.location_url && (
                <a 
                  href={hotel.location_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-brand-400 underline hover:text-brand-300"
                >
                  View on Map
                </a>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white font-bold ml-4">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Booking Controls: 2 Columns on desktop */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. ROOM SELECTION */}
            <section className="bg-surface-1 border border-surface-2 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-600/30 border border-brand-500 text-brand-400 flex items-center justify-center text-xs">1</span>
                    Select Your Room
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Choose an available room for your layover stay</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-2 text-zinc-300">
                  {availableRooms.length} available
                </span>
              </div>

              {availableRooms.length === 0 ? (
                <div className="p-6 rounded-xl bg-surface-2/40 border border-surface-3 text-center text-zinc-400 text-sm">
                  No rooms currently available at this property.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableRooms.map((room) => {
                    const isSelected = selectedRoom?.id === room.id;
                    const price = room.price || room.base_price || 0;
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`cursor-pointer rounded-xl p-4 border transition-all ${
                          isSelected
                            ? 'bg-brand-950/30 border-brand-500 ring-2 ring-brand-500/20'
                            : 'bg-surface-2/50 border-surface-3 hover:border-zinc-500'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                              Room {room.room_number}
                            </span>
                            <h3 className="font-bold text-white text-base capitalize mt-0.5">
                              {room.type} Room
                            </h3>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-brand-400">
                              {formatCurrency(price)}
                            </span>
                            <span className="text-zinc-400 text-xs block">/ transit stay</span>
                          </div>
                        </div>

                        {room.facilities && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {(Array.isArray(room.facilities) 
                              ? room.facilities 
                              : String(room.facilities).split(',')
                            ).slice(0, 3).map((f, i) => (
                              <span key={i} className="text-[11px] bg-surface-3/70 text-zinc-300 px-2 py-0.5 rounded">
                                {f.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-surface-3/60 flex items-center justify-between text-xs">
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            ● Available Now
                          </span>
                          <span className={`font-semibold ${isSelected ? 'text-brand-400' : 'text-zinc-400'}`}>
                            {isSelected ? '✓ Selected' : 'Click to Select'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 2. FLIGHT SYNCHRONIZATION DETAILS (SPECIFIC REQUIREMENT) */}
            <section className="bg-surface-1 border border-brand-500/30 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600/30 border border-emerald-500 text-emerald-400 flex items-center justify-center text-xs font-bold">2</span>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Flight-Synced Schedule
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-normal">
                    Smart Sync
                  </span>
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mb-5">
                Our front desk uses your flight information to guarantee wake-up calls and shuttle coordination before your boarding gate opens.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Flight Number Input */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                    Flight Number (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-zinc-500 text-sm">✈️</span>
                    <input
                      type="text"
                      placeholder="e.g. BG 049, EK 585, QR 638"
                      value={flightNumber}
                      onChange={(e) => setFlightNumber(e.target.value)}
                      className="w-full bg-surface-2 border border-surface-3 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 uppercase"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Used by front desk to track any airline delays.
                  </p>
                </div>

                {/* Expected Departure Time Input */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                    Expected Departure Time
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={flightDepartureTime}
                      onChange={(e) => setFlightDepartureTime(e.target.value)}
                      className="w-full bg-surface-2 border border-surface-3 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 [color-scheme:dark]"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Your scheduled flight take-off time.
                  </p>
                </div>
              </div>

              {/* Dynamic Wake-Up Call & Shuttle Preview Banner */}
              {flightDepartureTime && (
                <div className="mt-5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-4 transition-all">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⏰</span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-emerald-300">
                          Guaranteed Wake-Up Call Scheduled
                        </h4>
                        <span className="text-xs bg-emerald-900/80 text-emerald-200 border border-emerald-700/50 px-2 py-0.5 rounded font-mono font-bold">
                          {computedWakeupTime 
                            ? computedWakeupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : '2 hours prior'
                          }
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                        The front desk will personally ring your room 2 hours prior to departure so you have ample time to prepare, check out, and board your shuttle.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 3. GUEST & STAY DETAILS */}
            <section className="bg-surface-1 border border-surface-2 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-brand-600/30 border border-brand-500 text-brand-400 flex items-center justify-center text-xs">3</span>
                <h2 className="text-lg font-bold text-white">Guest Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-surface-2 border border-surface-3 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +880 1712 345678"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-surface-2 border border-surface-3 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                    Check-In Date
                  </label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full bg-surface-2 border border-surface-3 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                    Check-Out Date
                  </label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full bg-surface-2 border border-surface-3 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 [color-scheme:dark]"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Summary & Checkout Card */}
          <div className="lg:col-span-1">
            <div className="bg-surface-1 border border-surface-2 rounded-2xl p-6 shadow-xl sticky top-24 space-y-6">
              <h3 className="text-base font-bold text-white border-b border-surface-3/60 pb-3 flex items-center justify-between">
                <span>Booking Summary</span>
                <span className="text-xs text-brand-400 font-semibold">Quick Booking</span>
              </h3>

              {/* Selected Room Pill */}
              {selectedRoom ? (
                <div className="bg-surface-2/60 border border-surface-3 rounded-xl p-3.5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">Selected Room</span>
                    <span className="font-bold text-white text-sm">Room {selectedRoom.room_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">Type</span>
                    <span className="text-xs text-brand-300 capitalize font-medium">{selectedRoom.type}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-amber-400 bg-amber-950/30 border border-amber-500/20 p-3 rounded-xl">
                  Please select a room to proceed.
                </div>
              )}

              {/* Flight Details Summary */}
              <div className="bg-surface-2/40 border border-surface-3/60 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Flight:</span>
                  <span className="font-mono font-bold text-white">
                    {flightNumber ? flightNumber.toUpperCase() : 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Departure:</span>
                  <span className="text-zinc-200">
                    {flightDepartureTime ? new Date(flightDepartureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Wake-Up Call:</span>
                  <span className="text-emerald-400 font-bold">
                    {computedWakeupTime 
                      ? computedWakeupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Sync on arrival'
                    }
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-surface-3/60 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Room Rate</span>
                  <span className="text-white font-medium">
                    {formatCurrency(selectedRoom?.price || selectedRoom?.base_price || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Flight Sync & Wakeup</span>
                  <span className="text-emerald-400 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Airport Shuttle</span>
                  <span className="text-emerald-400 font-medium">
                    {hotel?.shuttle_available ? 'FREE' : 'N/A'}
                  </span>
                </div>
                <div className="border-t border-surface-3/80 pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-white text-base">Total Due</span>
                  <span className="text-2xl font-black text-brand-400">
                    {formatCurrency(selectedRoom?.price || selectedRoom?.base_price || 0)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedRoom}
                className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-lg shadow-brand-600/30 transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Confirming Booking...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Transit Booking</span>
                    <span>→</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-zinc-500 text-center">
                Guaranteed front desk wake-up alert and shuttle timing. No credit card pre-charge required.
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function HotelBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-0 flex items-center justify-center text-zinc-400">
          Loading booking form...
        </div>
      }
    >
      <HotelBookingContent />
    </Suspense>
  );
}
