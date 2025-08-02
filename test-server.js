import dotenv from 'dotenv';
import { configGemini } from './src/config/geminiConfig.js';

dotenv.config({
  path: './.env'
});

console.log('Testing server configuration...');

// Test Gemini configuration
if (process.env.GEMINI_API_KEY) {
  try {
    configGemini();
    console.log('✅ Gemini AI initialized successfully');
  } catch (error) {
    console.log('❌ Gemini AI initialization failed:', error.message);
  }
} else {
  console.log('⚠️ GEMINI_API_KEY not found, Gemini AI will not be available');
}

// Test document processor
try {
  const { processDocument, searchSimilarDocuments } = await import('./src/utils/documentProcessor.js');
  console.log('✅ Document processor imported successfully');
} catch (error) {
  console.log('❌ Document processor import failed:', error.message);
}

console.log('Server configuration test completed'); 