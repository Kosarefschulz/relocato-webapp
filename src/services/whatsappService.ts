import { supabase } from '../config/supabase';

export interface WhatsAppMessage {
  id?: string;
  wa_message_id: string;
  conversation_id: string;
  from_number: string;
  from_name?: string;
  to_number: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'sticker';
  text_content?: string;
  media_url?: string;
  media_mime_type?: string;
  media_sha256?: string;
  media_id?: string;
  caption?: string;
  location_latitude?: number;
  location_longitude?: number;
  location_name?: string;
  location_address?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received';
  direction: 'inbound' | 'outbound';
  timestamp: string;
  context_message_id?: string;
  is_forwarded?: boolean;
  metadata?: any;
}

export interface WhatsAppConversation {
  id?: string;
  conversation_id: string;
  phone_number: string;
  customer_id?: string;
  customer_name?: string;
  last_message_at?: string;
  last_message_preview?: string;
  unread_count: number;
  status: 'active' | 'archived' | 'resolved';
  assigned_to?: string;
  metadata?: any;
}

export interface WhatsAppTemplate {
  id?: string;
  template_name: string;
  template_id: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  status: 'pending' | 'approved' | 'rejected';
  header_type?: 'text' | 'image' | 'video' | 'document';
  header_content?: string;
  body_content: string;
  footer_content?: string;
  buttons?: any[];
  parameters?: any[];
}

class WhatsAppService {
  private apiKey: string;
  private baseUrl: string = 'https://waba-v2.360dialog.io';

  constructor() {
    this.apiKey = 'IAZJrrEVUymetKybaO6p83rQAK';
  }

