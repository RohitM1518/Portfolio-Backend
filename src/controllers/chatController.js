import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import Chat from '../models/chatModel.js';
import { searchSimilarDocuments } from '../utils/documentProcessor.js';
import { chatbotModel } from '../config/geminiConfig.js';

// Send a message and get AI response
const sendMessage = asyncHandler(async (req, res) => {
    const { message, sessionId } = req.body;
    
    if (!message || !sessionId) {
        throw new ApiError(400, "Message and sessionId are required");
    }
    
    // Find or create chat session
    let chat = await Chat.findOne({ sessionId });
    if (!chat) {
        chat = await Chat.create({
            sessionId,
            messages: []
        });
    }
    
    // Add user message to chat
    chat.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date()
    });
    
    // Search for relevant documents
    const relevantDocs = await searchSimilarDocuments(message, 3);
    
    // Create context from relevant documents
    let context = "";
    if (relevantDocs.length > 0) {
        context = "Based on the following information:\n\n";
        relevantDocs.forEach((doc, index) => {
            context += `${index + 1}. ${doc.content}\n\n`;
        });
    }
    
    // Generate AI response using Gemini
    let aiResponse;
    try {
        // Create chat history for Gemini (only if there are previous messages)
        let history = [];
        if (chat.messages.length > 1) { // More than just the current user message
            history = chat.messages.slice(0, -1)
                .filter(msg => msg.content && msg.content.trim().length > 0) // Only include messages with content
                .map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : msg.role,
                    parts: [{ text: msg.content.trim() }]
                }));
        }

        console.log('Chat history for Gemini:', JSON.stringify(history, null, 2));

        // Start chat session
        const geminiChat = chatbotModel.startChat({
            history: history
        });

        // Generate response with context
        const result = await geminiChat.sendMessage(
            `${message}\n\nContext from portfolio documents:\n${context}\n\nPlease provide a helpful response based on the portfolio information and context provided.`
        );
        
        aiResponse = result.response.text();
    } catch (error) {
        console.error("Gemini API error:", error);
        aiResponse = "I apologize, but I'm having trouble processing your request right now. Please try again later.";
    }
    
    // Add AI response to chat
    chat.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
    });
    
    // Save chat
    await chat.save();
    
    res.status(200).json(
        new ApiResponse(200, {
            message: aiResponse,
            sessionId: chat.sessionId,
            messageId: chat.messages[chat.messages.length - 1]._id,
            relevantDocuments: relevantDocs
        }, "Message sent successfully")
    );
});

// Get chat history
const getChatHistory = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const chat = await Chat.findOne({ sessionId });
    
    if (!chat) {
        return res.status(200).json(
            new ApiResponse(200, { messages: [] }, "No chat history found")
        );
    }
    
    res.status(200).json(
        new ApiResponse(200, {
            messages: chat.messages,
            sessionId: chat.sessionId
        }, "Chat history retrieved successfully")
    );
});

// Clear chat history
const clearChatHistory = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const chat = await Chat.findOne({ sessionId });
    
    if (!chat) {
        throw new ApiError(404, "Chat session not found");
    }
    
    chat.messages = [];
    await chat.save();
    
    res.status(200).json(
        new ApiResponse(200, {}, "Chat history cleared successfully")
    );
});

export {
    sendMessage,
    getChatHistory,
    clearChatHistory
}; 