'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AvailableRoomCard from '@/components/booking/AvailableRoomCard';
import BookingForm from '@/components/booking/BookingForm';
import MapPlaceholder from '@/components/booking/MapPlaceholder';

/**
 * BookingPageClient — Client component for the public booking page.
 * Fetches hotel details and available rooms from Supabase.
 */
export default function BookingPageClient({ hotelId }) {
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const targetId = (hotelId === 'demo' || !hotelId)
        ? (process.env.NEXT_PUBLIC_DEMO_HOTEL_ID || 'a0000000-0000-0000-0000-000000000001')
        : hotelId;

      // Fetch hotel info
      const { data: hotelData } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', targetId)
        .single();

      // Fetch available rooms
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', targetId)
        .eq('current_status', 'available')
        .order('base_price', { ascending: true });

      if (hotelData) setHotel(hotelData);
      if (roomsData) setRooms(roomsData);
      setLoading(false);
    }

    fetchData();
  }, [hotelId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-brand-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-zinc-500">Loading hotel...</span>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-300">Hotel not found</h2>
          <p className="text-sm text-zinc-500 mt-1">The hotel you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Booking success screen
  if (booked) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-sm animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">Room Reserved!</h2>
          <p className="text-sm text-zinc-400 mb-1">
            Your room at <span className="text-zinc-200 font-medium">{hotel.name}</span> has been reserved.
          </p>
          <p className="text-sm text-zinc-500 mb-6">
            Pay at the hotel during check-in. Show this confirmation at the front desk.
          </p>
          <button
            onClick={() => {
              setBooked(false);
              setSelectedRoom(null);
            }}
            className="px-6 py-2.5 text-sm font-medium text-brand-500 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-xl transition-colors"
          >
            Book Another Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Hotel Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700/20 via-surface-0 to-emerald-900/10" />
        <div className="relative max-w-3xl mx-auto px-4 pt-12 pb-8">
          {/* Back link */}
          <a href="/" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            All Hotels
          </a>

          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
            {hotel.name}
          </h1>
          <p className="text-sm text-zinc-400 mt-2 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {hotel.address || 'Ashkona, Near Hazrat Shahjalal Airport, Dhaka'}
          </p>

          {/* Quick stats */}
          <div className="flex gap-3 mt-5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span className="text-xs font-medium text-emerald-400">
                {rooms.length} room{rooms.length !== 1 ? 's' : ''} available
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
              <span className="text-xs font-medium text-amber-400">Pay at Hotel</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16 space-y-8">
        {/* Map section */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-200 mb-3">Location</h2>
          <MapPlaceholder
            hotelName={hotel.name}
            address={hotel.address}
            latitude={hotel.latitude}
            longitude={hotel.longitude}
          />
        </section>

        {/* Available rooms */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-200 mb-1">Available Rooms</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Select a room to reserve. No payment required online.
          </p>

          {rooms.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <p className="text-sm text-zinc-500">No rooms available right now</p>
              <p className="text-xs text-zinc-600 mt-1">Please check back later or call the hotel directly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <AvailableRoomCard
                  key={room.id}
                  room={room}
                  onSelect={setSelectedRoom}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Booking form modal */}
      {selectedRoom && (
        <BookingForm
          room={selectedRoom}
          hotelId={hotelId}
          onCancel={() => setSelectedRoom(null)}
          onSuccess={() => setBooked(true)}
        />
      )}
    </div>
  );
}
