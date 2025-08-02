import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleAIFileManager } from "@google/generative-ai/server";

let model;
let fileManager;
let genAI;
let chatbotModel;

//Model for chatbot
const configChatbotModel = () => {
    if (!genAI) {
        throw new Error('Gemini AI not initialized. Please call configGemini() first.');
    }
    chatbotModel = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: "You are a helpful AI assistant for a portfolio website. You help users with their queries about the portfolio owner's skills, projects, and experience.",
    });
    return chatbotModel;
}

//Model for regular purpose
const configGemini = () => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    
    try {
        fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "You are a helpful AI assistant for a portfolio website. You help users with their queries about the portfolio owner's skills, projects, and experience.",
        });
        chatbotModel = configChatbotModel();
        console.log('✅ Gemini AI initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing Gemini AI:', error);
        throw error;
    }
}

export { model, configGemini, fileManager, chatbotModel }; 