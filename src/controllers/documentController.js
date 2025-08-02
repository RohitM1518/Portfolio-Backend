import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import Document from '../models/documentModel.js';
import { processDocument } from '../utils/documentProcessor.js';

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
        
        // Process the document for embeddings
        try {
            await processDocument(document._id, content);
            console.log('Document processing completed successfully');
            
            res.status(201).json(
                new ApiResponse(201, document, "Document uploaded and processed successfully")
            );
        } catch (error) {
            // If processing fails, delete the document record
            await Document.findByIdAndDelete(document._id);
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
    
    // Update fields
    if (title) document.title = title;
    if (description !== undefined) document.description = description;
    if (content) {
        document.content = content;
        document.fileSize = content.length;
        
        // Reprocess embeddings if content changed
        try {
            await processDocument(document._id, content);
        } catch (error) {
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
    deleteDocument
}; 