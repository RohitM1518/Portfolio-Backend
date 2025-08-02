import { pipeline } from '@xenova/transformers';

// Function to generate embeddings for a given text
export async function getEmbeddings(text) {
    try {
        console.log("Generating embeddings for text:", text.substring(0, 100) + "...");
        const embedder = await pipeline(
            'feature-extraction', 
            'Xenova/nomic-embed-text-v1'
        );
        const results = await embedder(text, { pooling: 'mean', normalize: true });
        return Array.from(results.data);
    } catch (error) {
        console.error("Error generating embeddings:", error);
        throw error;
    }
}

// Function to calculate cosine similarity between two vectors
export function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
} 