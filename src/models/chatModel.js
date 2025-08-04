import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Store original and rephrased questions for user messages
  originalQuestion: {
    type: String,
    default: undefined // Only set for user messages
  },
  rephrasedQuestion: {
    type: String,
    default: undefined // Only set for user messages
  },
  // RAG results for assistant messages only
  ragResults: {
    type: [{
      content: String,
      similarity: Number,
      document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
      },
      documentTitle: String, // Add document title
      pageNumber: Number
    }],
    default: undefined // Only set for assistant messages
  }
});

const chatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  messages: [messageSchema],
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Chat = mongoose.model('Chat', chatSchema);
export default Chat; 