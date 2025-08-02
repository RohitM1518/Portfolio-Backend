import mongoose from 'mongoose';
import Interaction from './src/models/interactionModel.js';
import dotenv from 'dotenv';

dotenv.config();

const addTestInteractions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing interactions
    await Interaction.deleteMany({});
    console.log('Cleared existing interactions');

    // Create test interactions
    const testInteractions = [
      {
        type: 'page_visit',
        page: 'home',
        element: '',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '192.168.1.1',
        referrer: '',
        sessionId: 'test-session-1',
        metadata: {
          visitTime: new Date()
        },
        timestamp: new Date()
      },
      {
        type: 'button_click',
        page: 'home',
        element: 'download_resume',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '192.168.1.1',
        referrer: '',
        sessionId: 'test-session-1',
        metadata: {
          clickTime: new Date()
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
      },
      {
        type: 'page_visit',
        page: 'about',
        element: '',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ipAddress: '192.168.1.2',
        referrer: 'http://localhost:3000/',
        sessionId: 'test-session-2',
        metadata: {
          visitTime: new Date()
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 10) // 10 minutes ago
      },
      {
        type: 'form_submission',
        page: 'contact',
        element: 'contact_form',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ipAddress: '192.168.1.2',
        referrer: 'http://localhost:3000/about',
        sessionId: 'test-session-2',
        metadata: {
          submissionTime: new Date()
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
      },
      {
        type: 'resume_download',
        page: 'resume',
        element: 'download_button',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '192.168.1.3',
        referrer: '',
        sessionId: 'test-session-3',
        metadata: {
          downloadTime: new Date()
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 20) // 20 minutes ago
      },
      {
        type: 'page_visit',
        page: 'projects',
        element: '',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '192.168.1.3',
        referrer: 'http://localhost:3000/resume',
        sessionId: 'test-session-3',
        metadata: {
          visitTime: new Date()
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 25) // 25 minutes ago
      },
      {
        type: 'button_click',
        page: 'projects',
        element: 'project_card',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '192.168.1.3',
        referrer: 'http://localhost:3000/projects',
        sessionId: 'test-session-3',
        metadata: {
          clickTime: new Date()
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      }
    ];

    // Insert test interactions
    const result = await Interaction.insertMany(testInteractions);
    console.log(`Added ${result.length} test interactions`);

    // Verify the data
    const totalInteractions = await Interaction.countDocuments();
    console.log(`Total interactions in database: ${totalInteractions}`);

    const interactions = await Interaction.find().sort({ timestamp: -1 }).limit(5);
    console.log('Recent interactions:', interactions.map(i => ({
      type: i.type,
      page: i.page,
      timestamp: i.timestamp
    })));

  } catch (error) {
    console.error('Error adding test interactions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

addTestInteractions(); 