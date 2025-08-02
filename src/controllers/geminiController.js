import asyncHandler from "../utils/asyncHandler.js";
import APIError from "../utils/apiError.js";
import APIResponse from "../utils/apiResponse.js";
import { model, chatbotModel } from "../config/geminiConfig.js";
import { searchSimilarDocuments } from '../utils/documentProcessor.js';

const chatBot = async (req, res) => {
    const { prompt, messages = [] } = req.body;
    
    if (!prompt) {
        throw new APIError(400, "Prompt is required");
    }

    try {
        // Get relevant documents using RAG
        const relevantDocs = await searchSimilarDocuments(prompt, 3);
        let context = "";
        
        if (relevantDocs.length > 0) {
            context = relevantDocs.map(doc => doc.content).join('\n\n');
        }

        // Create chat history
        const history = messages
            .filter(msg => msg.message && msg.message.trim().length > 0) // Only include messages with content
            .map(msg => ({
                role: msg.role === 'assistant' ? 'model' : msg.role,
                parts: [{ text: msg.message.trim() }]
            }));

        // Start chat session
        const chat = chatbotModel.startChat({
            history: history
        });

        // Generate response with context
        const result = await chat.sendMessage(
            `${prompt}\n\nContext from portfolio documents:\n${context}\n\nPlease provide a helpful response based on the portfolio information and context provided.`
        );

        return res.status(200).json(
            new APIResponse(200, { 
                response: result.response.text(),
                relevantDocuments: relevantDocs
            }, "Response generated successfully")
        );

    } catch (error) {
        console.error("ChatBot error:", error);
        throw new APIError(500, "Error generating response");
    }
};

const generateTitle = async (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt) {
        throw new APIError(400, "Prompt is required");
    }

    try {
        const titlePrompt = prompt + " Generate an exact one title for this chat without any extra information and maximum of 5 words";
        const title = await model.generateContent(titlePrompt);
        
        return res.status(200).json(
            new APIResponse(200, { 
                title: title.response.text() 
            }, "Title generated successfully")
        );

    } catch (error) {
        console.error("Title generation error:", error);
        throw new APIError(500, "Error generating title");
    }
};

const generateSuggestedMessages = async (req, res) => {
    const { messages } = req.body;
    
    if (!messages || messages.length === 0) {
        throw new APIError(400, "Messages are required");
    }

    try {
        const generationConfig = {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
        };

        const messageText = messages.map(msg => msg.message).join('\n');
        const chatSession = model.startChat({
            generationConfig,
            history: [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": messageText + " These are the user's last asked questions. Based on this, generate 6 suggested questions that the user may ask in the future. Return only the questions in a JSON array format without any extra text."
                        }
                    ]
                }
            ]
        });

        const result = await chatSession.sendMessage("Generate 6 suggested follow-up questions based on the conversation context");
        
        return res.status(200).json(
            new APIResponse(200, { 
                suggestedQuestions: result.response.text() 
            }, "Suggested questions generated successfully")
        );

    } catch (error) {
        console.error("Suggested messages error:", error);
        throw new APIError(500, "Error generating suggested messages");
    }
};

export {
    chatBot,
    generateTitle,
    generateSuggestedMessages
}; 