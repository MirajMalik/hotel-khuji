import { query, getClient } from '../config/db.js';
import { getIO } from '../config/socket.js';

export const createBooking = async (req, res) => {
  const {
    hotelId,
    hotel_id,
    roomId,
    room_id,
    guestName,
    guest_name,
    guestPhone,
    guest_phone,
    checkInDate,
    check_in_date,
    checkOutDate,
    check_out_date,
    bookingSource,
    booking_source = 'walk_in',
    totalAmount,
    total_amount = 0,
    flightNumber,
    flight_number,
    flightDepartureTime,
    flight_departure_time,
    wakeupCallTime,
    wakeup_call_time,
    bookedByUserId,
    booked_by_user_id,
  } = req.body;

  const targetHotelId = hotelId || hotel_id;
  const targetRoomId = roomId || room_id;
  const targetGuestName = guestName || guest_name || 'Walk-In Guest';
  const targetGuestPhone = guestPhone || guest_phone || 'Front Desk Check-in';
  const targetCheckIn = checkInDate || check_in_date || new Date().toISOString().split('T')[0];
  const targetCheckOut = checkOutDate || check_out_date || new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const targetSource = bookingSource || booking_source;
  const targetAmount = totalAmount || total_amount;
  const targetFlightNum = flightNumber || flight_number || null;
  const targetFlightDep = flightDepartureTime || flight_departure_time || null;
  const targetBookedBy = bookedByUserId || booked_by_user_id || req.user?.id || null;
  
  // Auto-calculate wake-up call time (default: 2 hours prior to flight departure if not explicitly given)
  let targetWakeup = wakeupCallTime || wakeup_call_time || null;
  if (!targetWakeup && targetFlightDep) {
    try {
      const depDate = new Date(targetFlightDep);
      targetWakeup = new Date(depDate.getTime() - 2 * 60 * 60 * 1000).toISOString();
    } catch (e) {}
  }

  if (!targetHotelId || !targetRoomId) {
    return res.status(400).json({ error: 'hotelId and roomId are required' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Insert booking record with flight synchronization fields
    const insertBookingQuery = `
      INSERT INTO public.bookings (
        hotel_id,
        room_id,
        booked_by_user_id,
        guest_name,
        guest_phone,
        check_in_date,
        check_out_date,
        flight_number,
        flight_departure_time,
        wakeup_call_time,
        wakeup_call_completed,
        booking_source,
        total_amount,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, $11, $12, 'confirmed')
      RETURNING *;
    `;

    const bookingResult = await client.query(insertBookingQuery, [
      targetHotelId,
      targetRoomId,
      targetBookedBy,
      targetGuestName,
      targetGuestPhone,
      targetCheckIn,
      targetCheckOut,
      targetFlightNum,
      targetFlightDep,
      targetWakeup,
      targetSource,
      targetAmount,
    ]);

    const booking = bookingResult.rows[0];

    // 2. Explicitly ensure room is marked 'occupied'
    await client.query(
      "UPDATE public.rooms SET current_status = 'occupied' WHERE id = $1",
      [targetRoomId]
    );

    await client.query('COMMIT');

    // 3. Emit real-time updates via Socket.io
    try {
      const io = getIO();
      // Notify front desk of new booking
      io.to(`hotel:${targetHotelId}`).emit('new_booking', { booking });
      // Notify front desk room status changed
      io.to(`hotel:${targetHotelId}`).emit('room_status_changed', {
        roomId: targetRoomId,
        status: 'occupied',
      });
    } catch (socketErr) {
      console.warn('Socket emit warning:', socketErr.message);
    }

    return res.status(201).json({ data: booking });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating booking:', err);
    return res.status(500).json({ error: err.message || 'Failed to create booking' });
  } finally {
    client.release();
  }
};

export const getBookingsByHotel = async (req, res) => {
  const { hotelId } = req.params;

  try {
    const result = await query(
      `SELECT b.*, r.room_number, r.type as room_type
       FROM public.bookings b
       JOIN public.rooms r ON b.room_id = r.id
       WHERE b.hotel_id = $1
       ORDER BY b.created_at DESC`,
      [hotelId]
    );

    return res.status(200).json({ data: result.rows });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

export const updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const bookingRes = await client.query(
      'UPDATE public.bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (bookingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingRes.rows[0];

    // If booking checked out or cancelled, free up the room
    if (status === 'checked_out' || status === 'cancelled') {
      await client.query(
        "UPDATE public.rooms SET current_status = 'available' WHERE id = $1",
        [booking.room_id]
      );
    } else if (status === 'checked_in' || status === 'confirmed') {
      await client.query(
        "UPDATE public.rooms SET current_status = 'occupied' WHERE id = $1",
        [booking.room_id]
      );
    }

    await client.query('COMMIT');

    try {
      const io = getIO();
      io.to(`hotel:${booking.hotel_id}`).emit('booking_updated', { booking });
      io.to(`hotel:${booking.hotel_id}`).emit('room_status_changed', {
        roomId: booking.room_id,
        status: status === 'checked_out' || status === 'cancelled' ? 'available' : 'occupied',
      });
    } catch (e) {}

    return res.status(200).json({ data: booking });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating booking status:', err);
    return res.status(500).json({ error: err.message || 'Failed to update booking status' });
  } finally {
    client.release();
  }
};
