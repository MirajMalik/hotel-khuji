import express from 'express';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * STEP 2.2: Authentication Routes
 * POST /api/auth/login -> Validates user credentials in PostgreSQL and issues signed JWT
 * POST /api/auth/register -> Registers owner, customer, or agency in PostgreSQL
 * POST /api/auth/logout -> Clears authentication cookie
 * GET /api/auth/me -> Retrieves current authenticated profile
 */
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;
