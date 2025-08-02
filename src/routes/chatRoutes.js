import express from 'express';
import {
    sendMessage,
    sendMessageNonStreaming,
    getChatHistory,
    clearChatHistory
} from '../controllers/chatController.js';

const router = express.Router();

// Chat routes (no authentication required for public chat)
router.post('/send', sendMessage); // Streaming endpoint
router.post('/send-non-streaming', sendMessageNonStreaming); // Non-streaming fallback
router.get('/history/:sessionId', getChatHistory);
router.delete('/history/:sessionId', clearChatHistory);

export default router; 