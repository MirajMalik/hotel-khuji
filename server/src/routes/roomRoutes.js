import express from 'express';
import { getRoomsByHotel, updateRoomStatus } from '../controllers/roomController.js';

const router = express.Router();

router.get('/hotel/:hotelId', getRoomsByHotel);
router.patch('/:id/status', updateRoomStatus);

export default router;
