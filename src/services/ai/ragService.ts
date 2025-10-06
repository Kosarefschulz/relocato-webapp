/**
 * RAG Service
 * Retrieval Augmented Generation mit Supabase pgvector
 */

import { supabase } from '../../config/supabase';
import { embeddingService } from './embeddingService';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: any[];
  similarity?: number;
  createdAt: Date;
}

export interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  similarity: number;
}

export interface LearnedPattern {
  id: string;
  userQuestion: string;
  aiResponse: string;
  toolsUsed: any[];
  successRating: number;
  similarity: number;
}

export class RAGService {
  private currentSessionId: string | null = null;
  private userId: string = 'anonymous';

  /**
   * Startet eine neue Session
   */
  async startSession(userId?: string): Promise<string> {
    this.userId = userId || 'anonymous';

    const { data, error } = await supabase
      .from('ai_chat_sessions')
      .insert({
        user_id: this.userId,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create session:', error);
      this.currentSessionId = uuidv4(); // Fallback: Local UUID
    } else {
      this.currentSessionId = data.id;
    }

    console.log('✅ RAG Session started:', this.currentSessionId);
    return this.currentSessionId!;
  }

  /**
   * Speichert Chat-Message mit Embedding
   */
  async storeChatMessage(
    role: 'user' | 'assistant',
    content: string,
    options?: {
      toolsUsed?: any[];
      customerId?: string;
      quoteId?: string;
      success?: boolean;
      responseTimeMs?: number;
      tokensUsed?: number;
      imageUrl?: string;
    }
  ): Promise<void> {
    try {
      // Generiere Embedding
      const embedding = await embeddingService.generateEmbedding(content);

      if (!this.currentSessionId) {
        await this.startSession();
      }

      const { error } = await supabase
        .from('ai_chat_history')
        .insert({
          session_id: this.currentSessionId,
          user_id: this.userId,
          message_role: role,
          message_content: content,
          embedding,
          tools_used: options?.toolsUsed || null,
          customer_id: options?.customerId || null,
          quote_id: options?.quoteId || null,
          success: options?.success ?? true,
          response_time_ms: options?.responseTimeMs || null,
          tokens_used: options?.tokensUsed || null,
          image_url: options?.imageUrl || null
        });

      if (error) {
        console.error('❌ Failed to store chat message:', error);
      } else {
        console.log('✅ Chat message stored with embedding');
      }
    } catch (error) {
      console.error('❌ Store chat message error:', error);
    }
  }

  /**
   * Findet relevanten Kontext aus Chat-Historie
   */
  async findRelevantContext(query: string, limit: number = 5): Promise<ChatMessage[]> {
    try {
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const { data, error } = await supabase.rpc('match_chat_history', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit,
        filter_session_id: this.currentSessionId // Exclude current session
      });

      if (error) {
        console.error('❌ RAG search failed:', error);
        return [];
      }

      console.log(`📚 Found ${data?.length || 0} relevant messages from history`);

      return (data || []).map((row: any) => ({
        id: row.id,
        role: row.message_role,
        content: row.message_content,
        toolsUsed: row.tools_used,
        similarity: row.similarity,
        createdAt: new Date(row.created_at)
      }));

    } catch (error) {
      console.error('❌ Find relevant context error:', error);
      return [];
    }
  }

  /**
   * Sucht in Knowledge Base
   */
  async searchKnowledge(query: string, category?: string, limit: number = 3): Promise<KnowledgeItem[]> {
    try {
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const { data, error } = await supabase.rpc('match_knowledge', {
        query_embedding: queryEmbedding,
        match_threshold: 0.75,
        match_count: limit,
        filter_category: category || null
      });

      if (error) {
        console.error('❌ Knowledge search failed:', error);
        return [];
      }

      console.log(`💡 Found ${data?.length || 0} relevant knowledge items`);

      // Update usage count
      if (data && data.length > 0) {
        for (const item of data) {
          await supabase
            .from('ai_knowledge_base')
            .update({
              usage_count: item.usage_count + 1,
              last_used_at: new Date().toISOString()
            })
            .eq('id', item.id);
        }
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        category: row.category,
        title: row.title,
        content: row.content,
        similarity: row.similarity
      }));

    } catch (error) {
      console.error('❌ Search knowledge error:', error);
      return [];
    }
  }

  /**
   * Findet erfolgreiche Learned Patterns
   */
  async findLearnedPatterns(query: string, limit: number = 2): Promise<LearnedPattern[]> {
    try {
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const { data, error } = await supabase.rpc('match_learned_patterns', {
        query_embedding: queryEmbedding,
        match_threshold: 0.8,
        match_count: limit
      });

      if (error) {
        console.error('❌ Learned patterns search failed:', error);
        return [];
      }

      console.log(`🎓 Found ${data?.length || 0} learned patterns`);

      return (data || []).map((row: any) => ({
        id: row.id,
        userQuestion: row.user_question,
        aiResponse: row.ai_response,
        toolsUsed: row.tools_used,
        successRating: row.success_rating,
        similarity: row.similarity
      }));

    } catch (error) {
      console.error('❌ Find learned patterns error:', error);
      return [];
    }
  }

  /**
   * Speichert erfolgreiche Interaktion als Learning Pattern
   */
  async learnFromInteraction(
    userQuestion: string,
    aiResponse: string,
    toolsUsed: any[],
    successRating: number,
    userFeedback?: string
  ): Promise<void> {
    try {
      const embedding = await embeddingService.generateEmbedding(userQuestion);

      const { error } = await supabase
        .from('ai_learned_patterns')
        .insert({
          user_question: userQuestion,
          ai_response: aiResponse,
          embedding,
          tools_used: toolsUsed,
          success_rating: successRating,
          user_feedback: userFeedback || null
        });

      if (error) {
        console.error('❌ Failed to save learned pattern:', error);
      } else {
        console.log('🎓 Learned new pattern!');
      }
    } catch (error) {
      console.error('❌ Learn from interaction error:', error);
    }
  }

  /**
   * Speichert User-Feedback
   */
  async saveUserFeedback(
    chatMessageId: string,
    thumbs: boolean,
    feedbackText?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_user_feedback')
        .insert({
          chat_message_id: chatMessageId,
          session_id: this.currentSessionId,
          thumbs,
          feedback_type: thumbs ? 'helpful' : 'unhelpful',
          feedback_text: feedbackText || null
        });

      if (error) {
        console.error('❌ Failed to save feedback:', error);
      } else {
        console.log(thumbs ? '👍 Positive feedback saved' : '👎 Negative feedback saved');
      }
    } catch (error) {
      console.error('❌ Save feedback error:', error);
    }
  }

  /**
   * Beendet Session
   */
  async endSession(): Promise<void> {
    if (!this.currentSessionId) return;

    try {
      await supabase
        .from('ai_chat_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', this.currentSessionId);

      console.log('✅ Session ended:', this.currentSessionId);
      this.currentSessionId = null;
    } catch (error) {
      console.error('❌ End session error:', error);
    }
  }

  /**
   * Gibt Session ID zurück
   */
  getSessionId(): string | null {
    return this.currentSessionId;
  }
}

export const ragService = new RAGService();
