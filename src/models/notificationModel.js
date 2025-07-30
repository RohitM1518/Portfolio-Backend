import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  type: {
    type: String,
    enum: ['email', 'dashboard', 'weekly_report'],
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  settings: {
    email: {
      address: String,
      frequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly'],
        default: 'daily'
      }
    },
    dashboard: {
      showAlerts: {
        type: Boolean,
        default: true
      },
      alertTypes: [{
        type: String,
        enum: ['high_traffic', 'form_submission', 'error', 'system']
      }]
    },
    weeklyReport: {
      dayOfWeek: {
        type: Number, // 0-6 (Sunday-Saturday)
        default: 0
      },
      time: {
        type: String,
        default: '09:00'
      },
      includeMetrics: [{
        type: String,
        enum: ['interactions', 'visitors', 'pages', 'forms']
      }]
    }
  },
  lastSent: {
    type: Date
  },
  nextScheduled: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ adminId: 1, type: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 