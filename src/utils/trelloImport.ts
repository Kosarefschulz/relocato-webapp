import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Customer } from '../types';

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
    const customersRef = collection(db, 'customers');
    
    // Try exact match first
    let q = query(customersRef, where('name', '==', cardName));
    let snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Customer;
    }

    // Try partial match
    const searchTerms = cardName.toLowerCase().split(' ');
    const customers: Customer[] = [];
    
    const allCustomersSnapshot = await getDocs(customersRef);
    allCustomersSnapshot.forEach((doc) => {
      const customer = { id: doc.id, ...doc.data() } as Customer;
      const customerName = customer.name.toLowerCase();
      
      if (searchTerms.some(term => customerName.includes(term))) {
        customers.push(customer);
      }
    });

    return customers.length === 1 ? customers[0] : null;
  }

  // Download and upload attachment to Firebase Storage
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
      const storageRef = ref(storage, `customers/${customerId}/photos/${filename}`);
      
      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      return downloadUrl;
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
    const customerRef = doc(db, 'customers', customerId);
    const updates: any = {};
    
    // Import notes/description
    if (card.desc) {
      updates.notes = card.desc;
      onProgress?.(`Notizen importiert für ${card.name}`);
    }
    
    // Import labels as tags
    if (card.labels && card.labels.length > 0) {
      updates.tags = arrayUnion(...card.labels.map(label => label.name));
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
        updates.photos = arrayUnion(...photoUrls);
        onProgress?.(`${photoUrls.length} Fotos importiert für ${card.name}`);
      }
    }
    
    // Update customer document
    if (Object.keys(updates).length > 0) {
      await updateDoc(customerRef, updates);
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