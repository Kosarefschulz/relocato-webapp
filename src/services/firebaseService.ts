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
      if (!this.customersCollection) {
        console.error('Customers collection not initialized');
        return null;
      }
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
      
      if (!this.customersCollection) throw new Error('Customers collection not initialized');
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
      if (!this.customersCollection) throw new Error('Customers collection not initialized');
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
      if (!this.customersCollection) throw new Error('Customers collection not initialized');
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
      if (!this.quotesCollection) return [];
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

  async getQuoteById(quoteId: string): Promise<Quote | null> {
    try {
      if (!this.quotesCollection) {
        console.error('Quotes collection not initialized');
        return null;
      }
      const docRef = doc(this.quotesCollection, quoteId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Quote;
      }
      return null;
    } catch (error) {
      console.error('❌ Fehler beim Laden des Angebots:', error);
      throw error;
    }
  }

  async getQuotesByCustomerId(customerId: string): Promise<Quote[]> {
    try {
      if (!this.quotesCollection) return [];
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
      if (!this.quotesCollection) throw new Error('Quotes collection not initialized');
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
      if (!this.quotesCollection) throw new Error('Quotes collection not initialized');
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

  async deleteQuote(quoteId: string): Promise<void> {
    try {
      if (!this.quotesCollection) throw new Error('Quotes collection not initialized');
      const docRef = doc(this.quotesCollection, quoteId);
      await deleteDoc(docRef);
      console.log('✅ Angebot gelöscht:', quoteId);
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Angebots:', error);
      throw error;
    }
  }

  // ==================== INVOICES ====================

  async getInvoices(): Promise<Invoice[]> {
    try {
      if (!this.invoicesCollection) return [];
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

  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    try {
      if (!this.invoicesCollection) {
        console.error('Invoices collection not initialized');
        return null;
      }
      const docRef = doc(this.invoicesCollection, invoiceId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate() || new Date(),
          paidDate: data.paidDate?.toDate(),
        } as Invoice;
      }
      return null;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Rechnung:', error);
      throw error;
    }
  }

  async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    try {
      if (!this.invoicesCollection) return [];
      const q = query(
        this.invoicesCollection,
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
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
      console.error('❌ Fehler beim Laden der Kundenrechnungen:', error);
      throw error;
    }
  }

  async addInvoice(invoice: Omit<Invoice, 'id'>): Promise<string> {
    try {
      if (!this.invoicesCollection) throw new Error('Invoices collection not initialized');
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

  async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<void> {
    try {
      if (!this.invoicesCollection) throw new Error('Invoices collection not initialized');
      const docRef = doc(this.invoicesCollection, invoiceId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Rechnung aktualisiert:', invoiceId);
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Rechnung:', error);
      throw error;
    }
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    try {
      if (!this.invoicesCollection) throw new Error('Invoices collection not initialized');
      const docRef = doc(this.invoicesCollection, invoiceId);
      await deleteDoc(docRef);
      console.log('✅ Rechnung gelöscht:', invoiceId);
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Rechnung:', error);
      throw error;
    }
  }

  // ==================== EMAIL HISTORY ====================

  async getEmailHistory(customerId?: string): Promise<EmailHistory[]> {
    try {
      if (!this.emailHistoryCollection) throw new Error('Email history collection not initialized');
      
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
        const data = doc.data() as any;
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
      if (!this.emailHistoryCollection) throw new Error('Email history collection not initialized');
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
    if (!this.customersCollection) {
      console.warn('Customers collection not initialized');
      return () => {};
    }
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
    if (!this.quotesCollection) {
      console.warn('Quotes collection not initialized');
      return () => {};
    }
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

  subscribeToInvoices(callback: (invoices: Invoice[]) => void): () => void {
    if (!this.invoicesCollection) {
      console.warn('Invoices collection not initialized');
      return () => {};
    }
    const unsubscribe = onSnapshot(this.invoicesCollection, (snapshot) => {
      const invoices: Invoice[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        invoices.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate() || new Date(),
          paidDate: data.paidDate?.toDate(),
        } as Invoice);
      });
      callback(invoices);
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
    
    if (!this.customersCollection) throw new Error('Customers collection not initialized');
    
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
      if (!this.customersCollection) throw new Error('Customers collection not initialized');
      
      // Check if customer already exists
      const q = query(this.customersCollection, where('customerNumber', '==', customer.customerNumber));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Create new customer
        await setDoc(doc(this.customersCollection!, customer.id), {
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
      if (!this.quotesCollection) throw new Error('Quotes collection not initialized');
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