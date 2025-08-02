import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import Interaction from '../models/interactionModel.js';
import { getIPInfo, getClientIP, sanitizeIP } from '../utils/ipUtils.js';

// Track any user interaction
const trackInteraction = asyncHandler(async (req, res) => {
  const { type, page, element, metadata, sessionId } = req.body;

  if (!type || !page) {
    throw new ApiError(400, "Type and page are required");
  }

  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.clientIP || 'unknown';
  const referrer = req.get('Referrer') || '';

  const interaction = await Interaction.create({
    type,
    page,
    element: element || '',
    userAgent,
    ipAddress,
    referrer,
    sessionId: sessionId || '',
    metadata: {
      ...metadata,
      timestamp: new Date()
    }
  });

  return res.status(201).json(
    new ApiResponse(201, { interaction }, "Interaction tracked successfully")
  );
});

// Track resume download
const trackResumeDownload = asyncHandler(async (req, res) => {
  const { page, element, metadata, sessionId } = req.body;

  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.clientIP || 'unknown';
  const referrer = req.get('Referrer') || '';

  const interaction = await Interaction.create({
    type: 'resume_download',
    page: page || 'resume',
    element: element || 'download_button',
    userAgent,
    ipAddress,
    referrer,
    sessionId: sessionId || '',
    metadata: {
      ...metadata,
      downloadTime: new Date()
    }
  });

  return res.status(201).json(
    new ApiResponse(201, { interaction }, "Resume download tracked successfully")
  );
});

// Track page visit
const trackPageVisit = asyncHandler(async (req, res) => {
  const { page, metadata, sessionId } = req.body;

  if (!page) {
    throw new ApiError(400, "Page is required");
  }

  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.clientIP || 'unknown';
  const referrer = req.get('Referrer') || '';

  const interaction = await Interaction.create({
    type: 'page_visit',
    page,
    userAgent,
    ipAddress,
    referrer,
    sessionId: sessionId || '',
    metadata: {
      ...metadata,
      visitTime: new Date()
    }
  });

  return res.status(201).json(
    new ApiResponse(201, { interaction }, "Page visit tracked successfully")
  );
});

// Track button click
const trackButtonClick = asyncHandler(async (req, res) => {
  const { page, element, metadata, sessionId } = req.body;

  if (!page || !element) {
    throw new ApiError(400, "Page and element are required");
  }

  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.clientIP || 'unknown';
  const referrer = req.get('Referrer') || '';

  const interaction = await Interaction.create({
    type: 'button_click',
    page,
    element,
    userAgent,
    ipAddress,
    referrer,
    sessionId: sessionId || '',
    metadata: {
      ...metadata,
      clickTime: new Date()
    }
  });

  return res.status(201).json(
    new ApiResponse(201, { interaction }, "Button click tracked successfully")
  );
});

// Track form submission
const trackFormSubmission = asyncHandler(async (req, res) => {
  const { page, element, metadata, sessionId } = req.body;

  if (!page || !element) {
    throw new ApiError(400, "Page and element are required");
  }

  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.clientIP || 'unknown';
  const referrer = req.get('Referrer') || '';

  const interaction = await Interaction.create({
    type: 'form_submission',
    page,
    element,
    userAgent,
    ipAddress,
    referrer,
    sessionId: sessionId || '',
    metadata: {
      ...metadata,
      submissionTime: new Date()
    }
  });

  return res.status(201).json(
    new ApiResponse(201, { interaction }, "Form submission tracked successfully")
  );
});

// Get all interactions with pagination and filters
const getAllInteractions = asyncHandler(async (req, res) => {
  const {
    pageNum = 1,
    limit = 20,
    type,
    page: pageFilter,
    startDate,
    endDate,
    sortBy = 'timestamp',
    sortOrder = 'desc',
    search
  } = req.query;

  console.log('getAllInteractions called with query params:', req.query);

  // Build query
  let query = {};

  // Filter by type
  if (type) {
    query.type = type;
  }

  // Filter by page
  if (pageFilter) {
    query.page = { $regex: pageFilter, $options: 'i' };
  }

  // Filter by date range
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  // Search functionality
  if (search) {
    query.$or = [
      { page: { $regex: search, $options: 'i' } },
      { element: { $regex: search, $options: 'i' } },
      { userAgent: { $regex: search, $options: 'i' } },
      { ipAddress: { $regex: search, $options: 'i' } }
    ];
  }

  console.log('Final query:', JSON.stringify(query, null, 2));

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  console.log('Sort object:', JSON.stringify(sort, null, 2));

  // Calculate pagination
  const skip = (parseInt(pageNum) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  console.log('Pagination - skip:', skip, 'limit:', limitNum);

  // Get total count for pagination
  const totalInteractions = await Interaction.countDocuments(query);
  console.log('Total interactions found:', totalInteractions);

  const totalPages = Math.ceil(totalInteractions / limitNum);

  // Get interactions with pagination
  const interactions = await Interaction.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .select('-__v');

  console.log('Interactions returned:', interactions.length);

  // Get unique values for filters
  const uniqueTypes = await Interaction.distinct('type');
  const uniquePages = await Interaction.distinct('page');

  console.log('Unique types:', uniqueTypes);
  console.log('Unique pages:', uniquePages);

  const result = {
    interactions,
    pagination: {
      currentPage: parseInt(pageNum),
      totalPages,
      totalInteractions,
      hasNextPage: parseInt(pageNum) < totalPages,
      hasPrevPage: parseInt(pageNum) > 1,
      limit: limitNum
    },
    filters: {
      types: uniqueTypes,
      pages: uniquePages
    }
  };

  return res.status(200).json(
    new ApiResponse(200, result, "Interactions retrieved successfully")
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
    new ApiResponse(200, stats, "Interaction statistics retrieved successfully")
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
    new ApiResponse(200, stats, "Resume download statistics retrieved successfully")
  );
});

export {
  trackInteraction,
  trackResumeDownload,
  trackPageVisit,
  trackButtonClick,
  trackFormSubmission,
  getInteractionStats,
  getResumeDownloadStats,
  getAllInteractions
}; 