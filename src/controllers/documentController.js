import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import Document from '../models/documentModel.js';
import { processDocument } from '../utils/documentProcessor.js';

// Stream document processing logs
const streamDocumentLogs = asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    
    console.log('SSE connection request:', {
        documentId,
        headers: req.headers,
        method: req.method,
        url: req.url
    });
    
    // For EventSource, we can't use Authorization header, so we'll skip auth for now
    // In production, you might want to use a different approach like query parameters
    
    // Set headers for Server-Sent Events
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
    });

    // Send initial connection message
    const initialMessage = {
        type: 'info',
        message: '🔌 Connected to document processing stream',
        timestamp: new Date().toISOString()
    };
    
    console.log('Sending initial SSE message:', initialMessage);
    res.write(`data: ${JSON.stringify(initialMessage)}\n\n`);

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
        if (!res.destroyed) {
            const heartbeatMessage = {
                type: 'info',
                message: '💓 Connection heartbeat',
                timestamp: new Date().toISOString()
            };
            res.write(`data: ${JSON.stringify(heartbeatMessage)}\n\n`);
        }
    }, 30000);

    // Store the response object for later use
    if (!global.processingStreams) {
        global.processingStreams = new Map();
    }
    global.processingStreams.set(documentId, res);
    console.log('Stored SSE stream for documentId:', documentId);

    // Handle client disconnect
    req.on('close', () => {
        console.log('SSE client disconnected for documentId:', documentId);
        clearInterval(heartbeatInterval);
        if (global.processingStreams) {
            global.processingStreams.delete(documentId);
        }
    });
});

// Helper function to send logs to connected clients
export const sendProcessingLog = (documentId, message, type = 'info') => {
    if (!global.processingStreams) {
        global.processingStreams = new Map();
    }
    
    const res = global.processingStreams.get(documentId);
    
    console.log('sendProcessingLog called:', {
        documentId,
        message,
        type,
        hasStream: !!res,
        streamDestroyed: res?.destroyed
    });
    
    if (res && !res.destroyed) {
        const logData = {
            type,
            message,
            timestamp: new Date().toISOString()
        };
        
        console.log('Sending log to client:', logData);
        res.write(`data: ${JSON.stringify(logData)}\n\n`);
    } else {
        console.log('No active stream found for documentId:', documentId);
    }
};

// Upload and process a new document
const uploadDocument = asyncHandler(async (req, res) => {
    const { title, description, content } = req.body;
    
    if (!title) {
        throw new ApiError(400, "Title is required");
    }
    
    if (!content) {
        throw new ApiError(400, "Content is required");
    }
    
    console.log('Text document upload details:', {
        title,
        description,
        contentLength: content.length
    });
    
    try {
        // Create document record with text content
        const document = await Document.create({
            title,
            description: description || '',
            content: content,
            fileType: 'text',
            fileSize: content.length,
            uploadedBy: req.admin._id
        });
        
        // Send initial processing log
        sendProcessingLog(document._id.toString(), '🚀 Starting document upload process...', 'info');
        sendProcessingLog(document._id.toString(), `📝 Document title: "${title}"`, 'info');
        sendProcessingLog(document._id.toString(), `📊 Content length: ${content.length} characters`, 'info');
        
        // Process the document for embeddings
        try {
            await processDocument(document._id, content, document._id.toString());
            console.log('Document processing completed successfully');
            
            // Send completion log
            sendProcessingLog(document._id.toString(), '✅ Document processing completed successfully!', 'success');
            sendProcessingLog(document._id.toString(), '🤖 Document is now ready for AI interactions', 'success');
            
            res.status(201).json(
                new ApiResponse(201, document, "Document uploaded and processed successfully")
            );
        } catch (error) {
            // If processing fails, delete the document record
            await Document.findByIdAndDelete(document._id);
            sendProcessingLog(document._id.toString(), `❌ Processing failed: ${error.message}`, 'error');
            throw new ApiError(500, "Failed to process document: " + error.message);
        }
    } catch (error) {
        throw error;
    }
});

// Get all documents
const getAllDocuments = asyncHandler(async (req, res) => {
    const documents = await Document.find({ isActive: true })
        .populate('uploadedBy', 'username email')
        .sort({ createdAt: -1 });
    
    res.status(200).json(
        new ApiResponse(200, documents, "Documents retrieved successfully")
    );
});

// Get document by ID
const getDocumentById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const document = await Document.findById(id)
        .populate('uploadedBy', 'username email');
    
    if (!document) {
        throw new ApiError(404, "Document not found");
    }
    
    res.status(200).json(
        new ApiResponse(200, document, "Document retrieved successfully")
    );
});

// Update document
const updateDocument = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, content } = req.body;
    
    const document = await Document.findById(id);
    
    if (!document) {
        throw new ApiError(404, "Document not found");
    }
    
    // Send initial processing log
    sendProcessingLog(id, '🔄 Starting document update process...', 'info');
    sendProcessingLog(id, `📝 Updating document: "${document.title}"`, 'info');
    if (content) {
        sendProcessingLog(id, `📊 New content length: ${content.length} characters`, 'info');
    }
    
    // Update fields
    if (title) document.title = title;
    if (description !== undefined) document.description = description;
    if (content) {
        document.content = content;
        document.fileSize = content.length;
        
        // Reprocess embeddings if content changed
        try {
            sendProcessingLog(id, '🔄 Re-processing document for AI embeddings...', 'info');
            await processDocument(document._id, content, id);
            sendProcessingLog(id, '✅ Document update completed successfully!', 'success');
            sendProcessingLog(id, '🤖 Updated document is ready for AI interactions', 'success');
        } catch (error) {
            sendProcessingLog(id, `❌ Processing failed: ${error.message}`, 'error');
            throw new ApiError(500, "Failed to reprocess document: " + error.message);
        }
    }
    
    await document.save();
    
    res.status(200).json(
        new ApiResponse(200, document, "Document updated successfully")
    );
});

// Delete document
const deleteDocument = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const document = await Document.findById(id);
    
    if (!document) {
        throw new ApiError(404, "Document not found");
    }
    
    // Soft delete by setting isActive to false
    document.isActive = false;
    await document.save();
    
    res.status(200).json(
        new ApiResponse(200, {}, "Document deleted successfully")
    );
});

export {
    uploadDocument,
    getAllDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument,
    streamDocumentLogs
}; 