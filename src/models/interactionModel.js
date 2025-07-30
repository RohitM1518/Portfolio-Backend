import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'resume_download',
      'page_visit',
      'button_click',
      'form_submission',
      'link_click',
      'scroll_depth',
      'time_spent',
      'contact_form',
      'project_view',
      'social_media_click'
    ]
  },
  page: {
    type: String,
    required: true,
    trim: true
  },
  element: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  referrer: {
    type: String,
    trim: true
  },
  sessionId: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
interactionSchema.index({ type: 1, timestamp: -1 });
interactionSchema.index({ page: 1, timestamp: -1 });
interactionSchema.index({ sessionId: 1 });

const Interaction = mongoose.model('Interaction', interactionSchema);

export default Interaction; 