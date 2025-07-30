import Notification from '../models/notificationModel.js';
import Interaction from '../models/interactionModel.js';
import APIError from '../utils/apiError.js';
import APIResponse from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Get notification preferences for admin
const getNotificationPreferences = asyncHandler(async (req, res) => {
  const adminId = req.admin._id;
  
  const notifications = await Notification.find({ adminId });
  
  // Create default preferences if none exist
  const defaultPreferences = {
    email: { enabled: true, settings: { frequency: 'daily' } },
    dashboard: { enabled: true, settings: { showAlerts: true, alertTypes: ['high_traffic', 'form_submission'] } },
    weeklyReport: { enabled: false, settings: { dayOfWeek: 0, time: '09:00', includeMetrics: ['interactions', 'visitors'] } }
  };
  
  const preferences = {};
  notifications.forEach(notification => {
    preferences[notification.type] = {
      enabled: notification.enabled,
      settings: notification.settings
    };
  });
  
  // Merge with defaults
  const finalPreferences = { ...defaultPreferences, ...preferences };
  
  res.status(200).json(
    new APIResponse(200, finalPreferences, "Notification preferences retrieved successfully")
  );
});

// Update notification preferences
const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const adminId = req.admin._id;
  const { type, enabled, settings } = req.body;
  
  if (!type || !['email', 'dashboard', 'weekly_report'].includes(type)) {
    throw new APIError(400, "Invalid notification type");
  }
  
  let notification = await Notification.findOne({ adminId, type });
  
  if (!notification) {
    notification = new Notification({
      adminId,
      type,
      enabled: enabled ?? true,
      settings: settings ?? {}
    });
  } else {
    notification.enabled = enabled ?? notification.enabled;
    if (settings) {
      notification.settings = { ...notification.settings, ...settings };
    }
  }
  
  await notification.save();
  
  res.status(200).json(
    new APIResponse(200, notification, "Notification preferences updated successfully")
  );
});

// Get dashboard alerts
const getDashboardAlerts = asyncHandler(async (req, res) => {
  const adminId = req.admin._id;
  
  // Check if dashboard alerts are enabled
  const dashboardNotification = await Notification.findOne({ adminId, type: 'dashboard' });
  if (!dashboardNotification || !dashboardNotification.enabled) {
    return res.status(200).json(
      new APIResponse(200, { alerts: [] }, "Dashboard alerts are disabled")
    );
  }
  
  const alerts = [];
  
  // Check for high traffic (more than 100 interactions in last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentInteractions = await Interaction.countDocuments({
    timestamp: { $gte: oneHourAgo }
  });
  
  if (recentInteractions > 100 && dashboardNotification.settings.alertTypes?.includes('high_traffic')) {
    alerts.push({
      id: 'high_traffic',
      type: 'high_traffic',
      title: 'High Traffic Alert',
      message: `${recentInteractions} interactions in the last hour`,
      severity: 'warning',
      timestamp: new Date()
    });
  }
  
  // Check for recent form submissions
  const recentForms = await Interaction.countDocuments({
    type: 'form_submission',
    timestamp: { $gte: oneHourAgo }
  });
  
  if (recentForms > 0 && dashboardNotification.settings.alertTypes?.includes('form_submission')) {
    alerts.push({
      id: 'form_submission',
      type: 'form_submission',
      title: 'New Form Submission',
      message: `${recentForms} new form submission(s) in the last hour`,
      severity: 'info',
      timestamp: new Date()
    });
  }
  
  res.status(200).json(
    new APIResponse(200, { alerts }, "Dashboard alerts retrieved successfully")
  );
});

// Send email notification (placeholder - would integrate with email service)
const sendEmailNotification = asyncHandler(async (req, res) => {
  const adminId = req.admin._id;
  const { type, data } = req.body;
  
  const emailNotification = await Notification.findOne({ adminId, type: 'email' });
  if (!emailNotification || !emailNotification.enabled) {
    throw new APIError(400, "Email notifications are disabled");
  }
  
  // Here you would integrate with an email service like SendGrid, AWS SES, etc.
  // For now, we'll just log the notification
  console.log('Email notification would be sent:', {
    to: emailNotification.settings.email?.address || 'admin@example.com',
    type,
    data,
    timestamp: new Date()
  });
  
  // Update last sent timestamp
  emailNotification.lastSent = new Date();
  await emailNotification.save();
  
  res.status(200).json(
    new APIResponse(200, { sent: true }, "Email notification sent successfully")
  );
});

// Generate and send weekly report
const generateWeeklyReport = asyncHandler(async (req, res) => {
  const adminId = req.admin._id;
  
  const weeklyNotification = await Notification.findOne({ adminId, type: 'weekly_report' });
  if (!weeklyNotification || !weeklyNotification.enabled) {
    throw new APIError(400, "Weekly reports are disabled");
  }
  
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Gather weekly statistics
  const stats = {};
  
  if (weeklyNotification.settings.includeMetrics?.includes('interactions')) {
    stats.totalInteractions = await Interaction.countDocuments({
      timestamp: { $gte: oneWeekAgo }
    });
  }
  
  if (weeklyNotification.settings.includeMetrics?.includes('visitors')) {
    stats.uniqueVisitors = await Interaction.distinct('ipAddress', {
      timestamp: { $gte: oneWeekAgo }
    }).then(ips => ips.length);
  }
  
  if (weeklyNotification.settings.includeMetrics?.includes('pages')) {
    stats.pageVisits = await Interaction.aggregate([
      { $match: { timestamp: { $gte: oneWeekAgo }, type: 'page_visit' } },
      { $group: { _id: '$page', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
  }
  
  if (weeklyNotification.settings.includeMetrics?.includes('forms')) {
    stats.formSubmissions = await Interaction.countDocuments({
      type: 'form_submission',
      timestamp: { $gte: oneWeekAgo }
    });
  }
  
  // Update last sent timestamp
  weeklyNotification.lastSent = new Date();
  await weeklyNotification.save();
  
  res.status(200).json(
    new APIResponse(200, { 
      report: stats,
      generatedAt: new Date(),
      period: 'last_7_days'
    }, "Weekly report generated successfully")
  );
});

export {
  getNotificationPreferences,
  updateNotificationPreferences,
  getDashboardAlerts,
  sendEmailNotification,
  generateWeeklyReport
}; 