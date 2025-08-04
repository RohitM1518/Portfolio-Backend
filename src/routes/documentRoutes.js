import express from 'express';
import {
    uploadDocument,
    getAllDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument,
    streamDocumentLogs
} from '../controllers/documentController.js';
import { verifyJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

// SSE route for streaming processing logs (no auth middleware - will handle auth manually)
router.get('/logs/:documentId', streamDocumentLogs);

// Apply authentication middleware to all other routes
router.use(verifyJWT);

// Document routes
router.post('/upload', uploadDocument);
router.get('/', getAllDocuments);
router.get('/:id', getDocumentById);
router.patch('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router; 