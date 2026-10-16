'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { supabase } from '@/lib/supabase';
import { useHotelStore } from '@/lib/store';
import { formatCurrency, todayISO, tomorrowISO } from '@/lib/utils';
import Link from 'next/link';

// Curated high-resolution fallback photos for transit hotel room tiers
const FALLBACK_ROOM_IMAGES = {
  standard: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=80',
  deluxe: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
  suite: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
  family: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80',
  pod: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80',
  default: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
};

// Facility icons mapping
const FACILITY_ICONS = {
  ac: '❄️',
  wifi: '📶',
  tv: '📺',
  bed: '🛏️',
  bath: '🚿',
  shower: '🚿',
  desk: '💼',
  soundproof: '🔇',
  shuttle: '🚐',
  breakfast: '☕',
  default: '✨',
};

function getFacilityIcon(name = '') {
  const lower = name.toLowerCase();
  for (const key of Object.keys(FACILITY_ICONS)) {
    if (lower.includes(key)) return FACILITY_ICONS[key];
  }
  return FACILITY_ICONS.default;
}

export default function CounterViewPage() {
  const {
    hotel,
    rooms,
    setHotel,
    setRooms,
    bookWalkIn,
    isBookingLoading,
    notification,
    clearNotification,
  } = useHotelStore();

  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeBookingRoom, setActiveBookingRoom] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  // Determine target hotel ID
  const hotelId =
    hotel?.id ||
    process.env.NEXT_PUBLIC_DEMO_HOTEL_ID ||
    'a0000000-0000-0000-0000-000000000001';

  // 1. Fetch Hotel info & ONLY 'available' rooms for this owner's hotel
  const fetchAvailableRooms = useCallback(async () => {
    try {
      // 1. Fetch hotel details from Express + Postgres (with fallback)
      try {
        const hotelRes = await api.get(`/hotels/${hotelId}`);
        if (hotelRes?.data) {
          setHotel(hotelRes.data);
          const available = (hotelRes.data.rooms || []).filter(
            (r) => r.current_status === 'available'
          );
          setRooms(available);
          setLoading(false);
          return;
        }
      } catch (expressErr) {
        // Fallback to Supabase
      }

      // Supabase fallback
      const { data: hotelData } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', hotelId)
        .single();

      if (hotelData) {
        setHotel(hotelData);
      }

      // Fetch ONLY available rooms (Strict B2B Counter requirement)
      const { data: roomData, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('current_status', 'available')
        .order('base_price', { ascending: true });

      if (!error && roomData) {
        setRooms(roomData);
      }
    } catch (err) {
      console.error('Error fetching brochure data:', err);
    } finally {
      setLoading(false);
    }
  }, [hotelId, setHotel, setRooms]);

  useEffect(() => {
    fetchAvailableRooms();

    // 1. Socket.io Real-time update (Express + PostgreSQL)
    const socket = getSocket();
    if (socket) {
      socket.emit('join_hotel', hotelId);
      socket.on('room_status_changed', () => fetchAvailableRooms());
      socket.on('new_booking', () => fetchAvailableRooms());
    }

    // 2. Supabase Realtime channel fallback
    const channel = supabase
      .channel(`brochure-rooms-${hotelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `hotel_id=eq.${hotelId}`,
        },
        () => {
          fetchAvailableRooms();
        }
      )
      .subscribe();

    return () => {
      if (socket) {
        socket.off('room_status_changed');
        socket.off('new_booking');
        socket.emit('leave_hotel', hotelId);
      }
      supabase.removeChannel(channel);
    };
  }, [hotelId, fetchAvailableRooms]);

  // Filter available rooms by type
  const availableRooms = rooms.filter((r) => r.current_status === 'available');
  const filteredRooms =
    selectedType === 'all'
      ? availableRooms
      : availableRooms.filter((r) =>
          r.type?.toLowerCase().includes(selectedType.toLowerCase())
        );

  // Extract unique room categories
  const roomTypes = ['all', ...new Set(availableRooms.map((r) => r.type))];

  // 1-Click Walk-In Booking handler
  const handleConfirmWalkIn = async (room, quickName = null, quickPhone = null) => {
    const finalGuestName = quickName || guestName.trim() || 'Walk-In Guest';
    const finalGuestPhone = quickPhone || guestPhone.trim() || 'Front Desk Check-in';

    const res = await bookWalkIn({
      roomId: room.id,
      hotelId: room.hotel_id || hotelId,
      roomNumber: room.room_number,
      basePrice: room.base_price,
      guestName: finalGuestName,
      guestPhone: finalGuestPhone,
      checkInDate: todayISO(),
      checkOutDate: tomorrowISO(),
    });

    if (res.success) {
      setActiveBookingRoom(null);
      setGuestName('');
      setGuestPhone('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center animate-pulse mb-4">
          <svg className="w-6 h-6 text-brand-500 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="text-zinc-400 font-medium text-sm">Preparing Digital Brochure...</p>
        <span className="text-xs text-zinc-600 mt-1">Fetching live available inventory</span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-surface-0 text-zinc-100 flex flex-col ${isFullscreen ? 'p-6' : ''}`}>
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl animate-slide-up backdrop-blur-xl ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}
        >
          <span className="text-lg">{notification.type === 'success' ? '✅' : '⚠️'}</span>
          <p className="text-sm font-medium">{notification.message}</p>
          <button
            onClick={clearNotification}
            className="ml-3 text-xs opacity-60 hover:opacity-100 px-1 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Guest Presentation Toolbar */}
      <header className="sticky top-0 z-30 bg-surface-1/90 backdrop-blur-xl border-b border-zinc-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-400 border border-brand-500/30">
                Receptionist Counter View
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Walk-In Display
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-50 tracking-tight mt-1">
              {hotel?.name || 'Ashkona Airport Transit Inn'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 flex items-center gap-2">
              <span>📍 {hotel?.address || 'Ashkona, Uttara, Dhaka'}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">
                {availableRooms.length} Rooms Ready for Immediate Check-In
              </span>
            </p>
          </div>

          {/* Presentation Toolbar Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="px-3.5 py-2 text-xs font-semibold bg-surface-2 hover:bg-surface-3 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 transition-colors flex items-center gap-2"
              title="Toggle Guest Presentation Mode"
            >
              {isFullscreen ? 'Exit Guest View' : '🖥️ Presentation Mode'}
            </button>
            <Link
              href="/dashboard"
              className="px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-surface-2 hover:bg-surface-3 rounded-xl border border-zinc-800 transition-colors"
            >
              Back to Full PMS →
            </Link>
          </div>
        </div>

        {/* Room Type Filter Tabs */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {roomTypes.map((type) => {
            const count =
              type === 'all'
                ? availableRooms.length
                : availableRooms.filter(
                    (r) => r.type?.toLowerCase() === type?.toLowerCase()
                  ).length;

            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all whitespace-nowrap ${
                  selectedType === type
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : 'bg-surface-2 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {type === 'all' ? 'All Available' : type} ({count})
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Digital Brochure Visual Cards Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-surface-1/40 border border-zinc-800/60 rounded-3xl">
            <div className="w-20 h-20 rounded-full bg-zinc-800/80 flex items-center justify-center text-3xl mb-4">
              🏨
            </div>
            <h3 className="text-xl font-bold text-zinc-200">No Available Rooms In This Category</h3>
            <p className="text-sm text-zinc-500 max-w-md mt-2">
              All rooms of this type are currently occupied or undergoing housekeeping. Select
              &quot;All Available&quot; to inspect other vacant suites ready for walk-in guests.
            </p>
            <button
              onClick={() => setSelectedType('all')}
              className="mt-6 px-5 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all"
            >
              Show All Available Rooms
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => {
              // Primary image selection with tier fallback
              const imageUrl =
                (room.image_urls && room.image_urls.length > 0 && room.image_urls[0]) ||
                FALLBACK_ROOM_IMAGES[room.type?.toLowerCase()] ||
                FALLBACK_ROOM_IMAGES.standard;

              // Facilities array with sensible defaults if not set in DB
              const facilities =
                room.facilities && room.facilities.length > 0
                  ? room.facilities
                  : ['Air Conditioning', 'Free High-Speed Wi-Fi', 'Attached Bathroom', 'Smart TV'];

              return (
                <div
                  key={room.id}
                  className="group flex flex-col bg-surface-1 border border-zinc-800/90 hover:border-zinc-700 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/5 hover:-translate-y-1"
                >
                  {/* High Quality Visual Image Header */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900 cursor-pointer"
                       onClick={() => setPreviewImage(imageUrl)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={`${room.type} Room ${room.room_number}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-black/40" />

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <span className="px-3 py-1 bg-surface-0/90 backdrop-blur-md text-zinc-100 text-xs font-extrabold rounded-xl border border-zinc-700/80 shadow-md">
                        Room {room.room_number}
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-500/90 text-white text-[11px] font-bold rounded-xl shadow-md flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Available Now
                      </span>
                    </div>

                    {/* Room Type Tag */}
                    <div className="absolute bottom-3 left-4">
                      <span className="text-xs uppercase tracking-wider font-bold text-zinc-300 bg-surface-0/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-700/50">
                        {room.type}
                      </span>
                    </div>
                  </div>

                  {/* Card Body: Room Details & Facilities */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      {/* Price Display (BDT) */}
                      <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-zinc-800/80">
                        <div>
                          <span className="text-xs text-zinc-400 font-medium block">
                            Nightly Transit Rate
                          </span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-2xl font-black text-white tracking-tight">
                              {formatCurrency(room.base_price)}
                            </span>
                            <span className="text-xs text-zinc-500 font-medium">/ night</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-zinc-500 block">Short Transit (6h)</span>
                          <span className="text-sm font-bold text-emerald-400">
                            {formatCurrency(Math.round(room.base_price * 0.6))}
                          </span>
                        </div>
                      </div>

                      {/* Room Facilities Pills */}
                      <div className="mb-6">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2.5">
                          Room Facilities & Comforts
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {facilities.map((fac, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-2 text-zinc-300 border border-zinc-800"
                            >
                              <span>{getFacilityIcon(fac)}</span>
                              <span>{fac}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 1-Click "Book Walk-In" Button (Updates Zustand & Supabase) */}
                    <div className="pt-2">
                      <button
                        onClick={() => setActiveBookingRoom(room)}
                        disabled={isBookingLoading}
                        className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-lg shadow-brand-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <span>⚡</span>
                        <span>Book Walk-In Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 1-Click Walk-In Instant Booking Modal */}
      {activeBookingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-surface-1 border border-zinc-800 rounded-3xl p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                  Instant Walk-In Check-In
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  Room {activeBookingRoom.room_number} — {activeBookingRoom.type}
                </h3>
              </div>
              <button
                onClick={() => setActiveBookingRoom(null)}
                className="w-8 h-8 rounded-full bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div className="p-3.5 rounded-2xl bg-surface-2/70 border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 block">Total Amount Due</span>
                  <span className="text-xl font-black text-white">
                    {formatCurrency(activeBookingRoom.base_price)}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Instant Key Issue
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Guest Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tanvir Ahmed (or leave blank for Walk-in)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Guest Contact / Phone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+880 1700-000000"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmWalkIn(activeBookingRoom, 'Express Walk-In Guest', 'Counter')}
                disabled={isBookingLoading}
                className="flex-1 py-3 px-3 text-xs font-bold text-zinc-300 hover:text-white bg-surface-2 hover:bg-surface-3 rounded-xl border border-zinc-700 transition-colors"
              >
                1-Click Express Check-In
              </button>
              <button
                type="button"
                onClick={() => handleConfirmWalkIn(activeBookingRoom)}
                disabled={isBookingLoading}
                className="flex-1 py-3 px-3 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-colors shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2"
              >
                {isBookingLoading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  'Confirm & Assign Key'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Room Preview"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
