import { Router } from 'express';
import {
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
  getCurrentAdmin,
  getDashboardStats,
  getInteractionDetails,
  getChatConversations,
  getChangesSinceLastLogin,
  getEnhancedDashboardStats
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
router.get('/dashboard/enhanced-stats', getEnhancedDashboardStats);
router.get('/changes-since-login', getChangesSinceLastLogin);
router.get('/interactions', getInteractionDetails);
router.get('/chat-conversations', getChatConversations);

export default router; 