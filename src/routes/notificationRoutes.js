import express from 'express';
import { verifyJWT } from '../middlewares/authMiddleware.js';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  getDashboardAlerts,
  sendEmailNotification,
  generateWeeklyReport
} from '../controllers/notificationController.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Get notification preferences
router.get('/preferences', getNotificationPreferences);

// Update notification preferences
router.put('/preferences', updateNotificationPreferences);

// Get dashboard alerts
router.get('/dashboard-alerts', getDashboardAlerts);

// Send email notification
router.post('/send-email', sendEmailNotification);

// Generate weekly report
router.post('/weekly-report', generateWeeklyReport);

export default router; 