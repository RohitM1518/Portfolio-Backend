import dotenv from 'dotenv';
import { rephraseQuestion, rephraseQuestionWithContext } from './src/utils/questionRephrasing.js';

// Load environment variables
dotenv.config();

// Test questions
const testQuestions = [
    "What projects have you worked on?",
    "Tell me about your skills",
    "What is your experience with React?",
    "How long have you been programming?",
    "What technologies do you know?"
];

// Test chat history
const testChatHistory = [
    { role: 'user', content: 'Hi, I want to know about your portfolio' },
    { role: 'assistant', content: 'Hello! I\'d be happy to tell you about my portfolio. I have experience in web development, mobile apps, and various programming languages.' },
    { role: 'user', content: 'What projects have you worked on?' }
];

async function testQuestionRephrasing() {
    console.log('🧪 Testing Question Rephrasing\n');
    
    // Check if GEMINI_API_KEY is set
    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY is not set in environment variables');
        return;
    }
    
    for (let i = 0; i < testQuestions.length; i++) {
        const question = testQuestions[i];
        console.log(`\n--- Test ${i + 1} ---`);
        console.log(`Original: "${question}"`);
        
        try {
            // Test without context
            const rephrased = await rephraseQuestion(question);
            console.log(`Rephrased: "${rephrased}"`);
            
            // Test with context
            const rephrasedWithContext = await rephraseQuestionWithContext(question, testChatHistory);
            console.log(`With Context: "${rephrasedWithContext}"`);
            
        } catch (error) {
            console.error(`❌ Error rephrasing question: ${error.message}`);
        }
    }
    
    console.log('\n✅ Question rephrasing test completed');
}

// Run the test
testQuestionRephrasing().catch(console.error); 