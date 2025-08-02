# Text-Only Document System

## Overview

This system has been simplified to handle only text documents, removing PDF upload functionality to reduce complexity and errors. Documents are now added through text input and processed for AI interactions.

## Features

- **Text Document Management**: Add, edit, and delete text documents
- **AI Processing**: All documents are automatically processed for embeddings
- **Search Integration**: Documents are searchable through the AI chatbot
- **Simple Interface**: Clean, text-only interface for document management

## API Endpoints

### Documents

- `POST /api/v1/documents/upload` - Upload a new text document
- `GET /api/v1/documents` - Get all documents
- `GET /api/v1/documents/:id` - Get document by ID
- `PATCH /api/v1/documents/:id` - Update document
- `DELETE /api/v1/documents/:id` - Delete document (soft delete)

### Request Format

```json
{
  "title": "Document Title",
  "description": "Optional description",
  "content": "The main content of the document"
}
```

## Document Processing

1. **Text Input**: Users enter document content through text fields
2. **Chunking**: Content is automatically split into manageable chunks
3. **Embedding Generation**: Each chunk is processed into embeddings
4. **Storage**: Embeddings are stored for AI search and retrieval

## Frontend Integration

The DocumentManager component provides:
- Text input forms for document creation
- Document listing and management
- Edit and delete functionality
- Real-time processing status

## Benefits of Text-Only System

- **Reduced Complexity**: No file upload handling
- **Better Performance**: Faster processing without file parsing
- **Easier Maintenance**: Simpler codebase
- **Better User Experience**: Direct text input is more intuitive
- **Future-Proof**: Easy to add PDF parsing later if needed

## Future Enhancements

When PDF functionality is needed in the future:
1. Add PDF parsing libraries (pdf-parse, pdf2pic, etc.)
2. Implement file upload endpoints
3. Add PDF-to-text conversion
4. Integrate with existing text processing pipeline

## Environment Variables

Required environment variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `GEMINI_API_KEY` - Google Gemini API key
- `CORS_ORIGIN` - Frontend URL for CORS

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables
3. Start the server: `npm run dev`
4. Access the document manager through the frontend

## Database Schema

```javascript
{
  title: String (required),
  description: String,
  content: String (required),
  fileType: String (default: 'text'),
  fileSize: Number,
  uploadedBy: ObjectId (ref: 'Admin'),
  isActive: Boolean (default: true),
  timestamps: true
}
``` 