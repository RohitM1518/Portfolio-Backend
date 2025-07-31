import { asyncHandler } from "../utils/asyncHandler.js";
import Interaction from "../models/interactionModel.js";
import APIError from "../utils/apiError.js";
import APIResponse from "../utils/apiResponse.js";

// Track any user interaction
const trackInteraction = asyncHandler(async (req, res) => {
  const { type, page, element, metadata } = req.body;

  if (!type || !page) {
    throw new APIError(400, "Type and page are required");
  }

  // Get client information
  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.clientIP || 'unknown';
  const referrer = req.get('Referrer') || '';
  const sessionId = req.cookies.sessionId || req.headers['x-session-id'] || '';

  const interaction = await Interaction.create({
    type,
    page,
    element,
    userAgent,
    ipAddress,
    referrer,
    sessionId,
    metadata: metadata || {}
  });

  return res.status(201).json(
    new APIResponse(201, { interaction }, "Interaction tracked successfully")
  );
});

// Track resume download specifically
const trackResumeDownload = asyncHandler(async (req, res) => {
  const { page, element, metadata } = req.body;

  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.clientIP || 'unknown';
  const referrer = req.get('Referrer') || '';
  const sessionId = req.cookies.sessionId || req.headers['x-session-id'] || '';

  const interaction = await Interaction.create({
    type: 'resume_download',
    page: page || 'resume',
    element: element || 'download_button',
    userAgent,
    ipAddress,
    referrer,
    sessionId,
    metadata: {
      ...metadata,
      downloadTime: new Date(),
      fileType: 'pdf'
    }
  });

  return res.status(201).json(
    new APIResponse(201, { interaction }, "Resume download tracked successfully")
  );
});

// Track page visit
const trackPageVisit = asyncHandler(async (req, res) => {
  const { page, metadata } = req.body;

  if (!page) {
    throw new APIError(400, "Page is required");
  }

  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.clientIP || 'unknown';
  const referrer = req.get('Referrer') || '';
  const sessionId = req.cookies.sessionId || req.headers['x-session-id'] || '';

  const interaction = await Interaction.create({
    type: 'page_visit',
    page,
    userAgent,
    ipAddress,
    referrer,
    sessionId,
    metadata: {
      ...metadata,
      visitTime: new Date()
    }
  });

  return res.status(201).json(
    new APIResponse(201, { interaction }, "Page visit tracked successfully")
  );
});

// Track button click
const trackButtonClick = asyncHandler(async (req, res) => {
  const { page, element, metadata } = req.body;

  if (!page || !element) {
    throw new APIError(400, "Page and element are required");
  }

  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.clientIP || 'unknown';
  const referrer = req.get('Referrer') || '';
  const sessionId = req.cookies.sessionId || req.headers['x-session-id'] || '';

  const interaction = await Interaction.create({
    type: 'button_click',
    page,
    element,
    userAgent,
    ipAddress,
    referrer,
    sessionId,
    metadata: {
      ...metadata,
      clickTime: new Date()
    }
  });

  return res.status(201).json(
    new APIResponse(201, { interaction }, "Button click tracked successfully")
  );
});

// Track form submission
const trackFormSubmission = asyncHandler(async (req, res) => {
  const { page, element, metadata } = req.body;

  if (!page || !element) {
    throw new APIError(400, "Page and element are required");
  }

  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.clientIP || 'unknown';
  const referrer = req.get('Referrer') || '';
  const sessionId = req.cookies.sessionId || req.headers['x-session-id'] || '';

  const interaction = await Interaction.create({
    type: 'form_submission',
    page,
    element,
    userAgent,
    ipAddress,
    referrer,
    sessionId,
    metadata: {
      ...metadata,
      submissionTime: new Date()
    }
  });

  return res.status(201).json(
    new APIResponse(201, { interaction }, "Form submission tracked successfully")
  );
});

// Get interaction statistics
const getInteractionStats = asyncHandler(async (req, res) => {
  const { startDate, endDate, type, page } = req.query;

  let query = {};

  // Add date filter if provided
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  // Add type filter if provided
  if (type) {
    query.type = type;
  }

  // Add page filter if provided
  if (page) {
    query.page = page;
  }

  // Get total interactions
  const totalInteractions = await Interaction.countDocuments(query);

  // Get interactions by type
  const interactionsByType = await Interaction.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get interactions by page
  const interactionsByPage = await Interaction.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$page',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get recent interactions
  const recentInteractions = await Interaction.find(query)
    .sort({ timestamp: -1 })
    .limit(10)
    .select('-__v');

  const stats = {
    totalInteractions,
    interactionsByType,
    interactionsByPage,
    recentInteractions
  };

  return res.status(200).json(
    new APIResponse(200, stats, "Interaction statistics retrieved successfully")
  );
});

// Get resume download statistics
const getResumeDownloadStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let query = { type: 'resume_download' };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const totalDownloads = await Interaction.countDocuments(query);

  const downloadsByDate = await Interaction.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
  ]);

  const recentDownloads = await Interaction.find(query)
    .sort({ timestamp: -1 })
    .limit(10)
    .select('timestamp userAgent ipAddress page');

  const stats = {
    totalDownloads,
    downloadsByDate,
    recentDownloads
  };

  return res.status(200).json(
    new APIResponse(200, stats, "Resume download statistics retrieved successfully")
  );
});

export {
  trackInteraction,
  trackResumeDownload,
  trackPageVisit,
  trackButtonClick,
  trackFormSubmission,
  getInteractionStats,
  getResumeDownloadStats
}; 