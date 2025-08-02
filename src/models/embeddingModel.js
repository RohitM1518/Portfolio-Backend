import mongoose from 'mongoose';

const embeddingSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  chunkIndex: {
    type: Number,
    required: true
  },
  pageNumber: {
    type: Number
  }
}, {
  timestamps: true
});

// Create a compound index for efficient vector search
embeddingSchema.index({ embedding: 1 });
embeddingSchema.index({ document: 1, chunkIndex: 1 });

const Embedding = mongoose.model('Embedding', embeddingSchema);
export default Embedding; 