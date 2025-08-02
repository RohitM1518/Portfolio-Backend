import express from 'express';
import { chatBot, generateTitle, generateSuggestedMessages } from '../controllers/geminiController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// Chatbot endpoint
router.post('/chat', asyncHandler(chatBot));

// Generate chat title
router.post('/generate-title', asyncHandler(generateTitle));

// Generate suggested messages
router.post('/suggested-messages', asyncHandler(generateSuggestedMessages));

export default router; 