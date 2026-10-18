import express from 'express';
import { query } from '../config/db.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/frontdesk/action-list
 * Protected route for hotel owners & front desk staff.
 * Queries PostgreSQL to return the "Daily Action List" for flight departures.
 * Pulls today's bookings ordered by flight_departure_time ASC (earliest departures first),
 * ensuring the receptionist knows who needs a wake-up call and airport shuttle first.
 */
router.get('/action-list', requireAuth, async (req, res) => {
  const hotelId = req.query.hotelId || req.user?.hotelId || process.env.NEXT_PUBLIC_DEMO_HOTEL_ID || 'a0000000-0000-0000-0000-000000000001';

  try {
    const actionListQuery = `
      SELECT 
        b.id,
        b.hotel_id,
        b.room_id,
        b.booked_by_user_id,
        b.guest_name,
        b.guest_phone,
        b.flight_number,
        b.flight_departure_time,
        b.wakeup_call_time,
        b.wakeup_call_completed,
        b.status AS booking_status,
        b.check_in_date,
        b.check_out_date,
        b.total_amount,
        r.room_number,
        r.type AS room_type,
        COALESCE(r.price, r.base_price, 0) AS room_price,
        h.name AS hotel_name,
        h.shuttle_available,
        h.location_url,
        u.role AS booked_by_role,
        u.email AS booked_by_email,
        -- Calculate minutes until departure for urgent queue sorting
        ROUND(EXTRACT(EPOCH FROM (b.flight_departure_time - NOW())) / 60) AS minutes_until_departure,
        -- Flag if flight departs within 4 hours (240 minutes)
        CASE 
          WHEN b.flight_departure_time IS NOT NULL 
               AND (b.flight_departure_time - NOW()) <= INTERVAL '4 hours' 
               AND (b.flight_departure_time - NOW()) >= INTERVAL '-1 hour'
          THEN true 
          ELSE false 
        END AS is_urgent
      FROM public.bookings b
      JOIN public.rooms r ON b.room_id = r.id
      JOIN public.hotels h ON b.hotel_id = h.id
      LEFT JOIN public.users u ON b.booked_by_user_id = u.id
      WHERE b.hotel_id = $1
        AND b.status NOT IN ('cancelled', 'checked_out')
        AND (
          b.flight_departure_time IS NOT NULL
          OR b.check_out_date = CURRENT_DATE
          OR b.check_in_date = CURRENT_DATE
        )
      ORDER BY 
        CASE WHEN b.flight_departure_time IS NOT NULL THEN 0 ELSE 1 END,
        b.flight_departure_time ASC NULLS LAST,
        b.wakeup_call_time ASC NULLS LAST,
        r.room_number ASC;
    `;

    const result = await query(actionListQuery, [hotelId]);

    // Compute summary metrics for the front desk
    const totalQueue = result.rows.length;
    const urgentCount = result.rows.filter(r => r.is_urgent && !r.wakeup_call_completed).length;
    const completedWakeups = result.rows.filter(r => r.wakeup_call_completed).length;

    return res.status(200).json({
      success: true,
      data: result.rows,
      meta: {
        total_queue: totalQueue,
        urgent_count: urgentCount,
        completed_wakeups: completedWakeups,
        queried_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Error fetching front desk action list:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve daily action list',
      details: err.message 
    });
  }
});

/**
 * PATCH /api/frontdesk/wakeup-call/:id
 * Toggle or mark wake-up call completed for a guest in PostgreSQL
 */
router.patch('/wakeup-call/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { completed = true } = req.body;

  try {
    const result = await query(
      `UPDATE public.bookings 
       SET wakeup_call_completed = $1
       WHERE id = $2 
       RETURNING id, guest_name, flight_number, wakeup_call_completed, wakeup_call_time`,
      [Boolean(completed), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    return res.status(200).json({
      success: true,
      message: `Wake-up call marked as ${completed ? 'completed' : 'pending'}`,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating wakeup call status:', err);
    return res.status(500).json({ success: false, error: 'Failed to update wakeup call' });
  }
});

export default router;
