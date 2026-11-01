import express from 'express';
import {
  getHotels,
  getHotelById,
  getOwnerHotel,
  createHotel,
  updateHotel,
} from '../controllers/hotelController.js';
import { requireAuth, requireOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

// Owner hotel management routes (must precede /:id)
router.get('/owner/me', requireAuth, getOwnerHotel);
router.post('/', requireAuth, createHotel);
router.put('/:id', requireAuth, updateHotel);

// Public hotel browsing routes
router.get('/', getHotels);
router.get('/:id', getHotelById);

export default router;
