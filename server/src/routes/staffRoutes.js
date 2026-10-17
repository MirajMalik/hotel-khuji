import express from 'express';
import {
  getStaffByHotel,
  createStaff,
  updateStaff,
  deleteStaff,
  getExpensesByHotel,
  createExpense,
  deleteExpense,
} from '../controllers/staffController.js';

const router = express.Router();

// Staff
router.get('/hotel/:hotelId', getStaffByHotel);
router.post('/', createStaff);
router.patch('/:id', updateStaff);
router.delete('/:id', deleteStaff);

// Staff Expenses
router.get('/expenses/hotel/:hotelId', getExpensesByHotel);
router.post('/expenses', createExpense);
router.delete('/expenses/:id', deleteExpense);

export default router;
