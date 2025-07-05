import { supabase } from '../config/supabase';
import { Customer } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  attachments?: TrelloAttachment[];
  labels?: TrelloLabel[];
  customFieldItems?: TrelloCustomField[];
}

interface TrelloAttachment {
  id: string;
  name: string;
  url: string;
  mimeType?: string;
}

interface TrelloLabel {
  id: string;
  name: string;
  color: string;
}

interface TrelloCustomField {
  idCustomField: string;
  value: {
    text?: string;
    number?: number;
    date?: string;
    checked?: boolean;
  };
}

interface TrelloBoard {
  id: string;
  name: string;
  cards: TrelloCard[];
}

export class TrelloImporter {
  private apiKey: string;
  private token: string;

  constructor(apiKey: string, token: string) {
    this.apiKey = apiKey;
    this.token = token;
  }

  // Helper method to map Supabase customer to local format
  private mapSupabaseCustomerToLocal(data: any): Customer {
    return {
      id: data.id,
      customerNumber: data.customer_number,
      name: data.name,
      email: data.email,
      phone: data.phone,
      fromAddress: data.from_address,
      toAddress: data.to_address,
      movingDate: data.moving_date || '',
      apartment: data.apartment,
      services: data.services || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      salesStatus: data.sales_status,
      status: data.status,
      notes: data.notes,
      tags: data.tags || []
    };
  }

  // Fetch board data from Trello
  async fetchBoard(boardId: string): Promise<TrelloBoard> {
    const boardUrl = `https://api.trello.com/1/boards/${boardId}?key=${this.apiKey}&token=${this.token}`;
    const cardsUrl = `https://api.trello.com/1/boards/${boardId}/cards?key=${this.apiKey}&token=${this.token}&attachments=true&customFieldItems=true`;
    
    const [boardResponse, cardsResponse] = await Promise.all([
      fetch(boardUrl),
      fetch(cardsUrl)
    ]);

    if (!boardResponse.ok || !cardsResponse.ok) {
      throw new Error('Failed to fetch Trello data');
    }

    const board = await boardResponse.json();
    const cards = await cardsResponse.json();

    return {
      id: board.id,
      name: board.name,
      cards: cards
    };
  }

  // Match Trello card to existing customer
  async findCustomerByName(cardName: string): Promise<Customer | null> {
    try {
      // Try exact match first
      const { data: exactMatch, error: exactError } = await supabase
        .from('customers')
        .select('*')
        .eq('name', cardName)
        .eq('is_deleted', false)
        .single();
      
      if (!exactError && exactMatch) {
        return this.mapSupabaseCustomerToLocal(exactMatch);
      }

      // Try partial match using ilike for case-insensitive search
      const searchTerms = cardName.toLowerCase().split(' ');
      const { data: customers, error: searchError } = await supabase
        .from('customers')
        .select('*')
        .eq('is_deleted', false);
      
      if (searchError) throw searchError;
      
      // Filter customers that match any search term
      const matchingCustomers = customers?.filter(customer => {
        const customerName = customer.name.toLowerCase();
        return searchTerms.some(term => customerName.includes(term));
      }) || [];

      return matchingCustomers.length === 1 ? this.mapSupabaseCustomerToLocal(matchingCustomers[0]) : null;
    } catch (error) {
      console.error('Error finding customer by name:', error);
      return null;
    }
  }

  // Download and upload attachment to Supabase Storage
  async uploadAttachment(
    attachment: TrelloAttachment, 
    customerId: string
  ): Promise<string> {
    try {
      // Download the file from Trello
      const response = await fetch(attachment.url);
      if (!response.ok) throw new Error('Failed to download attachment');
      
      const blob = await response.blob();
      
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${attachment.name}`;
      const filePath = `customers/${customerId}/photos/${filename}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('customer-photos')
        .upload(filePath, blob, {
          contentType: attachment.mimeType || 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('customer-photos')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  }

  // Import a single card
  async importCard(
    card: TrelloCard, 
    customerId: string,
    onProgress?: (message: string) => void
  ): Promise<void> {
    try {
      // Get current customer data
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const updates: any = {};
      
      // Import notes/description
      if (card.desc) {
        updates.notes = card.desc;
        onProgress?.(`Notizen importiert für ${card.name}`);
      }
      
      // Import labels as tags
      if (card.labels && card.labels.length > 0) {
        const existingTags = customer.tags || [];
        const newTags = card.labels.map(label => label.name);
        updates.tags = [...new Set([...existingTags, ...newTags])];
        onProgress?.(`${card.labels.length} Tags importiert für ${card.name}`);
      }
      
      // Import attachments as photos
      if (card.attachments && card.attachments.length > 0) {
        const photoUrls: string[] = [];
        
        for (const attachment of card.attachments) {
          if (attachment.mimeType?.startsWith('image/')) {
            try {
              onProgress?.(`Lade Foto hoch: ${attachment.name}`);
              const url = await this.uploadAttachment(attachment, customerId);
              photoUrls.push(url);
            } catch (error) {
              console.error(`Failed to upload ${attachment.name}:`, error);
            }
          }
        }
        
        if (photoUrls.length > 0) {
          const existingPhotos = customer.photos || [];
          updates.photos = [...existingPhotos, ...photoUrls];
          onProgress?.(`${photoUrls.length} Fotos importiert für ${card.name}`);
        }
      }
      
      // Update customer document
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('customers')
          .update(updates)
          .eq('id', customerId);
        
        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error importing card:', error);
      throw error;
    }
  }

  // Import all cards from a board
  async importBoard(
    boardId: string,
    onProgress?: (current: number, total: number, message: string) => void
  ): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const board = await this.fetchBoard(boardId);
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    };
    
    for (let i = 0; i < board.cards.length; i++) {
      const card = board.cards[i];
      
      try {
        onProgress?.(i + 1, board.cards.length, `Verarbeite: ${card.name}`);
        
        const customer = await this.findCustomerByName(card.name);
        
        if (customer) {
          await this.importCard(card, customer.id, (msg) => 
            onProgress?.(i + 1, board.cards.length, msg)
          );
          results.imported++;
        } else {
          results.skipped++;
          results.errors.push(`Kunde nicht gefunden: ${card.name}`);
        }
      } catch (error) {
        results.errors.push(`Fehler bei ${card.name}: ${error}`);
      }
    }
    
    return results;
  }
}

// Helper function to get Trello authorization URL
export function getTrelloAuthUrl(apiKey: string, appName: string): string {
  return `https://trello.com/1/authorize?` +
    `key=${apiKey}&` +
    `name=${encodeURIComponent(appName)}&` +
    `expiration=1day&` +
    `response_type=token&` +
    `scope=read&` +
    `callback_method=fragment&` +
    `return_url=${encodeURIComponent(window.location.origin + '/trello-import')}`;
}