  // Send text message
  async sendTextMessage(to: string, message: string, replyToMessageId?: string): Promise<any> {
    try {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          to,
          type: 'text',
          text: { body: message },
          context: replyToMessageId ? { message_id: replyToMessageId } : undefined
        }
      });

      if (error) throw error;

      // Save message to database
      await this.saveMessage({
        wa_message_id: data.messages[0].id,
        conversation_id: data.conversation_id || `conv_${to}`,
        from_number: data.from || 'business',
        to_number: to,
        message_type: 'text',
        text_content: message,
        status: 'sent',
        direction: 'outbound',
        timestamp: new Date().toISOString()
      });

      return data;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  // Send media message
  async sendMediaMessage(
    to: string, 
    mediaType: 'image' | 'video' | 'audio' | 'document',
    mediaUrl: string,
    caption?: string,
    filename?: string
  ): Promise<any> {
    try {
      const mediaPayload: any = {
        link: mediaUrl
      };

      if (caption) mediaPayload.caption = caption;
      if (filename && mediaType === 'document') mediaPayload.filename = filename;

      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          to,
          type: mediaType,
          [mediaType]: mediaPayload
        }
      });

      if (error) throw error;

      // Save message to database
      await this.saveMessage({
        wa_message_id: data.messages[0].id,
        conversation_id: data.conversation_id || `conv_${to}`,
        from_number: data.from || 'business',
        to_number: to,
        message_type: mediaType,
        media_url: mediaUrl,
        caption,
        status: 'sent',
        direction: 'outbound',
        timestamp: new Date().toISOString()
      });

      return data;
    } catch (error) {
      console.error('Error sending WhatsApp media:', error);
      throw error;
    }
  }

  // Send template message
  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string = 'de',
    components?: any[]
  ): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: language },
            components
          }
        }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error sending WhatsApp template:', error);
      throw error;
    }
  }

  // Get conversations
  async getConversations(status?: 'active' | 'archived' | 'resolved'): Promise<WhatsAppConversation[]> {
    try {
      let query = supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId: string, limit: number = 50): Promise<WhatsAppMessage[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markAsRead(conversationId: string): Promise<void> {
    try {
      // Update unread count
      await supabase
        .from('whatsapp_conversations')
        .update({ unread_count: 0 })
        .eq('conversation_id', conversationId);

      // Update message status
      await supabase
        .from('whatsapp_messages')
        .update({ status: 'read' })
        .eq('conversation_id', conversationId)
        .eq('direction', 'inbound')
        .eq('status', 'received');
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Link message to customer
  async linkToCustomer(messageId: string, customerId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_customer_links')
        .insert({
          message_id: messageId,
          customer_id: customerId,
          linked_by: userId
        });

      if (error && error.code !== '23505') { // Ignore duplicate key error
        throw error;
      }

      // Update conversation with customer info
      const { data: message } = await supabase
        .from('whatsapp_messages')
        .select('conversation_id')
        .eq('id', messageId)
        .single();

      if (message) {
        await supabase
          .from('whatsapp_conversations')
          .update({ customer_id: customerId })
          .eq('conversation_id', message.conversation_id);
      }
    } catch (error) {
      console.error('Error linking to customer:', error);
      throw error;
    }
  }

  // Get customer messages
  async getCustomerMessages(customerId: string): Promise<WhatsAppMessage[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_customer_links')
        .select(`
          whatsapp_messages (*)
        `)
        .eq('customer_id', customerId)
        .order('whatsapp_messages.timestamp', { ascending: false });

      if (error) throw error;
      return data?.map(link => link.whatsapp_messages).flat() || [];
    } catch (error) {
      console.error('Error fetching customer messages:', error);
      throw error;
    }
  }

  // Save message to database
  private async saveMessage(message: WhatsAppMessage): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_messages')
        .insert(message);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  // Handle incoming webhook
  async handleWebhook(payload: any): Promise<void> {
    try {
      // Process different webhook types
      if (payload.messages) {
        for (const message of payload.messages) {
          await this.processIncomingMessage(message, payload.contacts);
        }
      }

      if (payload.statuses) {
        for (const status of payload.statuses) {
          await this.updateMessageStatus(status);
        }
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  // Process incoming message
  private async processIncomingMessage(message: any, contacts: any[]): Promise<void> {
    const contact = contacts?.find(c => c.wa_id === message.from);
    
    const whatsappMessage: WhatsAppMessage = {
      wa_message_id: message.id,
      conversation_id: message.conversation_id || `conv_${message.from}`,
      from_number: message.from,
      from_name: contact?.profile?.name,
      to_number: 'business',
      message_type: message.type,
      text_content: message.text?.body,
      status: 'received',
      direction: 'inbound',
      timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
      context_message_id: message.context?.id,
      metadata: message
    };

    // Handle media messages
    if (['image', 'video', 'audio', 'document', 'sticker'].includes(message.type)) {
      const media = message[message.type];
      whatsappMessage.media_id = media.id;
      whatsappMessage.media_mime_type = media.mime_type;
      whatsappMessage.media_sha256 = media.sha256;
      whatsappMessage.caption = media.caption;
    }

    // Handle location messages
    if (message.type === 'location') {
      whatsappMessage.location_latitude = message.location.latitude;
      whatsappMessage.location_longitude = message.location.longitude;
      whatsappMessage.location_name = message.location.name;
      whatsappMessage.location_address = message.location.address;
    }

    await this.saveMessage(whatsappMessage);
  }

  // Update message status
  private async updateMessageStatus(status: any): Promise<void> {
    try {
      const statusMap: any = {
        sent: 'sent',
        delivered: 'delivered',
        read: 'read',
        failed: 'failed'
      };

      await supabase
        .from('whatsapp_messages')
        .update({ 
          status: statusMap[status.status] || status.status,
          updated_at: new Date().toISOString()
        })
        .eq('wa_message_id', status.id);
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  // Get templates
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('status', 'approved')
        .order('template_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  // Download media
  async downloadMedia(mediaId: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-media', {
        body: { media_id: mediaId }
      });

      if (error) throw error;
      return data.url;
    } catch (error) {
      console.error('Error downloading media:', error);
      throw error;
    }
  }

  // Subscribe to realtime messages
  subscribeToMessages(callback: (payload: any) => void) {
    return supabase
      .channel('whatsapp_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages'
        },
        callback
      )
      .subscribe();
  }
}

export const whatsappService = new WhatsAppService();