import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import interactionRoutes from './routes/interactionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import geminiRoutes from './routes/geminiRoutes.js';
import errorHandler from './middlewares/errorHandler.js';
import { conditionalIpLogger } from './middlewares/ipLogger.js';
import { getIPInfo, getClientIP, sanitizeIP } from './utils/ipUtils.js';
import { configGemini } from './config/geminiConfig.js';

dotenv.config({
  path: './.env'
});

// Initialize Gemini configuration
if (process.env.GEMINI_API_KEY) {
  configGemini();
  console.log('Gemini AI initialized successfully');
} else {
  console.log('GEMINI_API_KEY not found, Gemini AI will not be available');
}

const app = express();

// Trust proxy to get real IP address
app.set('trust proxy', true);

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Serve static files from public directory
app.use(express.static("public"));

// Parse cookies
app.use(cookieParser());

// IP Logger middleware (for debugging)
app.use(conditionalIpLogger);

// Test endpoint to verify IP address capture
app.get('/api/v1/test-ip', (req, res) => {
  const ipInfo = getIPInfo(req);
  const sanitizedIP = sanitizeIP(getClientIP(req));
  
  res.status(200).json({
    success: true,
    message: 'IP address test',
    data: {
      ...ipInfo,
      sanitizedIP,
      isLocalhost: sanitizedIP === '127.0.0.1' || sanitizedIP === '::1',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Routes
app.use('/api/v1/interactions', interactionRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/gemini', geminiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Portfolio Backend is running' });
});

// 404 Error handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

export { app }; 