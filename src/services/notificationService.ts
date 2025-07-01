import { collection, addDoc, query, where, orderBy, limit, getDocs, updateDoc, doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Notification {
  id?: string;
  type: 'quote_confirmed' | 'new_customer' | 'quote_sent' | 'invoice_created';
  title: string;
  message: string;
  customerId?: string;
  customerName?: string;
  quoteId?: string;
  read: boolean;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

class NotificationService {
  private notificationsCollection = collection(db, 'notifications');

  // Erstelle eine neue Benachrichtigung
  async createNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<string> {
    try {
      const newNotification: Omit<Notification, 'id'> = {
        ...notification,
        read: false,
        createdAt: new Date()
      };

      const docRef = await addDoc(this.notificationsCollection, {
        ...newNotification,
        createdAt: Timestamp.fromDate(newNotification.createdAt)
      });

      console.log('📢 Neue Benachrichtigung erstellt:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der Benachrichtigung:', error);
      throw error;
    }
  }

  // Erstelle Benachrichtigung für bestätigtes Angebot
  async createQuoteConfirmedNotification(customerName: string, customerId: string, quoteId: string): Promise<string> {
    return this.createNotification({
      type: 'quote_confirmed',
      title: '✅ Angebot online bestätigt!',
      message: `${customerName} hat das Angebot online bestätigt.`,
      customerId,
      customerName,
      quoteId,
      priority: 'high',
      actionUrl: `/customer-details/${customerId}?tab=quotes`
    });
  }

  // Hole ungelesene Benachrichtigungen
  async getUnreadNotifications(limitCount: number = 10): Promise<Notification[]> {
    try {
      const q = query(
        this.notificationsCollection,
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Notification));
    } catch (error) {
      console.error('Fehler beim Abrufen der Benachrichtigungen:', error);
      return [];
    }
  }

  // Hole alle Benachrichtigungen
  async getAllNotifications(limitCount: number = 50): Promise<Notification[]> {
    try {
      const q = query(
        this.notificationsCollection,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Notification));
    } catch (error) {
      console.error('Fehler beim Abrufen der Benachrichtigungen:', error);
      return [];
    }
  }

  // Markiere Benachrichtigung als gelesen
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Fehler beim Markieren als gelesen:', error);
    }
  }

  // Markiere alle als gelesen
  async markAllAsRead(): Promise<void> {
    try {
      const unreadNotifications = await this.getUnreadNotifications(100);
      const updatePromises = unreadNotifications.map(notification => 
        notification.id ? this.markAsRead(notification.id) : Promise.resolve()
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Fehler beim Markieren aller als gelesen:', error);
    }
  }

  // Echtzeit-Listener für neue Benachrichtigungen
  subscribeToNotifications(callback: (notifications: Notification[]) => void): () => void {
    const q = query(
      this.notificationsCollection,
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Notification));
      
      callback(notifications);
    });
  }

  // Zähle ungelesene Benachrichtigungen
  async getUnreadCount(): Promise<number> {
    try {
      const q = query(
        this.notificationsCollection,
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Fehler beim Zählen der ungelesenen Benachrichtigungen:', error);
      return 0;
    }
  }
}

export const notificationService = new NotificationService();