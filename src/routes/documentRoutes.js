import express from 'express';
import {
    uploadDocument,
    getAllDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument
} from '../controllers/documentController.js';
import { verifyJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// Document routes
router.post('/upload', uploadDocument);
router.get('/', getAllDocuments);
router.get('/:id', getDocumentById);
router.patch('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router; 