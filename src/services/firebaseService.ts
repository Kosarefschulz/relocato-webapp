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
import { Customer, Quote, Invoice, EmailHistory, CalendarEvent } from '../types';

interface ShareLink {
  id: string;
  customerId: string;
  quoteId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  createdBy?: string;
  usedAt?: Date;
}

class FirebaseService {
  // Collections - nur initialisieren wenn db vorhanden
  private customersCollection = db ? collection(db, 'customers') : null;
  private quotesCollection = db ? collection(db, 'quotes') : null;
  private invoicesCollection = db ? collection(db, 'invoices') : null;
  private emailHistoryCollection = db ? collection(db, 'emailHistory') : null;
  private dispositionsCollection = db ? collection(db, 'dispositions') : null;
  private shareLinksCollection = db ? collection(db, 'shareLinks') : null;
  private calendarEventsCollection = db ? collection(db, 'calendarEvents') : null;

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
        try {
          const customerData: any = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' 
              ? data.createdAt.toDate() 
              : data.createdAt || new Date(),
          };
          
          // Skip salesNotes for now to avoid errors
          if (customerData.salesNotes) {
            delete customerData.salesNotes;
          }
          
          // Convert cancelledAt if exists
          if (customerData.cancelledAt && typeof customerData.cancelledAt.toDate === 'function') {
            customerData.cancelledAt = customerData.cancelledAt.toDate();
          }
          
