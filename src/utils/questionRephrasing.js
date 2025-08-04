import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gets the initialized chatbot model
 * @returns {Object} - The initialized chatbot model
 */
function getChatbotModel() {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: "You are an expert at rephrasing questions to improve document retrieval for a portfolio database.",
    });
}

/**
 * Rephrases a user question to improve document retrieval
 * @param {string} originalQuestion - The original user question
 * @returns {Promise<string>} - The rephrased question
 */
export async function rephraseQuestion(originalQuestion) {
    try {
        const model = getChatbotModel();
        
        const rephrasingPrompt = `You are an expert at rephrasing questions to improve document retrieval. 
        
Your task is to rephrase the user's question to make it more comprehensive and search-friendly for retrieving relevant information from a portfolio database.

Guidelines for rephrasing:
1. Expand the question to include related concepts and synonyms
2. Add context-specific terms that might be in portfolio documents
3. Include both specific and general aspects of the question
4. Maintain the original intent while making it more searchable
5. Consider technical terms, skills, projects, and experiences that might be relevant

Original Question: "${originalQuestion}"

Please provide a rephrased version that would help retrieve the most relevant portfolio information. 
Return only the rephrased question, nothing else.`;

        const result = await model.generateContent(rephrasingPrompt);
        const rephrasedQuestion = result.response.text().trim();
        
        console.log('Question rephrasing:', {
            original: originalQuestion,
            rephrased: rephrasedQuestion
        });
        
        return rephrasedQuestion;
    } catch (error) {
        console.error('Error rephrasing question:', error);
        // Fallback to original question if rephrasing fails
        return originalQuestion;
    }
}

/**
 * Rephrases a user question with chat history context
 * @param {string} originalQuestion - The original user question
 * @param {Array} chatHistory - Previous chat messages for context
 * @returns {Promise<string>} - The rephrased question
 */
export async function rephraseQuestionWithContext(originalQuestion, chatHistory = []) {
    try {
        const model = getChatbotModel();
        
        // Create context from chat history
        let contextPrompt = '';
        if (chatHistory.length > 0) {
            const recentMessages = chatHistory.slice(-4); // Last 4 messages for context
            contextPrompt = `Previous conversation context:\n${recentMessages.map(msg => 
                `${msg.role}: ${msg.content}`
            ).join('\n')}\n\n`;
        }

        const rephrasingPrompt = `You are an expert at rephrasing questions to improve document retrieval. 
        
Your task is to rephrase the user's question to make it more comprehensive and search-friendly for retrieving relevant information from a portfolio database.

${contextPrompt}Guidelines for rephrasing:
1. Expand the question to include related concepts and synonyms
2. Add context-specific terms that might be in portfolio documents
3. Include both specific and general aspects of the question
4. Maintain the original intent while making it more searchable
5. Consider technical terms, skills, projects, and experiences that might be relevant
6. Use context from previous conversation to make the rephrasing more relevant

Original Question: "${originalQuestion}"

Please provide a rephrased version that would help retrieve the most relevant portfolio information. 
Return only the rephrased question, nothing else.`;

        const result = await model.generateContent(rephrasingPrompt);
        const rephrasedQuestion = result.response.text().trim();
        
        console.log('Question rephrasing with context:', {
            original: originalQuestion,
            rephrased: rephrasedQuestion,
            contextLength: chatHistory.length
        });
        
        return rephrasedQuestion;
    } catch (error) {
        console.error('Error rephrasing question with context:', error);
        // Fallback to original question if rephrasing fails
        return originalQuestion;
    }
} 