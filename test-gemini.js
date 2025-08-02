import dotenv from 'dotenv';
import { configGemini, chatbotModel } from './src/config/geminiConfig.js';

dotenv.config({
  path: './.env'
});

console.log('Testing Gemini configuration...');

try {
  // Initialize Gemini
  configGemini();
  
  // Test simple chat
  const chat = chatbotModel.startChat();
  const result = await chat.sendMessage("Hello! Can you tell me about yourself?");
  
  console.log('✅ Gemini test successful!');
  console.log('Response:', result.response.text());
  
} catch (error) {
  console.error('❌ Gemini test failed:', error);
} 