          customers.push(customerData as Customer);
        } catch (error) {
          console.warn(`⚠️ Fehler beim Verarbeiten von Kunde ${doc.id}:`, error);
          // Füge Kunde trotzdem hinzu, nur mit Name
          customers.push({
            id: doc.id,
            ...data,
            createdAt: new Date(),
          } as Customer);
        }
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
      
      // Versuche zuerst mit der direkten ID
      const docRef = doc(this.customersCollection, customerId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const customerData: any = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' 
            ? data.createdAt.toDate() 
            : data.createdAt || new Date(),
        };
        
        // Skip salesNotes for now to avoid errors
        if (customerData.salesNotes) {
          delete customerData.salesNotes;
        }
        
        // Convert cancelledAt if exists
        if (customerData.cancelledAt && typeof customerData.cancelledAt.toDate === 'function') {
          customerData.cancelledAt = customerData.cancelledAt.toDate();
        }
        
        return customerData as Customer;
      }
      
      // Wenn nicht gefunden, suche nach Kundennummer
      console.log(`⚠️ Kunde mit ID ${customerId} nicht gefunden, suche nach Kundennummer...`);
      const q = query(this.customersCollection, where('customerNumber', '==', customerId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const foundDoc = querySnapshot.docs[0];
        const data = foundDoc.data();
        console.log(`✅ Kunde gefunden mit Firebase ID: ${foundDoc.id}`);
        
        const customerData: any = {
          id: foundDoc.id,
          ...data,
          createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' 
            ? data.createdAt.toDate() 
            : data.createdAt || new Date(),
        };
        
        // Skip salesNotes for now to avoid errors
        if (customerData.salesNotes) {
          delete customerData.salesNotes;
        }
        
        // Convert cancelledAt if exists
        if (customerData.cancelledAt && typeof customerData.cancelledAt.toDate === 'function') {
          customerData.cancelledAt = customerData.cancelledAt.toDate();
        }
        
        return customerData as Customer;
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
      
      // Filter out undefined values
      const customerData: any = {
        ...customer,
        customerNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Remove undefined fields
      Object.keys(customerData).forEach(key => {
        if (customerData[key] === undefined) {
          delete customerData[key];
        }
      });
      
      const docRef = await addDoc(this.customersCollection, customerData);
      
      console.log('✅ Kunde in Firestore erstellt:', docRef.id, 'mit Kundennummer:', customerNumber);
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
      
      // Filter out undefined values and convert dates
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };
      
      // Skip salesNotes updates for now
      if (updateData.salesNotes) {
        delete updateData.salesNotes;
      }
      
      // Convert other date fields
      if (updateData.cancelledAt && updateData.cancelledAt instanceof Date) {
        updateData.cancelledAt = Timestamp.fromDate(updateData.cancelledAt);
      }
      
      // Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      await updateDoc(docRef, updateData);
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
          createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate()
            : data.createdAt || new Date(),
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
          createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate()
            : data.createdAt || new Date(),
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
          createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate()
            : data.createdAt || new Date(),
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
      
      // Filter out undefined values
      const quoteData: any = {
        ...quote,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Remove undefined fields
      Object.keys(quoteData).forEach(key => {
        if (quoteData[key] === undefined) {
          delete quoteData[key];
        }
      });
      
      const docRef = await addDoc(this.quotesCollection, quoteData);
      
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
      
      // Versuche zuerst mit der direkten ID
      let docRef = doc(this.quotesCollection, quoteId);
      let docSnapshot = await getDoc(docRef);
      
      // Wenn das Dokument nicht existiert, suche nach der numerischen ID
      if (!docSnapshot.exists()) {
        console.log(`⚠️ Dokument mit ID ${quoteId} nicht gefunden, suche nach numerischer ID...`);
        
        // Suche das Dokument mit der numerischen ID im Datenfeld
        const q = query(this.quotesCollection, where('id', '==', quoteId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Verwende die Firebase Document ID des gefundenen Dokuments
          const foundDoc = querySnapshot.docs[0];
          docRef = foundDoc.ref;
          console.log(`✅ Dokument gefunden mit Firebase ID: ${foundDoc.id}`);
        } else {
          throw new Error(`Angebot mit ID ${quoteId} nicht gefunden`);
        }
      }
      
      // Filter out undefined values
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };
      
      // Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      await updateDoc(docRef, updateData);
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
        try {
          invoices.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
              ? data.createdAt.toDate()
              : data.createdAt || new Date(),
            dueDate: data.dueDate && typeof data.dueDate.toDate === 'function'
              ? data.dueDate.toDate()
              : data.dueDate || new Date(),
            paidDate: data.paidDate && typeof data.paidDate.toDate === 'function'
              ? data.paidDate.toDate()
              : data.paidDate,
          } as Invoice);
        } catch (error) {
          console.warn(`⚠️ Fehler beim Verarbeiten von Rechnung ${doc.id}:`, error);
        }
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
          createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate()
            : data.createdAt || new Date(),
          dueDate: data.dueDate && typeof data.dueDate.toDate === 'function'
            ? data.dueDate.toDate()
            : data.dueDate || new Date(),
          paidDate: data.paidDate && typeof data.paidDate.toDate === 'function'
            ? data.paidDate.toDate()
            : data.paidDate,
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
          createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate()
            : data.createdAt || new Date(),
          dueDate: data.dueDate && typeof data.dueDate.toDate === 'function'
            ? data.dueDate.toDate()
            : data.dueDate || new Date(),
          paidDate: data.paidDate && typeof data.paidDate.toDate === 'function'
            ? data.paidDate.toDate()
            : data.paidDate,
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
      
      // Filter out undefined values
      const invoiceData: any = {
        ...invoice,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Remove undefined fields
      if (invoiceData.paidDate === undefined) {
        delete invoiceData.paidDate;
      }
      
      const docRef = await addDoc(this.invoicesCollection, invoiceData);
      
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
      
      // Filter out undefined values
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };
      
      // Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      await updateDoc(docRef, updateData);
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
          sentAt: data.sentAt && typeof data.sentAt.toDate === 'function'
            ? data.sentAt.toDate()
            : data.sentAt || new Date(),
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
        const customerData: any = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate()
            : data.createdAt || new Date(),
        };
        
        // Skip salesNotes for now to avoid errors
        if (customerData.salesNotes) {
          delete customerData.salesNotes;
        }
        
        // Convert cancelledAt if exists
        if (customerData.cancelledAt && typeof customerData.cancelledAt.toDate === 'function') {
          customerData.cancelledAt = customerData.cancelledAt.toDate();
        }
        
        customers.push(customerData as Customer);
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
          createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate()
            : data.createdAt || new Date(),
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
          createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate()
            : data.createdAt || new Date(),
          dueDate: data.dueDate && typeof data.dueDate.toDate === 'function'
            ? data.dueDate.toDate()
            : data.dueDate || new Date(),
          paidDate: data.paidDate && typeof data.paidDate.toDate === 'function'
            ? data.paidDate.toDate()
            : data.paidDate,
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
    
    if (!this.customersCollection) throw new Error('Customers collection not initialized');
    
    // Query for customers with customer numbers starting with the current year and month
    const prefix = `K${year}${month}`;
    const q = query(
      this.customersCollection,
      where('customerNumber', '>=', prefix),
      where('customerNumber', '<', prefix + '\uf8ff'),
      orderBy('customerNumber', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    let nextNumber = 1;
    if (!snapshot.empty) {
      const lastCustomerNumber = snapshot.docs[0].data().customerNumber;
      // Extract the number part (last 3 digits)
      const lastNumber = parseInt(lastCustomerNumber.slice(-3));
      nextNumber = lastNumber + 1;
    }
    
    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
  }

  // ==================== MIGRATION HELPERS ====================

  async migrateCustomerFromGoogleSheets(customer: Customer): Promise<void> {
    try {
      if (!this.customersCollection) throw new Error('Customers collection not initialized');
      
      // Skip if customerNumber is undefined or empty
      if (!customer.customerNumber) {
        console.warn('⚠️ Kunde ohne Kundennummer übersprungen:', customer.id);
        return;
      }
      
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

  // ==================== SHARE LINKS ====================

  async createShareLink(customerId: string, quoteId: string, createdBy?: string): Promise<ShareLink> {
    try {
      if (!this.shareLinksCollection) throw new Error('ShareLinks collection not initialized');
      
      // Generate unique token
      const token = btoa(`${customerId}-${Date.now()}-${Math.random()}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
      
      // Create expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const shareLinkData = {
        customerId,
        quoteId,
        token,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: serverTimestamp(),
        createdBy,
      };
      
      const docRef = await addDoc(this.shareLinksCollection, shareLinkData);
      
      console.log('✅ Share Link erstellt:', docRef.id);
      
      return {
        id: docRef.id,
        customerId,
        quoteId,
        token,
        expiresAt,
        createdAt: new Date(),
        createdBy,
      };
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Share Links:', error);
      throw error;
    }
  }

  async getShareLinkByToken(token: string): Promise<ShareLink | null> {
    try {
      if (!this.shareLinksCollection) throw new Error('ShareLinks collection not initialized');
      
      const q = query(this.shareLinksCollection, where('token', '==', token));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        customerId: data.customerId,
        quoteId: data.quoteId,
        token: data.token,
        expiresAt: data.expiresAt && typeof data.expiresAt.toDate === 'function'
          ? data.expiresAt.toDate()
          : data.expiresAt || new Date(),
        createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
          ? data.createdAt.toDate()
          : data.createdAt || new Date(),
        createdBy: data.createdBy,
        usedAt: data.usedAt && typeof data.usedAt.toDate === 'function'
          ? data.usedAt.toDate()
          : data.usedAt,
      };
    } catch (error) {
      console.error('❌ Fehler beim Abrufen des Share Links:', error);
      throw error;
    }
  }

  async updateShareLinkUsage(linkId: string): Promise<void> {
    try {
      if (!this.shareLinksCollection) throw new Error('ShareLinks collection not initialized');
      
      const docRef = doc(this.shareLinksCollection, linkId);
      await updateDoc(docRef, {
        usedAt: serverTimestamp(),
      });
      
      console.log('✅ Share Link Nutzung aktualisiert:', linkId);
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Share Link Nutzung:', error);
      throw error;
    }
  }

  async deleteExpiredShareLinks(): Promise<void> {
    try {
      if (!this.shareLinksCollection) throw new Error('ShareLinks collection not initialized');
      
      const now = new Date();
      const q = query(this.shareLinksCollection, where('expiresAt', '<', Timestamp.fromDate(now)));
      const querySnapshot = await getDocs(q);
      
      const deletions = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletions);
      
      console.log(`✅ ${querySnapshot.size} abgelaufene Share Links gelöscht`);
    } catch (error) {
      console.error('❌ Fehler beim Löschen abgelaufener Share Links:', error);
      throw error;
    }
  }

  // ==================== INVOICE RECOGNITION ====================

  async getRecognitionRules(): Promise<any[]> {
    try {
      if (!db) return [];
      const rulesCollection = collection(db, 'recognitionRules');
      const querySnapshot = await getDocs(rulesCollection);
      
      const rules: any[] = [];
      querySnapshot.forEach((doc) => {
        rules.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return rules;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Recognition Rules:', error);
      return [];
    }
  }

  async saveRecognitionRule(rule: any): Promise<void> {
    try {
      if (!db) throw new Error('Firebase not initialized');
      const rulesCollection = collection(db, 'recognitionRules');
      await setDoc(doc(rulesCollection, rule.id), rule);
      console.log('✅ Recognition Rule gespeichert:', rule.id);
    } catch (error) {
      console.error('❌ Fehler beim Speichern der Recognition Rule:', error);
      throw error;
    }
  }

  async updateRecognitionRule(id: string, rule: any): Promise<void> {
    try {
      if (!db) throw new Error('Firebase not initialized');
      const rulesCollection = collection(db, 'recognitionRules');
      await updateDoc(doc(rulesCollection, id), rule);
      console.log('✅ Recognition Rule aktualisiert:', id);
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Recognition Rule:', error);
      throw error;
    }
  }

  async deleteRecognitionRule(id: string): Promise<void> {
    try {
      if (!db) throw new Error('Firebase not initialized');
      const rulesCollection = collection(db, 'recognitionRules');
      await deleteDoc(doc(rulesCollection, id));
      console.log('✅ Recognition Rule gelöscht:', id);
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Recognition Rule:', error);
      throw error;
    }
  }

  async getEmailInvoices(): Promise<any[]> {
    try {
      if (!db) return [];
      const emailInvoicesCollection = collection(db, 'emailInvoices');
      const querySnapshot = await getDocs(emailInvoicesCollection);
      
      const invoices: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        invoices.push({
          id: doc.id,
          ...data,
          receivedDate: data.receivedDate && typeof data.receivedDate.toDate === 'function'
            ? data.receivedDate.toDate()
            : data.receivedDate || new Date(),
          processedDate: data.processedDate && typeof data.processedDate.toDate === 'function'
            ? data.processedDate.toDate()
            : data.processedDate
        });
      });
      
      return invoices;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Email Invoices:', error);
      return [];
    }
  }

  async saveEmailInvoice(invoice: any): Promise<void> {
    try {
      if (!db) throw new Error('Firebase not initialized');
      const emailInvoicesCollection = collection(db, 'emailInvoices');
      await setDoc(doc(emailInvoicesCollection, invoice.id), {
        ...invoice,
        receivedDate: Timestamp.fromDate(invoice.receivedDate),
        processedDate: invoice.processedDate ? Timestamp.fromDate(invoice.processedDate) : null
      });
      console.log('✅ Email Invoice gespeichert:', invoice.id);
    } catch (error) {
      console.error('❌ Fehler beim Speichern der Email Invoice:', error);
      throw error;
    }
  }

  async updateEmailInvoice(id: string, invoice: any): Promise<void> {
    try {
      if (!db) throw new Error('Firebase not initialized');
      const emailInvoicesCollection = collection(db, 'emailInvoices');
      await updateDoc(doc(emailInvoicesCollection, id), {
        ...invoice,
        receivedDate: Timestamp.fromDate(invoice.receivedDate),
        processedDate: invoice.processedDate ? Timestamp.fromDate(invoice.processedDate) : null
      });
      console.log('✅ Email Invoice aktualisiert:', id);
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Email Invoice:', error);
      throw error;
    }
  }

  // ==================== CALENDAR EVENTS ====================
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    try {
      if (!this.checkFirebase() || !this.calendarEventsCollection) return [];
      
      const querySnapshot = await getDocs(
        query(this.calendarEventsCollection, orderBy('date', 'desc'))
      );
      
      const events: CalendarEvent[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        events.push({
          id: doc.id,
          ...data,
          date: data.date && typeof data.date.toDate === 'function' 
            ? data.date.toDate() 
            : data.date,
          startTime: data.startTime && typeof data.startTime.toDate === 'function'
            ? data.startTime.toDate()
            : data.startTime,
          endTime: data.endTime && typeof data.endTime.toDate === 'function'
            ? data.endTime.toDate()
            : data.endTime,
          importedAt: data.importedAt && typeof data.importedAt.toDate === 'function'
            ? data.importedAt.toDate()
            : data.importedAt,
        } as CalendarEvent);
      });
      
      return events;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Kalender-Events:', error);
      return [];
    }
  }

  async getCalendarEventsByCustomer(customerId: string): Promise<CalendarEvent[]> {
    try {
      if (!this.checkFirebase() || !this.calendarEventsCollection) return [];
      
      const q = query(
        this.calendarEventsCollection,
        where('customerId', '==', customerId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const events: CalendarEvent[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        events.push({
          id: doc.id,
          ...data,
          date: data.date && typeof data.date.toDate === 'function' 
            ? data.date.toDate() 
            : data.date,
          startTime: data.startTime && typeof data.startTime.toDate === 'function'
            ? data.startTime.toDate()
            : data.startTime,
          endTime: data.endTime && typeof data.endTime.toDate === 'function'
            ? data.endTime.toDate()
            : data.endTime,
          importedAt: data.importedAt && typeof data.importedAt.toDate === 'function'
            ? data.importedAt.toDate()
            : data.importedAt,
        } as CalendarEvent);
      });
      
      return events;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Kunden-Kalender-Events:', error);
      return [];
    }
  }

  async addCalendarEvent(event: Omit<CalendarEvent, 'id'>): Promise<string> {
    try {
      if (!this.checkFirebase() || !this.calendarEventsCollection) {
        throw new Error('Firebase not available');
      }
      
      const eventData = {
        ...event,
        date: event.date instanceof Date ? Timestamp.fromDate(event.date) : event.date,
        startTime: event.startTime instanceof Date ? Timestamp.fromDate(event.startTime) : event.startTime,
        endTime: event.endTime instanceof Date ? Timestamp.fromDate(event.endTime) : event.endTime,
        importedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(this.calendarEventsCollection, eventData);
      console.log('✅ Kalender-Event erstellt:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Kalender-Events:', error);
      throw error;
    }
  }

  async updateCalendarEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void> {
    try {
      if (!this.checkFirebase() || !this.calendarEventsCollection) {
        throw new Error('Firebase not available');
      }
      
      const updateData: any = { ...updates };
      
      if (updates.date instanceof Date) {
        updateData.date = Timestamp.fromDate(updates.date);
      }
      if (updates.startTime instanceof Date) {
        updateData.startTime = Timestamp.fromDate(updates.startTime);
      }
      if (updates.endTime instanceof Date) {
        updateData.endTime = Timestamp.fromDate(updates.endTime);
      }
      
      await updateDoc(doc(this.calendarEventsCollection, eventId), updateData);
      console.log('✅ Kalender-Event aktualisiert:', eventId);
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren des Kalender-Events:', error);
      throw error;
    }
  }

  async deleteCalendarEvent(eventId: string): Promise<void> {
    try {
      if (!this.checkFirebase() || !this.calendarEventsCollection) {
        throw new Error('Firebase not available');
      }
      
      await deleteDoc(doc(this.calendarEventsCollection, eventId));
      console.log('✅ Kalender-Event gelöscht:', eventId);
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Kalender-Events:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();