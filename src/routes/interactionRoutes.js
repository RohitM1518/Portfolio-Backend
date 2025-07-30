import { Router } from 'express';
import {
  trackInteraction,
  trackResumeDownload,
  trackPageVisit,
  trackButtonClick,
  trackFormSubmission,
  getInteractionStats,
  getResumeDownloadStats
} from '../controllers/interactionController.js';

const router = Router();

// Track general interactions
router.post('/track', trackInteraction);

// Track specific interaction types
router.post('/resume-download', trackResumeDownload);
router.post('/page-visit', trackPageVisit);
router.post('/button-click', trackButtonClick);
router.post('/form-submission', trackFormSubmission);

// Get statistics
router.get('/stats', getInteractionStats);
router.get('/resume-downloads', getResumeDownloadStats);

export default router; 