import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';
import Interaction from '../models/interactionModel.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const generateAccessAndRefreshTokens = async (adminId) => {
  try {
    const admin = await Admin.findById(adminId);
    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token");
  }
};

const loginAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, "Username and password are required");
  }

  const admin = await Admin.findOne({ username: username.toLowerCase() });

  if (!admin) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordValid = await admin.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!admin.isActive) {
    throw new ApiError(401, "Account is deactivated");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(admin._id);

  // Update last login
  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });

  const loggedInAdmin = admin.getPublicProfile();

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          admin: loggedInAdmin,
          accessToken,
          refreshToken,
        },
        "Admin logged in successfully"
      )
    );
});

const logoutAdmin = asyncHandler(async (req, res) => {
  await Admin.findByIdAndUpdate(
    req.admin._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Admin logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const admin = await Admin.findById(decodedToken?._id);

    if (!admin) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== admin?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(admin._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const getCurrentAdmin = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.admin, "Admin fetched successfully"));
});

const getDashboardStats = asyncHandler(async (req, res) => {
  // Get date range for filtering (last 30 days by default)
  const days = parseInt(req.query.days) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Total interactions
  const totalInteractions = await Interaction.countDocuments();

  // Recent interactions (last 30 days)
  const recentInteractions = await Interaction.countDocuments({
    timestamp: { $gte: startDate }
  });

  // Resume downloads (total)
  const totalResumeDownloads = await Interaction.countDocuments({
    type: 'resume_download'
  });

  // Recent resume downloads (last 30 days)
  const recentResumeDownloads = await Interaction.countDocuments({
    type: 'resume_download',
    timestamp: { $gte: startDate }
  });

  // Interactions by type
  const interactionsByType = await Interaction.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Page visits
  const pageVisits = await Interaction.aggregate([
    {
      $match: {
        type: "page_visit",
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: "$page",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Daily interactions for chart
  const dailyInteractions = await Interaction.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Recent activity (last 10 interactions)
  const recentActivity = await Interaction.find()
    .sort({ timestamp: -1 })
    .limit(10)
    .select('type page element timestamp userAgent ipAddress');

  // Unique visitors (by IP + User Agent combination for better accuracy)
  const uniqueVisitors = await Interaction.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          ipAddress: "$ipAddress",
          userAgent: "$userAgent"
        }
      }
    },
    {
      $count: "uniqueVisitors"
    }
  ]);

  const uniqueVisitorsCount = uniqueVisitors.length > 0 ? uniqueVisitors[0].uniqueVisitors : 0;

  const stats = {
    totalInteractions,
    recentInteractions,
    totalResumeDownloads,
    recentResumeDownloads,
    uniqueVisitors: uniqueVisitorsCount,
    interactionsByType,
    pageVisits,
    dailyInteractions,
    recentActivity,
    dateRange: {
      start: startDate,
      end: new Date(),
      days
    }
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Dashboard stats fetched successfully"));
});

const getInteractionDetails = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, page: pageName, startDate, endDate } = req.query;

  const query = {};

  if (type) query.type = type;
  if (pageName) query.page = pageName;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const interactions = await Interaction.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('-__v');

  const total = await Interaction.countDocuments(query);

  return res
    .status(200)
    .json(new ApiResponse(200, {
      interactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, "Interactions fetched successfully"));
});

export {
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
  getCurrentAdmin,
  getDashboardStats,
  getInteractionDetails
}; 