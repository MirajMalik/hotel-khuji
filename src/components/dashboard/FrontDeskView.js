import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { supabase } from '@/lib/supabase';
import RoomCard from './RoomCard';
import WalkInModal from './WalkInModal';
import StatusBar from './StatusBar';

/**
 * FrontDeskView — The main operational view for hotel receptionists.
 * 
 * - Fetches rooms for the given hotel in real-time
 * - Displays them in a responsive grid, color-coded by status
 * - Opens walk-in modal on click of available room
 * - Subscribes to Socket.io & Supabase Realtime for live updates
 */
export default function FrontDeskView({ hotelId, hotelName }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch rooms from Express + PostgreSQL (with Supabase fallback)
  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.get(`/rooms/hotel/${hotelId}`);
      if (res?.data) {
        setRooms(res.data);
        setLoading(false);
        return;
      }
    } catch {
      // Fallback to Supabase if Express server is idle
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('room_number', { ascending: true });

      if (!error && data) {
        setRooms(data);
      }
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchRooms();

    // 1. Socket.io Real-time Subscription (Express + PostgreSQL)
    const socket = getSocket();
    if (socket) {
      socket.emit('join_hotel', hotelId);
      socket.on('room_status_changed', () => fetchRooms());
      socket.on('new_booking', () => fetchRooms());
    }

    // 2. Supabase Realtime channel fallback
    const channel = supabase
      .channel(`rooms-${hotelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `hotel_id=eq.${hotelId}`,
        },
        () => {
          fetchRooms();
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
  }, [hotelId, fetchRooms]);

  // Filter rooms by status
  const filteredRooms =
    filterStatus === 'all'
      ? rooms
      : rooms.filter((r) => r.current_status === filterStatus);

  function handleWalkInSuccess() {
    setSelectedRoom(null);
    fetchRooms();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-brand-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-zinc-500">Loading rooms...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            {hotelName || 'Front Desk'}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Live room status · Click an available room to check in a walk-in guest
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-dot" />
          <span className="text-xs font-medium text-emerald-400">Live</span>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar rooms={rooms} />

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'available', 'occupied', 'maintenance'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize
              ${filterStatus === status
                ? 'bg-brand-500/20 text-brand-500 border border-brand-500/30'
                : 'bg-surface-2 text-zinc-500 border border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
              }
            `}
          >
            {status === 'all' ? `All (${rooms.length})` : `${status} (${rooms.filter(r => r.current_status === status).length})`}
          </button>
        ))}
      </div>

      {/* Room grid */}
      {filteredRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500">No rooms found</p>
          <p className="text-xs text-zinc-600 mt-1">
            Add rooms to your hotel in the Supabase dashboard
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onBookWalkIn={setSelectedRoom}
            />
          ))}
        </div>
      )}

      {/* Walk-in Modal */}
      {selectedRoom && (
        <WalkInModal
          room={selectedRoom}
          hotelId={hotelId}
          onClose={() => setSelectedRoom(null)}
          onSuccess={handleWalkInSuccess}
        />
      )}
    </div>
  );
}
