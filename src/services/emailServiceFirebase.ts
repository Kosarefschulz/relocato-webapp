import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, limit, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { app } from '../config/firebase';

const functions = getFunctions(app, 'europe-west3');
const db = getFirestore(app);
const auth = getAuth(app);

interface EmailResponse {
  emails: any[];
  total: number;
  page: number;
  limit: number;
}

interface EmailFilters {
  folder: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class EmailServiceFirebase {
  private listeners: Map<string, Function[]> = new Map();
  private unsubscribers: Map<string, Function> = new Map();

  constructor() {
    // Initialize real-time listeners when authenticated
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.setupRealtimeListeners();
      } else {
        this.cleanupListeners();
      }
    });
  }

  // Setup Firestore real-time listeners for email updates
  private setupRealtimeListeners() {
    // Listen to email updates in emailClient collection
    const emailsQuery = query(
      collection(db, 'emailClient'),
      where('userId', '==', auth.currentUser?.uid),
      orderBy('date', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(emailsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const email = { id: change.doc.id, ...change.doc.data() };
        
        if (change.type === 'added') {
          this.emit('email-new', email);
        } else if (change.type === 'modified') {
          // Check what changed
          const oldData = change.doc.data();
          const newData = email as any; // Type assertion for now
          
          if (oldData.flags?.includes('\\Seen') !== newData.flags?.includes('\\Seen')) {
            this.emit(newData.flags?.includes('\\Seen') ? 'email-read' : 'email-unread', email);
          }
          
          if (oldData.flags?.includes('\\Flagged') !== newData.flags?.includes('\\Flagged')) {
            this.emit('email-starred', { ...email, starred: newData.flags?.includes('\\Flagged') });
          }
        } else if (change.type === 'removed') {
          this.emit('email-deleted', email);
        }
      });
    });

    this.unsubscribers.set('emails', unsubscribe);
  }

  private cleanupListeners() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers.clear();
  }

  // Event handling
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Folders
  async getFolders() {
    try {
      const getEmailFolders = httpsCallable(functions, 'getEmailFolders');
      const result = await getEmailFolders();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch folders:', error);
      throw error;
    }
  }

  async createFolder(name: string, parent?: string) {
    // Not implemented in Firebase Functions yet
    throw new Error('Create folder not implemented');
  }

  // Emails
  async getEmails(filters: EmailFilters): Promise<EmailResponse> {
    try {
      const getEmailsFn = httpsCallable(functions, 'getEmails');
      const result = await getEmailsFn(filters);
      return result.data as EmailResponse;
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      throw error;
    }
  }

  async getEmail(id: string, folder: string) {
    try {
      const getEmailFn = httpsCallable(functions, 'getEmail');
      const result = await getEmailFn({ id, folder });
      return result.data;
    } catch (error) {
      console.error('Failed to fetch email:', error);
      throw error;
    }
  }

  async sendEmail(emailData: any) {
    try {
      const sendEmailFn = httpsCallable(functions, 'sendEmail');
      const result = await sendEmailFn(emailData);
      return result.data;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async saveDraft(draftData: any) {
    try {
      // Store draft in Firestore directly
      const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await setDoc(doc(db, 'emailClient', draftId), {
        ...draftData,
        folder: 'Drafts',
        flags: ['\\Draft'],
        userId: auth.currentUser?.uid,
        date: new Date(),
        isDraft: true
      });
      
      return { success: true, id: draftId };
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  }

  async markAsRead(id: string, folder: string) {
    try {
      const markAsReadFn = httpsCallable(functions, 'markAsRead');
      const result = await markAsReadFn({ id, folder });
      return result.data;
    } catch (error) {
      console.error('Failed to mark as read:', error);
      throw error;
    }
  }

  async markAsUnread(id: string, folder: string) {
    try {
      const markAsUnreadFn = httpsCallable(functions, 'markAsUnread');
      const result = await markAsUnreadFn({ id, folder });
      return result.data;
    } catch (error) {
      console.error('Failed to mark as unread:', error);
      throw error;
    }
  }

  async starEmail(id: string, folder: string, starred: boolean) {
    try {
      // Update in Firestore for immediate feedback
      const emailRef = doc(db, 'emailClient', `${folder}_${id}`);
      await setDoc(emailRef, {
        flags: starred ? ['\\Flagged'] : []
      }, { merge: true });
      
      // Then sync with IMAP (fire and forget)
      const starEmailFn = httpsCallable(functions, 'starEmail');
      starEmailFn({ id, folder, starred }).catch(console.error);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to star email:', error);
      throw error;
    }
  }

  async moveEmail(id: string, sourceFolder: string, targetFolder: string) {
    try {
      const moveEmailFn = httpsCallable(functions, 'moveEmail');
      const result = await moveEmailFn({ id, sourceFolder, targetFolder });
      return result.data;
    } catch (error) {
      console.error('Failed to move email:', error);
      throw error;
    }
  }

  async deleteEmail(id: string, folder: string) {
    try {
      const deleteEmailFn = httpsCallable(functions, 'deleteEmail');
      const result = await deleteEmailFn({ id, folder });
      
      // Also delete from Firestore
      await deleteDoc(doc(db, 'emailClient', `${folder}_${id}`));
      
      return result.data;
    } catch (error) {
      console.error('Failed to delete email:', error);
      throw error;
    }
  }

  async searchEmails(query: string, folder?: string) {
    try {
      const searchEmailsFn = httpsCallable(functions, 'searchEmails');
      const result = await searchEmailsFn({ query, folder });
      return result.data;
    } catch (error) {
      console.error('Failed to search emails:', error);
      throw error;
    }
  }

  async getEmailThread(id: string) {
    // Not implemented yet - would need to search by message-id and references
    return { thread: [] };
  }

  async replyToEmail(id: string, replyData: any) {
    try {
      // Get original email first
      const originalEmail = await this.getEmail(id, replyData.folder || 'INBOX') as any;
      
      // Send reply
      return await this.sendEmail({
        ...replyData,
        inReplyTo: originalEmail?.messageId,
        references: originalEmail?.references 
          ? `${originalEmail.references} ${originalEmail.messageId}`
          : originalEmail?.messageId
      });
    } catch (error) {
      console.error('Failed to reply to email:', error);
      throw error;
    }
  }

  async forwardEmail(id: string, forwardData: any) {
    try {
      // Get original email first
      const originalEmail = await this.getEmail(id, forwardData.folder || 'INBOX') as any;
      
      // Forward email
      return await this.sendEmail({
        ...forwardData,
        subject: `Fwd: ${originalEmail.subject}`,
        attachments: originalEmail.attachments || []
      });
    } catch (error) {
      console.error('Failed to forward email:', error);
      throw error;
    }
  }

  async verifyConnection() {
    try {
      // Check if user is authenticated
      if (!auth.currentUser) {
        throw new Error('Not authenticated');
      }
      
      // Try to get folders as a connection test
      await this.getFolders();
      
      return { success: true, connected: true };
    } catch (error) {
      console.error('Failed to verify connection:', error);
      throw error;
    }
  }

  async triggerSync() {
    try {
      const triggerEmailSyncFn = httpsCallable(functions, 'triggerEmailSync');
      const result = await triggerEmailSyncFn({ folders: ['INBOX', 'Sent'] });
      return result.data;
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      throw error;
    }
  }

  disconnect() {
    this.cleanupListeners();
  }
}

export const emailService = new EmailServiceFirebase();