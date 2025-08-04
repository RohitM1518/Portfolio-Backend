import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';
import Interaction from '../models/interactionModel.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import Chat from '../models/chatModel.js';

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

  // Chatbot Analytics
  const totalChatSessions = await Chat.countDocuments();
  const recentChatSessions = await Chat.countDocuments({
    createdAt: { $gte: startDate }
  });

  // Total chat messages
  const totalChatMessages = await Chat.aggregate([
    {
      $project: {
        messageCount: { $size: "$messages" }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$messageCount" }
      }
    }
  ]);

  const totalMessages = totalChatMessages.length > 0 ? totalChatMessages[0].total : 0;

  // Recent chat messages
  const recentChatMessages = await Chat.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $project: {
        messageCount: { $size: "$messages" }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$messageCount" }
      }
    }
  ]);

  const recentMessages = recentChatMessages.length > 0 ? recentChatMessages[0].total : 0;

  // Chat interactions by day
  const dailyChatInteractions = await Chat.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        sessions: { $sum: 1 },
        messages: { $sum: { $size: "$messages" } }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Recent chat conversations (last 5)
  const recentChats = await Chat.find()
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('sessionId messages createdAt updatedAt');

  // Process recent chats for summary
  const chatSummaries = recentChats.map(chat => {
    const userMessages = chat.messages.filter(msg => msg.role === 'user');
    const aiMessages = chat.messages.filter(msg => msg.role === 'assistant');
    
    return {
      sessionId: chat.sessionId,
      userMessageCount: userMessages.length,
      aiMessageCount: aiMessages.length,
      totalMessages: chat.messages.length,
      firstUserMessage: userMessages[0]?.content?.substring(0, 50) + '...' || 'No user messages',
      lastMessage: chat.messages[chat.messages.length - 1]?.content?.substring(0, 50) + '...' || 'No messages',
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      duration: chat.messages.length > 1 ? 
        Math.round((new Date(chat.updatedAt) - new Date(chat.createdAt)) / 1000 / 60) : 0 // minutes
    };
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
    // Chatbot Analytics
    chatbot: {
      totalSessions: totalChatSessions,
      recentSessions: recentChatSessions,
      totalMessages,
      recentMessages,
      dailyInteractions: dailyChatInteractions,
      recentConversations: chatSummaries
    },
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

const getChangesSinceLastLogin = asyncHandler(async (req, res) => {
  const admin = req.admin;
  
  if (!admin.lastLogin) {
    return res.status(200).json(
      new ApiResponse(200, { changes: [], message: "No previous login found" }, "No previous login data")
    );
  }

  const lastLogin = new Date(admin.lastLogin);
  const currentTime = new Date();

  // Get all interactions since last login
  const interactionsSinceLastLogin = await Interaction.find({
    timestamp: { $gte: lastLogin }
  }).sort({ timestamp: -1 });

  // Get chat sessions since last login
  const chatSessionsSinceLastLogin = await Chat.find({
    createdAt: { $gte: lastLogin }
  }).sort({ createdAt: -1 });

  // Get resume downloads since last login
  const resumeDownloadsSinceLastLogin = await Interaction.find({
    type: 'resume_download',
    timestamp: { $gte: lastLogin }
  }).sort({ timestamp: -1 });

  // Get page visits since last login
  const pageVisitsSinceLastLogin = await Interaction.find({
    type: 'page_visit',
    timestamp: { $gte: lastLogin }
  }).sort({ timestamp: -1 });

  // Calculate KPIs since last login
  const totalInteractions = interactionsSinceLastLogin.length;
  const totalChatSessions = chatSessionsSinceLastLogin.length;
  const totalResumeDownloads = resumeDownloadsSinceLastLogin.length;
  const totalPageVisits = pageVisitsSinceLastLogin.length;

  // Get unique visitors since last login
  const uniqueVisitors = await Interaction.aggregate([
    {
      $match: {
        timestamp: { $gte: lastLogin }
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

  // Get interactions by type since last login
  const interactionsByType = await Interaction.aggregate([
    {
      $match: {
        timestamp: { $gte: lastLogin }
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

  // Get page visits breakdown since last login
  const pageVisitsBreakdown = await Interaction.aggregate([
    {
      $match: {
        type: "page_visit",
        timestamp: { $gte: lastLogin }
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
    }
  ]);

  // Get hourly activity since last login
  const hourlyActivity = await Interaction.aggregate([
    {
      $match: {
        timestamp: { $gte: lastLogin }
      }
    },
    {
      $group: {
        _id: {
          hour: { $hour: "$timestamp" },
          date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.date": 1, "_id.hour": 1 }
    }
  ]);

  // Calculate time difference
  const timeDiff = currentTime - lastLogin;
  const hoursSinceLastLogin = Math.floor(timeDiff / (1000 * 60 * 60));
  const daysSinceLastLogin = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  const changes = {
    timeSinceLastLogin: {
      hours: hoursSinceLastLogin,
      days: daysSinceLastLogin,
      lastLogin: lastLogin,
      currentTime: currentTime
    },
    kpis: {
      totalInteractions,
      totalChatSessions,
      totalResumeDownloads,
      totalPageVisits,
      uniqueVisitors: uniqueVisitorsCount,
      averageInteractionsPerHour: hoursSinceLastLogin > 0 ? (totalInteractions / hoursSinceLastLogin).toFixed(2) : 0
    },
    interactionsByType,
    pageVisitsBreakdown,
    hourlyActivity,
    recentInteractions: interactionsSinceLastLogin.slice(0, 20), // Last 20 interactions
    recentChatSessions: chatSessionsSinceLastLogin.slice(0, 10), // Last 10 chat sessions
    recentResumeDownloads: resumeDownloadsSinceLastLogin.slice(0, 10) // Last 10 resume downloads
  };

  return res.status(200).json(
    new ApiResponse(200, { changes }, "Changes since last login retrieved successfully")
  );
});

const getEnhancedDashboardStats = asyncHandler(async (req, res) => {
  // Get date range for filtering (last 30 days by default)
  const days = parseInt(req.query.days) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get admin's last login for comparison
  const admin = req.admin;
  const lastLogin = admin.lastLogin ? new Date(admin.lastLogin) : null;

  // Total interactions
  const totalInteractions = await Interaction.countDocuments();

  // Recent interactions (last 30 days)
  const recentInteractions = await Interaction.countDocuments({
    timestamp: { $gte: startDate }
  });

  // Interactions since last login (if available)
  const interactionsSinceLastLogin = lastLogin ? 
    await Interaction.countDocuments({
      timestamp: { $gte: lastLogin }
    }) : 0;

  // Resume downloads (total)
  const totalResumeDownloads = await Interaction.countDocuments({
    type: 'resume_download'
  });

  // Recent resume downloads (last 30 days)
  const recentResumeDownloads = await Interaction.countDocuments({
    type: 'resume_download',
    timestamp: { $gte: startDate }
  });

  // Resume downloads since last login
  const resumeDownloadsSinceLastLogin = lastLogin ? 
    await Interaction.countDocuments({
      type: 'resume_download',
      timestamp: { $gte: lastLogin }
    }) : 0;

  // Chatbot Analytics
  const totalChatSessions = await Chat.countDocuments();
  const recentChatSessions = await Chat.countDocuments({
    createdAt: { $gte: startDate }
  });

  const chatSessionsSinceLastLogin = lastLogin ? 
    await Chat.countDocuments({
      createdAt: { $gte: lastLogin }
    }) : 0;

  // Total chat messages
  const totalChatMessages = await Chat.aggregate([
    {
      $project: {
        messageCount: { $size: "$messages" }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$messageCount" }
      }
    }
  ]);

  const totalMessages = totalChatMessages.length > 0 ? totalChatMessages[0].total : 0;

  // Recent chat messages
  const recentChatMessages = await Chat.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $project: {
        messageCount: { $size: "$messages" }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$messageCount" }
      }
    }
  ]);

  const recentMessages = recentChatMessages.length > 0 ? recentChatMessages[0].total : 0;

  // Messages since last login
  const messagesSinceLastLogin = lastLogin ? await Chat.aggregate([
    {
      $match: {
        createdAt: { $gte: lastLogin }
      }
    },
    {
      $project: {
        messageCount: { $size: "$messages" }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$messageCount" }
      }
    }
  ]) : [];

  const messagesSinceLogin = messagesSinceLastLogin.length > 0 ? messagesSinceLastLogin[0].total : 0;

  // Chat interactions by day
  const dailyChatInteractions = await Chat.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        sessions: { $sum: 1 },
        messages: { $sum: { $size: "$messages" } }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Recent chat conversations (last 5)
  const recentChats = await Chat.find()
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('sessionId messages createdAt updatedAt');

  // Process recent chats for summary
  const chatSummaries = recentChats.map(chat => {
    const userMessages = chat.messages.filter(msg => msg.role === 'user');
    const aiMessages = chat.messages.filter(msg => msg.role === 'assistant');
    
    return {
      sessionId: chat.sessionId,
      userMessageCount: userMessages.length,
      aiMessageCount: aiMessages.length,
      totalMessages: chat.messages.length,
      firstUserMessage: userMessages[0]?.content?.substring(0, 50) + '...' || 'No user messages',
      lastMessage: chat.messages[chat.messages.length - 1]?.content?.substring(0, 50) + '...' || 'No messages',
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      duration: chat.messages.length > 1 ? 
        Math.round((new Date(chat.updatedAt) - new Date(chat.createdAt)) / 1000 / 60) : 0 // minutes
    };
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

  // Calculate growth rates
  const previousPeriodStart = new Date(startDate);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
  
  const previousInteractions = await Interaction.countDocuments({
    timestamp: { $gte: previousPeriodStart, $lt: startDate }
  });

  const previousResumeDownloads = await Interaction.countDocuments({
    type: 'resume_download',
    timestamp: { $gte: previousPeriodStart, $lt: startDate }
  });

  const previousChatSessions = await Chat.countDocuments({
    createdAt: { $gte: previousPeriodStart, $lt: startDate }
  });

  // Calculate growth percentages
  const interactionGrowth = previousInteractions > 0 ? 
    ((recentInteractions - previousInteractions) / previousInteractions * 100).toFixed(2) : 0;
  
  const resumeDownloadGrowth = previousResumeDownloads > 0 ? 
    ((recentResumeDownloads - previousResumeDownloads) / previousResumeDownloads * 100).toFixed(2) : 0;
  
  const chatSessionGrowth = previousChatSessions > 0 ? 
    ((recentChatSessions - previousChatSessions) / previousChatSessions * 100).toFixed(2) : 0;

  const stats = {
    totalInteractions,
    recentInteractions,
    interactionsSinceLastLogin,
    totalResumeDownloads,
    recentResumeDownloads,
    resumeDownloadsSinceLastLogin,
    // Chatbot Analytics
    chatbot: {
      totalSessions: totalChatSessions,
      recentSessions: recentChatSessions,
      chatSessionsSinceLastLogin,
      totalMessages,
      recentMessages,
      messagesSinceLastLogin,
      dailyInteractions: dailyChatInteractions,
      recentConversations: chatSummaries
    },
    uniqueVisitors: uniqueVisitorsCount,
    interactionsByType,
    pageVisits,
    dailyInteractions,
    recentActivity,
    growth: {
      interactions: interactionGrowth,
      resumeDownloads: resumeDownloadGrowth,
      chatSessions: chatSessionGrowth
    },
    dateRange: {
      start: startDate,
      end: new Date(),
      days
    },
    lastLogin: admin.lastLogin
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, stats, "Enhanced dashboard stats retrieved successfully")
    );
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

const getChatConversations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, ipAddress, startDate, endDate, sessionId } = req.query;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  
  if (ipAddress) {
    query.ipAddress = { $regex: ipAddress, $options: 'i' };
  }
  
  if (sessionId) {
    query.sessionId = { $regex: sessionId, $options: 'i' };
  }
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // Get total count
  const totalConversations = await Chat.countDocuments(query);

  // Get conversations with pagination
  const conversations = await Chat.find(query)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('sessionId messages ipAddress userAgent createdAt updatedAt');

  // Process conversations for detailed view
  const detailedConversations = conversations.map(chat => {
    const userMessages = chat.messages.filter(msg => msg.role === 'user');
    const aiMessages = chat.messages.filter(msg => msg.role === 'assistant');
    
    return {
      sessionId: chat.sessionId,
      ipAddress: chat.ipAddress,
      userAgent: chat.userAgent,
      userMessageCount: userMessages.length,
      aiMessageCount: aiMessages.length,
      totalMessages: chat.messages.length,
      firstUserMessage: userMessages[0]?.content || 'No user messages',
      lastMessage: chat.messages[chat.messages.length - 1]?.content || 'No messages',
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      duration: chat.messages.length > 1 ? 
        Math.round((new Date(chat.updatedAt) - new Date(chat.createdAt)) / 1000 / 60) : 0,
      messages: chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        // Include original and rephrased questions for user messages
        ...(msg.role === 'user' && msg.originalQuestion && {
          originalQuestion: msg.originalQuestion,
          rephrasedQuestion: msg.rephrasedQuestion
        }),
        // Include RAG results only for assistant messages
        ...(msg.role === 'assistant' && msg.ragResults && {
          ragResults: msg.ragResults.map(doc => ({
            content: doc.content,
            similarity: doc.similarity,
            document: doc.document,
            documentTitle: doc.documentTitle,
            pageNumber: doc.pageNumber
          }))
        })
      }))
    };
  });

  // Get unique IP addresses for filter dropdown
  const uniqueIPs = await Chat.distinct('ipAddress');

  const result = {
    conversations: detailedConversations,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalConversations / limit),
      totalConversations,
      hasNextPage: skip + conversations.length < totalConversations,
      hasPrevPage: page > 1
    },
    filters: {
      uniqueIPs
    }
  };

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Chat conversations retrieved successfully"));
});

export {
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
  getCurrentAdmin,
  getDashboardStats,
  getInteractionDetails,
  getChatConversations,
  getChangesSinceLastLogin,
  getEnhancedDashboardStats
}; 