/**
 * Embedding Service
 * Generiert Vector Embeddings für RAG-System
 * Nutzt Voyage AI (empfohlen von Anthropic)
 */

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const VOYAGE_MODEL = 'voyage-2'; // 1024 dimensions

export class EmbeddingService {
  private apiKey: string;
  private cache: Map<string, number[]> = new Map();

  constructor() {
    this.apiKey = process.env.REACT_APP_VOYAGE_API_KEY || '';

    if (!this.apiKey) {
      console.warn('⚠️ Voyage API Key not configured - using mock embeddings');
    }
  }

  /**
   * Generiert Embedding für einen Text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Check Cache
    if (this.cache.has(text)) {
      console.log('📦 Using cached embedding');
      return this.cache.get(text)!;
    }

    try {
      if (!this.apiKey) {
        return this.generateMockEmbedding(text);
      }

      const response = await fetch(VOYAGE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: text,
          model: VOYAGE_MODEL
        })
      });

      if (!response.ok) {
        throw new Error(`Voyage API error: ${response.statusText}`);
      }

      const data = await response.json();
      const embedding = data.data[0].embedding;

      // Cache it
      this.cache.set(text, embedding);

      return embedding;

    } catch (error) {
      console.error('❌ Embedding generation failed:', error);
      return this.generateMockEmbedding(text);
    }
  }

  /**
   * Batch-Embeddings für mehrere Texte
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      if (!this.apiKey) {
        return texts.map(t => this.generateMockEmbedding(t));
      }

      const response = await fetch(VOYAGE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: texts,
          model: VOYAGE_MODEL
        })
      });

      if (!response.ok) {
        throw new Error(`Voyage API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.map((d: any) => d.embedding);

    } catch (error) {
      console.error('❌ Batch embedding failed:', error);
      return texts.map(t => this.generateMockEmbedding(t));
    }
  }

  /**
   * Mock Embedding (für Development ohne API Key)
   */
  private generateMockEmbedding(text: string): number[] {
    // Deterministisches Mock basierend auf Text-Hash
    const hash = this.simpleHash(text);
    const embedding = new Array(1024).fill(0).map((_, i) => {
      return Math.sin(hash + i) * 0.5 + 0.5;
    });
    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Clear Cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Embedding cache cleared');
  }
}

export const embeddingService = new EmbeddingService();
