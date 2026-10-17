import express from 'express';
import {
  createBooking,
  getBookingsByHotel,
  updateBookingStatus,
} from '../controllers/bookingController.js';

const router = express.Router();

router.post('/', createBooking);
router.post('/walk-in', createBooking);
router.get('/hotel/:hotelId', getBookingsByHotel);
router.patch('/:id/status', updateBookingStatus);

export default router;
