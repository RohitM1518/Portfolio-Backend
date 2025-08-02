import * as fs from 'fs';
import path from 'path';
import { getEmbeddings } from './embeddingUtils.js';
import Embedding from '../models/embeddingModel.js';
import { cosineSimilarity } from './embeddingUtils.js';

export async function processDocument(documentId, content) {
    try {
        console.log("Starting document processing for document ID:", documentId);
        console.log("Content length:", content.length);
        
        if (!content || content.trim().length === 0) {
            throw new Error('No content provided for processing');
        }
        
        // Simple text chunking (split by paragraphs)
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 50);
        
        // If no paragraphs found, create chunks by sentences
        let chunks = paragraphs;
        if (chunks.length === 0) {
            chunks = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
        }
        
        console.log(`Successfully chunked the content into ${chunks.length} chunks.`);
        
        // Generate embeddings and store them
        console.log("Generating embeddings and inserting documents.");
        let docCount = 0;
        
        await Promise.all(chunks.map(async (chunk, index) => {
            const embeddings = await getEmbeddings(chunk);
            
            // Insert the embeddings and the chunked content
            await Embedding.create({
                document: documentId,
                content: chunk,
                embedding: embeddings,
                chunkIndex: index,
                pageNumber: 0
            });
            
            docCount += 1;
        }));
        
        console.log(`Successfully inserted ${docCount} document chunks.`);
        return docCount;
        
    } catch (error) {
        console.error("Error processing document:", error);
        throw error;
    }
}

export async function searchSimilarDocuments(query, limit = 5) {
    try {
        const queryEmbeddings = await getEmbeddings(query);
        
        // Get all embeddings
        const allEmbeddings = await Embedding.find({}).populate('document');
        
        // Calculate similarities
        const similarities = allEmbeddings.map(embedding => ({
            embedding,
            similarity: cosineSimilarity(queryEmbeddings, embedding.embedding)
        }));
        
        // Sort by similarity and return top results
        similarities.sort((a, b) => b.similarity - a.similarity);
        
        return similarities.slice(0, limit).map(item => ({
            content: item.embedding.content,
            similarity: item.similarity,
            document: item.embedding.document,
            pageNumber: item.embedding.pageNumber
        }));
        
    } catch (error) {
        console.error("Error searching documents:", error);
        throw error;
    }
} 