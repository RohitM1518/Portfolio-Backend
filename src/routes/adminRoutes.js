import { Router } from 'express';
import {
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
  getCurrentAdmin,
  getDashboardStats,
  getInteractionDetails
} from '../controllers/adminController.js';
import { verifyJWT, requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Public routes
router.post('/login', loginAdmin);
router.post('/refresh-token', refreshAccessToken);

// Protected routes
router.use(verifyJWT); // Apply JWT verification to all routes below
router.post('/logout', logoutAdmin);
router.get('/me', getCurrentAdmin);
router.get('/dashboard/stats', getDashboardStats);
router.get('/interactions', getInteractionDetails);

export default router; 