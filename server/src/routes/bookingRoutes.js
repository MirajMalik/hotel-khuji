import express from 'express';
import { createBooking, getBookingsByHotel } from '../controllers/bookingController.js';

const router = express.Router();

router.post('/', createBooking);
router.post('/walk-in', createBooking);
router.get('/hotel/:hotelId', getBookingsByHotel);

export default router;
