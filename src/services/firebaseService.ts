import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Customer, Quote, Invoice, EmailHistory } from '../types';

class FirebaseService {
  // Collections - nur initialisieren wenn db vorhanden
  private customersCollection = db ? collection(db, 'customers') : null;
  private quotesCollection = db ? collection(db, 'quotes') : null;
  private invoicesCollection = db ? collection(db, 'invoices') : null;
  private emailHistoryCollection = db ? collection(db, 'emailHistory') : null;
  private dispositionsCollection = db ? collection(db, 'dispositions') : null;

  // Prüfe ob Firebase verfügbar ist
  private checkFirebase(): boolean {
    if (!db) {
      console.warn('⚠️ Firebase nicht verfügbar - bitte konfigurieren Sie Firebase in .env.local');
      return false;
    }
    return true;
  }

  // ==================== CUSTOMERS ====================
  
  async getCustomers(): Promise<Customer[]> {
    if (!this.checkFirebase() || !this.customersCollection) {
      return [];
    }
    
    try {
      console.log('📊 Lade Kunden aus Firestore...');
      const querySnapshot = await getDocs(this.customersCollection);
      
      const customers: Customer[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        customers.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Customer);
      });
      
      console.log(`✅ ${customers.length} Kunden aus Firestore geladen`);
      return customers;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Kunden aus Firestore:', error);
      throw error;
    }
  }

  async getCustomerById(customerId: string): Promise<Customer | null> {
    try {
      const docRef = doc(this.customersCollection, customerId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Customer;
      }
      return null;
    } catch (error) {
      console.error('❌ Fehler beim Laden des Kunden:', error);
      throw error;
    }
  }

  async addCustomer(customer: Omit<Customer, 'id'>): Promise<string> {
    try {
      // Generiere Kundennummer wenn nicht vorhanden
      const customerNumber = customer.customerNumber || await this.generateCustomerNumber();
      
      const docRef = await addDoc(this.customersCollection, {
        ...customer,
        customerNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      console.log('✅ Kunde in Firestore erstellt:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Kunden:', error);
      throw error;
    }
  }

  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<void> {
    try {
      const docRef = doc(this.customersCollection, customerId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Kunde aktualisiert:', customerId);
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren des Kunden:', error);
      throw error;
    }
  }

  async deleteCustomer(customerId: string): Promise<void> {
    try {
      const docRef = doc(this.customersCollection, customerId);
      await deleteDoc(docRef);
      console.log('✅ Kunde gelöscht:', customerId);
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Kunden:', error);
      throw error;
    }
  }

  // ==================== QUOTES ====================

  async getQuotes(): Promise<Quote[]> {
    try {
      const querySnapshot = await getDocs(this.quotesCollection);
      
      const quotes: Quote[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        quotes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Quote);
      });
      
      return quotes;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Angebote:', error);
      throw error;
    }
  }

  async getQuotesByCustomerId(customerId: string): Promise<Quote[]> {
    try {
      const q = query(
        this.quotesCollection,
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const quotes: Quote[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        quotes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Quote);
      });
      
      return quotes;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Kundenangebote:', error);
      throw error;
    }
  }

  async addQuote(quote: Omit<Quote, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(this.quotesCollection, {
        ...quote,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      console.log('✅ Angebot in Firestore erstellt:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Angebots:', error);
      throw error;
    }
  }

  async updateQuote(quoteId: string, updates: Partial<Quote>): Promise<void> {
    try {
      const docRef = doc(this.quotesCollection, quoteId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Angebot aktualisiert:', quoteId);
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren des Angebots:', error);
      throw error;
    }
  }

  // ==================== INVOICES ====================

  async getInvoices(): Promise<Invoice[]> {
    try {
      const querySnapshot = await getDocs(this.invoicesCollection);
      
      const invoices: Invoice[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        invoices.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate() || new Date(),
          paidDate: data.paidDate?.toDate(),
        } as Invoice);
      });
      
      return invoices;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Rechnungen:', error);
      throw error;
    }
  }

  async addInvoice(invoice: Omit<Invoice, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(this.invoicesCollection, {
        ...invoice,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      console.log('✅ Rechnung in Firestore erstellt:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der Rechnung:', error);
      throw error;
    }
  }

  // ==================== EMAIL HISTORY ====================

  async getEmailHistory(customerId?: string): Promise<EmailHistory[]> {
    try {
      let q;
      if (customerId) {
        q = query(
          this.emailHistoryCollection,
          where('customerId', '==', customerId),
          orderBy('sentAt', 'desc')
        );
      } else {
        q = query(this.emailHistoryCollection, orderBy('sentAt', 'desc'), limit(100));
      }
      
      const querySnapshot = await getDocs(q);
      const emails: EmailHistory[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        emails.push({
          id: doc.id,
          ...data,
          sentAt: data.sentAt?.toDate() || new Date(),
        } as EmailHistory);
      });
      
      return emails;
    } catch (error) {
      console.error('❌ Fehler beim Laden der E-Mail-Historie:', error);
      throw error;
    }
  }

  async addEmailHistory(email: Omit<EmailHistory, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(this.emailHistoryCollection, {
        ...email,
        sentAt: serverTimestamp(),
      });
      
      console.log('✅ E-Mail-Historie in Firestore gespeichert:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Fehler beim Speichern der E-Mail-Historie:', error);
      throw error;
    }
  }

  // ==================== REAL-TIME LISTENERS ====================

  subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
    const unsubscribe = onSnapshot(this.customersCollection, (snapshot) => {
      const customers: Customer[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        customers.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Customer);
      });
      callback(customers);
    });
    
    return unsubscribe;
  }

  subscribeToQuotes(callback: (quotes: Quote[]) => void): () => void {
    const unsubscribe = onSnapshot(this.quotesCollection, (snapshot) => {
      const quotes: Quote[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        quotes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Quote);
      });
      callback(quotes);
    });
    
    return unsubscribe;
  }

  // ==================== HELPER FUNCTIONS ====================

  private async generateCustomerNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Zähle bestehende Kunden für diesen Monat
    const startOfMonth = new Date(year, date.getMonth(), 1);
    const endOfMonth = new Date(year, date.getMonth() + 1, 0);
    
    const q = query(
      this.customersCollection,
      where('createdAt', '>=', startOfMonth),
      where('createdAt', '<=', endOfMonth)
    );
    
    const snapshot = await getDocs(q);
    const count = snapshot.size + 1;
    
    return `K${year}${month}${String(count).padStart(3, '0')}`;
  }

  // ==================== MIGRATION HELPERS ====================

  async migrateCustomerFromGoogleSheets(customer: Customer): Promise<void> {
    try {
      // Check if customer already exists
      const q = query(this.customersCollection, where('customerNumber', '==', customer.customerNumber));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Create new customer
        await setDoc(doc(this.customersCollection, customer.id), {
          ...customer,
          migratedFrom: 'googleSheets',
          migratedAt: serverTimestamp(),
        });
        console.log('✅ Kunde migriert:', customer.customerNumber);
      } else {
        console.log('⏭️ Kunde bereits vorhanden:', customer.customerNumber);
      }
    } catch (error) {
      console.error('❌ Fehler bei Migration:', error);
      throw error;
    }
  }

  async migrateQuoteFromGoogleSheets(quote: Quote): Promise<void> {
    try {
      await setDoc(doc(this.quotesCollection, quote.id), {
        ...quote,
        migratedFrom: 'googleSheets',
        migratedAt: serverTimestamp(),
      });
      console.log('✅ Angebot migriert:', quote.id);
    } catch (error) {
      console.error('❌ Fehler bei Angebots-Migration:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();