import express from 'express';
import {
  getRoomsByHotel,
  createRoom,
  updateRoom,
  deleteRoom,
  updateRoomStatus,
} from '../controllers/roomController.js';

const router = express.Router();

router.get('/hotel/:hotelId', getRoomsByHotel);
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.patch('/:id', updateRoom);
router.patch('/:id/status', updateRoomStatus);
router.delete('/:id', deleteRoom);

export default router;
