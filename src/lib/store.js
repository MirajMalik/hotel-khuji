import { create } from 'zustand';
import { api } from './api';
import { todayISO, tomorrowISO } from './utils';

/**
 * Global Zustand Store for Hotel Khuji PMS, Front Desk & Flight-Sync
 * Manages:
 *  - Front Desk Wake-Up Call Queue & Completion State
 *  - Active Hotel & Room States
 *  - Walk-In & Agency Reservations
 */
export const useHotelStore = create((set, get) => ({
  // State
  hotel: null,
  rooms: [],
  walkInBookings: [],
  isBookingLoading: false,
  notification: null,
  error: null,

  // Theme state: 'day' (crisp, high contrast light mode) or 'night' (dark mode)
  theme: 'night',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotel_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'day') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    }
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'day' ? 'night' : 'day';
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotel_theme', next);
      document.documentElement.setAttribute('data-theme', next);
      if (next === 'day') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    }
    set({ theme: next });
  },

  // Language state: 'bn' (Bangla - easy for local managers) or 'en' (English)
  lang: 'bn',
  setLang: (lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotel_lang', lang);
    }
    set({ lang });
  },
  toggleLang: () => {
    const next = get().lang === 'bn' ? 'en' : 'bn';
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotel_lang', next);
    }
    set({ lang: next });
  },

  // --- STEP 3: FLIGHT DEPARTURE & WAKE-UP QUEUE STATE ---
  frontdeskQueue: [],
  isQueueLoading: false,
  completedWakeupCalls: {}, // { [bookingId]: true }

  // Set active hotel & rooms
  setHotel: (hotel) => set({ hotel }),
  setRooms: (rooms) => set({ rooms }),

  // Update a single room's status
  updateRoomStatus: (roomId, newStatus) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? { ...room, current_status: newStatus, status: newStatus } : room
      ),
    })),

  // Clear toast notification
  clearNotification: () => set({ notification: null }),

  // Set initial flight wake-up queue
  setFrontdeskQueue: (queue) => {
    // Populate initial completed map from database
    const initialCompleted = {};
    queue.forEach((item) => {
      if (item.wakeup_call_completed) {
        initialCompleted[item.id] = true;
      }
    });
    set({
      frontdeskQueue: queue,
      completedWakeupCalls: { ...get().completedWakeupCalls, ...initialCompleted },
    });
  },

  // Toggle or mark wake-up call completed in Zustand state & PostgreSQL backend
  toggleWakeupCall: async (bookingId, guestName = '') => {
    const currentStatus = Boolean(get().completedWakeupCalls[bookingId]);
    const nextStatus = !currentStatus;

    // Optimistic UI update in Zustand
    set((state) => ({
      completedWakeupCalls: {
        ...state.completedWakeupCalls,
        [bookingId]: nextStatus,
      },
      frontdeskQueue: state.frontdeskQueue.map((item) =>
        item.id === bookingId ? { ...item, wakeup_call_completed: nextStatus } : item
      ),
      notification: {
        type: 'success',
        message: nextStatus
          ? `Wake-up call marked completed for ${guestName || 'guest'}!`
          : `Wake-up call reset to pending for ${guestName || 'guest'}.`,
      },
    }));

    try {
      // Sync with Express backend
      await api.patch(`/frontdesk/wakeup-call/${bookingId}`, { completed: nextStatus });
    } catch (err) {
      console.warn('Failed to sync wake-up status to server, reverting:', err.message);
      // Rollback on network error
      set((state) => ({
        completedWakeupCalls: {
          ...state.completedWakeupCalls,
          [bookingId]: currentStatus,
        },
        frontdeskQueue: state.frontdeskQueue.map((item) =>
          item.id === bookingId ? { ...item, wakeup_call_completed: currentStatus } : item
        ),
        notification: {
          type: 'error',
          message: 'Failed to update wake-up status on server.',
        },
      }));
    }
  },

  // 1-Click "Book Walk-In" Action
  bookWalkIn: async ({
    roomId,
    hotelId,
    roomNumber,
    basePrice,
    guestName = 'Walk-In Guest',
    guestPhone = 'Front Desk Check-in',
    flightNumber = '',
    flightDepartureTime = null,
    wakeupCallTime = null,
    checkInDate,
    checkOutDate,
  }) => {
    set({ isBookingLoading: true, error: null });

    const previousRooms = get().rooms;
    const targetHotelId = hotelId || get().hotel?.id || 'a0000000-0000-0000-0000-000000000001';
    const checkIn = checkInDate || todayISO();
    const checkOut = checkOutDate || tomorrowISO();
    const totalAmount = basePrice || 0;

    // Optimistic update
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? { ...room, current_status: 'occupied', status: 'occupied' } : room
      ),
    }));

    try {
      const response = await api.post('/bookings/walk-in', {
        hotelId: targetHotelId,
        roomId,
        guestName,
        guestPhone,
        flightNumber,
        flightDepartureTime,
        wakeupCallTime,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        bookingSource: 'walk_in',
        totalAmount,
      });

      const bookingData = response.data;

      const newBookingRecord = {
        id: bookingData?.id || `walkin-${Date.now()}`,
        roomId,
        roomNumber,
        guestName,
        guestPhone,
        flightNumber,
        flightDepartureTime,
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

export default useHotelStore;
