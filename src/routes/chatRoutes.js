import express from 'express';
import {
    sendMessage,
    getChatHistory,
    clearChatHistory
} from '../controllers/chatController.js';

const router = express.Router();

// Chat routes (no authentication required for public chat)
router.post('/send', sendMessage);
router.get('/history/:sessionId', getChatHistory);
router.delete('/history/:sessionId', clearChatHistory);

export default router; 