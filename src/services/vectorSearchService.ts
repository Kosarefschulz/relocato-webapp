import { supabase } from '../config/supabase';
import { Customer } from '../types';

export interface SearchResult {
  id: string;
  type: 'customer' | 'quote' | 'knowledge';
  title: string;
  content: string;
  similarity: number;
  metadata?: any;
}

export interface VectorSearchOptions {
  matchCount?: number;
  threshold?: number;
  includeTypes?: ('customer' | 'quote' | 'knowledge')[];
}

class VectorSearchService {
  private openAIApiKey: string;
  private openAIModel: string = 'text-embedding-3-small';

  constructor() {
    // In production, this should come from environment variables
    this.openAIApiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
  }

  // Generate embedding using OpenAI API
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openAIApiKey) {
      console.warn('OpenAI API key not configured, using mock embedding');
      // Return mock embedding for development
      return Array(1536).fill(0).map(() => Math.random());
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAIApiKey}`
        },
        body: JSON.stringify({
          model: this.openAIModel,
          input: text
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Fallback to mock embedding
      return Array(1536).fill(0).map(() => Math.random());
    }
  }

  // Search across all content types
  async search(query: string, options: VectorSearchOptions = {}): Promise<SearchResult[]> {
    const {
      matchCount = 10,
      threshold = 0.7,
      includeTypes = ['customer', 'quote', 'knowledge']
    } = options;

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      const results: SearchResult[] = [];

      // Search customers
      if (includeTypes.includes('customer')) {
        const customerResults = await this.searchCustomers(queryEmbedding, matchCount, threshold);
        results.push(...customerResults);
      }

      // Search quotes
      if (includeTypes.includes('quote')) {
        const quoteResults = await this.searchQuotes(queryEmbedding, matchCount, threshold);
        results.push(...quoteResults);
      }

      // Search knowledge base
      if (includeTypes.includes('knowledge')) {
        const knowledgeResults = await this.searchKnowledge(queryEmbedding, matchCount, threshold);
        results.push(...knowledgeResults);
      }

      // Sort by similarity and limit total results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, matchCount);
    } catch (error) {
      console.error('Error performing vector search:', error);
      return [];
    }
  }

  // Search similar customers
  private async searchCustomers(
    embedding: number[], 
    limit: number, 
    threshold: number
  ): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase.rpc('search_similar_customers', {
        query_embedding: embedding,
        match_count: limit,
        threshold
      });

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.customer_id,
        type: 'customer' as const,
        title: item.customer_name,
        content: item.content,
        similarity: item.similarity,
        metadata: { contentType: item.content_type }
      }));
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }

  // Search similar quotes
  private async searchQuotes(
    embedding: number[], 
    limit: number, 
    threshold: number
  ): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase.rpc('search_similar_quotes', {
        query_embedding: embedding,
        match_count: limit,
        threshold
      });

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.quote_id,
        type: 'quote' as const,
        title: `Angebot für ${item.customer_name}`,
        content: item.content,
        similarity: item.similarity,
        metadata: { 
          contentType: item.content_type,
          price: item.price
        }
      }));
    } catch (error) {
      console.error('Error searching quotes:', error);
      return [];
    }
  }

  // Search knowledge base
  private async searchKnowledge(
    embedding: number[], 
    limit: number, 
    threshold: number
  ): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase.rpc('search_knowledge_base', {
        query_embedding: embedding,
        match_count: limit,
        threshold
      });

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.id,
        type: 'knowledge' as const,
        title: item.title,
        content: item.content,
        similarity: item.similarity,
        metadata: { category: item.category }
      }));
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }
  }

  // Create or update customer embedding
  async indexCustomer(customerId: string): Promise<void> {
    try {
      // Get customer data
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error || !customer) {
        throw new Error('Customer not found');
      }

      // Create content for embedding
      const content = this.createCustomerContent(customer);
      
      // Generate embedding
      const embedding = await this.generateEmbedding(content);

      // Check if embedding exists
      const { data: existing } = await supabase
        .from('customer_embeddings')
        .select('id')
        .eq('customer_id', customerId)
        .eq('content_type', 'combined')
        .single();

      if (existing) {
        // Update existing embedding
        await supabase
          .from('customer_embeddings')
          .update({
            content,
            embedding,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Create new embedding
        await supabase
          .from('customer_embeddings')
          .insert({
            customer_id: customerId,
            content,
            content_type: 'combined',
            embedding
          });
      }

      console.log(`✅ Customer ${customerId} indexed successfully`);
    } catch (error) {
      console.error('Error indexing customer:', error);
      throw error;
    }
  }

  // Create searchable content from customer data
  private createCustomerContent(customer: any): string {
    const parts = [
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      customer.destination_address,
      customer.moving_date ? `Umzugsdatum: ${customer.moving_date}` : '',
      customer.notes || ''
    ].filter(Boolean);

    return parts.join(' | ');
  }

  // Index all customers (batch operation)
  async indexAllCustomers(): Promise<void> {
    try {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id');

      if (error) throw error;

      console.log(`Indexing ${customers?.length || 0} customers...`);

      for (const customer of customers || []) {
        await this.indexCustomer(customer.id);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('✅ All customers indexed successfully');
    } catch (error) {
      console.error('Error indexing all customers:', error);
      throw error;
    }
  }

  // Re-index content with missing embeddings
  async reindexMissingEmbeddings(): Promise<void> {
    try {
      // Find customer embeddings without vectors
      const { data: missingCustomers } = await supabase
        .from('customer_embeddings')
        .select('customer_id')
        .is('embedding', null);

      if (missingCustomers && missingCustomers.length > 0) {
        console.log(`Re-indexing ${missingCustomers.length} customers...`);
        for (const { customer_id } of missingCustomers) {
          await this.indexCustomer(customer_id);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log('✅ Re-indexing completed');
    } catch (error) {
      console.error('Error re-indexing:', error);
      throw error;
    }
  }

  // Search suggestions for autocomplete
  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (query.length < 2) return [];

    try {
      const results = await this.search(query, {
        matchCount: limit,
        threshold: 0.6,
        includeTypes: ['customer', 'knowledge']
      });

      return results.map(r => r.title);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const vectorSearchService = new VectorSearchService();