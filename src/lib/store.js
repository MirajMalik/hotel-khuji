import { create } from 'zustand';
import { supabase } from './supabase';
import { todayISO, tomorrowISO } from './utils';

/**
 * Global Zustand Store for Hotel Khuji PMS & Brochure
 * Manages active hotel, room states, walk-in reservations, and live sync.
 */
export const useHotelStore = create((set, get) => ({
  // State
  hotel: null,
  rooms: [],
  walkInBookings: [],
  isBookingLoading: false,
  notification: null,
  error: null,

  // Set active hotel
  setHotel: (hotel) => set({ hotel }),

  // Set all rooms
  setRooms: (rooms) => set({ rooms }),

  // Update a single room's status
  updateRoomStatus: (roomId, newStatus) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? { ...room, current_status: newStatus } : room
      ),
    })),

  // Clear toast notification
  clearNotification: () => set({ notification: null }),

  // 1-Click "Book Walk-In" Action
  // Updates both the Zustand store (optimistically) and Supabase
  bookWalkIn: async ({
    roomId,
    hotelId,
    roomNumber,
    basePrice,
    guestName = 'Walk-In Guest',
    guestPhone = 'Front Desk Check-in',
    checkInDate,
    checkOutDate,
  }) => {
    set({ isBookingLoading: true, error: null });

    const previousRooms = get().rooms;
    const targetHotelId = hotelId || get().hotel?.id || 'a0000000-0000-0000-0000-000000000001';
    const checkIn = checkInDate || todayISO();
    const checkOut = checkOutDate || tomorrowISO();
    const totalAmount = basePrice || 0;

    // 1. Optimistic Update in Zustand store: Mark room as occupied immediately
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? { ...room, current_status: 'occupied' } : room
      ),
    }));

    try {
      // 2. Insert into Supabase `bookings` table
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          hotel_id: targetHotelId,
          room_id: roomId,
          guest_name: guestName,
          guest_phone: guestPhone,
          check_in_date: checkIn,
          check_out_date: checkOut,
          booking_source: 'walk_in',
          total_amount: totalAmount,
          status: 'confirmed',
        })
        .select()
        .single();

      if (bookingError) {
        throw new Error(bookingError.message || 'Failed to create booking in Supabase');
      }

      // 3. Explicitly update `rooms` table current_status in Supabase
      const { error: roomUpdateError } = await supabase
        .from('rooms')
        .update({ current_status: 'occupied' })
        .eq('id', roomId);

      if (roomUpdateError) {
        console.warn('Room update notice (may have been handled by DB trigger):', roomUpdateError);
      }

      // 4. Update Zustand store with the confirmed booking and success toast
      const newBookingRecord = {
        id: bookingData?.id || `walkin-${Date.now()}`,
        roomId,
        roomNumber,
        guestName,
        guestPhone,
        totalAmount,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        walkInBookings: [newBookingRecord, ...state.walkInBookings],
        isBookingLoading: false,
        notification: {
          type: 'success',
          message: `Room ${roomNumber || ''} successfully booked for ${guestName}!`,
        },
      }));

      return { success: true, booking: newBookingRecord };
    } catch (err) {
      console.error('Walk-in booking error:', err);

      // Rollback optimistic update on error
      set({
        rooms: previousRooms,
        isBookingLoading: false,
        error: err.message || 'Booking failed. Please try again.',
        notification: {
          type: 'error',
          message: `Failed to book room: ${err.message}`,
        },
      });

      return { success: false, error: err.message };
    }
  },
}));
