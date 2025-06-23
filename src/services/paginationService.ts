import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Customer, Quote, Invoice } from '../types';

interface PaginationOptions {
  pageSize: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Array<{ field: string; operator: any; value: any }>;
}

interface PaginatedResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  totalLoaded: number;
}

class PaginationService {
  private cache = new Map<string, any[]>();
  private lastDocs = new Map<string, QueryDocumentSnapshot<DocumentData>>();
  private listeners = new Map<string, () => void>();
  private cacheTimestamps = new Map<string, number>();

  /**
   * Load initial batch of customers (most recent ones)
   */
  async loadInitialCustomers(options: PaginationOptions = { pageSize: 500 }): Promise<PaginatedResult<Customer>> {
    const cacheKey = `customers_initial_${options.pageSize}_${options.orderByField}_${options.orderDirection}`;
    
    // Return cached data if available and fresh (less than 2 minutes old)
    if (this.cache.has(cacheKey)) {
      const cachedData = this.cache.get(cacheKey)!;
      const cacheAge = Date.now() - (this.cacheTimestamps.get(cacheKey) || 0);
      if (cacheAge < 2 * 60 * 1000) { // 2 minutes
        return {
          data: cachedData,
          lastDoc: this.lastDocs.get(cacheKey) || null,
          hasMore: cachedData.length >= options.pageSize,
          totalLoaded: cachedData.length
        };
      }
    }

    try {
      const customersRef = collection(db, 'customers');
      let q = query(
        customersRef,
        orderBy(options.orderByField || 'createdAt', options.orderDirection || 'desc'),
        limit(options.pageSize)
      );

      // Add filters if provided
      if (options.filters) {
        options.filters.forEach(filter => {
          q = query(q, where(filter.field, filter.operator, filter.value));
        });
      }

      const snapshot = await getDocs(q);
      const customers: Customer[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        customers.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Customer);
      });

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      // Cache the results with timestamp
      this.cache.set(cacheKey, customers);
      this.cacheTimestamps.set(cacheKey, Date.now());
      if (lastDoc) {
        this.lastDocs.set(cacheKey, lastDoc);
      }

      return {
        data: customers,
        lastDoc: lastDoc || null,
        hasMore: snapshot.docs.length >= options.pageSize,
        totalLoaded: customers.length
      };
    } catch (error) {
      console.error('Error loading initial customers:', error);
      return {
        data: [],
        lastDoc: null,
        hasMore: false,
        totalLoaded: 0
      };
    }
  }

  /**
   * Load next page of customers
   */
  async loadMoreCustomers(
    lastDoc: QueryDocumentSnapshot<DocumentData>,
    options: PaginationOptions = { pageSize: 50 }
  ): Promise<PaginatedResult<Customer>> {
    try {
      const customersRef = collection(db, 'customers');
      const q = query(
        customersRef,
        orderBy(options.orderByField || 'createdAt', options.orderDirection || 'desc'),
        startAfter(lastDoc),
        limit(options.pageSize)
      );

      const snapshot = await getDocs(q);
      const customers: Customer[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        customers.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Customer);
      });

      const newLastDoc = snapshot.docs[snapshot.docs.length - 1];

      return {
        data: customers,
        lastDoc: newLastDoc || null,
        hasMore: snapshot.docs.length >= options.pageSize,
        totalLoaded: customers.length
      };
    } catch (error) {
      console.error('Error loading more customers:', error);
      return {
        data: [],
        lastDoc: null,
        hasMore: false,
        totalLoaded: 0
      };
    }
  }

  /**
   * Subscribe to real-time updates for new customers
   */
  subscribeToNewCustomers(
    callback: (customers: Customer[]) => void,
    options: { since?: Date } = {}
  ): () => void {
    const customersRef = collection(db, 'customers');
    const since = options.since || new Date();
    
    const q = query(
      customersRef,
      where('createdAt', '>', Timestamp.fromDate(since)),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
      const newCustomers: Customer[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        newCustomers.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Customer);
      });

      callback(newCustomers);
    });

    // Store unsubscribe function
    const listenerId = `new_customers_${Date.now()}`;
    this.listeners.set(listenerId, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Load quotes with pagination
   */
  async loadQuotes(
    lastDoc: QueryDocumentSnapshot<DocumentData> | null,
    options: PaginationOptions = { pageSize: 50 }
  ): Promise<PaginatedResult<Quote>> {
    try {
      const quotesRef = collection(db, 'quotes');
      let q = query(
        quotesRef,
        orderBy(options.orderByField || 'createdAt', options.orderDirection || 'desc'),
        limit(options.pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const quotes: Quote[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        quotes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Quote);
      });

      const newLastDoc = snapshot.docs[snapshot.docs.length - 1];

      return {
        data: quotes,
        lastDoc: newLastDoc || null,
        hasMore: snapshot.docs.length >= options.pageSize,
        totalLoaded: quotes.length
      };
    } catch (error) {
      console.error('Error loading quotes:', error);
      return {
        data: [],
        lastDoc: null,
        hasMore: false,
        totalLoaded: 0
      };
    }
  }

  /**
   * Load invoices with pagination
   */
  async loadInvoices(
    lastDoc: QueryDocumentSnapshot<DocumentData> | null,
    options: PaginationOptions = { pageSize: 50 }
  ): Promise<PaginatedResult<Invoice>> {
    try {
      const invoicesRef = collection(db, 'invoices');
      let q = query(
        invoicesRef,
        orderBy(options.orderByField || 'createdAt', options.orderDirection || 'desc'),
        limit(options.pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
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

      const newLastDoc = snapshot.docs[snapshot.docs.length - 1];

      return {
        data: invoices,
        lastDoc: newLastDoc || null,
        hasMore: snapshot.docs.length >= options.pageSize,
        totalLoaded: invoices.length
      };
    } catch (error) {
      console.error('Error loading invoices:', error);
      return {
        data: [],
        lastDoc: null,
        hasMore: false,
        totalLoaded: 0
      };
    }
  }

  /**
   * Search with pagination
   */
  async searchWithPagination<T>(
    collectionName: string,
    searchField: string,
    searchValue: string,
    lastDoc: QueryDocumentSnapshot<DocumentData> | null,
    options: PaginationOptions = { pageSize: 20 }
  ): Promise<PaginatedResult<T>> {
    try {
      const collectionRef = collection(db, collectionName);
      let q = query(
        collectionRef,
        where(searchField, '>=', searchValue),
        where(searchField, '<=', searchValue + '\uf8ff'),
        orderBy(searchField),
        limit(options.pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const results: T[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        results.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as T);
      });

      const newLastDoc = snapshot.docs[snapshot.docs.length - 1];

      return {
        data: results,
        lastDoc: newLastDoc || null,
        hasMore: snapshot.docs.length >= options.pageSize,
        totalLoaded: results.length
      };
    } catch (error) {
      console.error('Error searching with pagination:', error);
      return {
        data: [],
        lastDoc: null,
        hasMore: false,
        totalLoaded: 0
      };
    }
  }

  /**
   * Clear cache for a specific key or all caches
   */
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key);
      this.lastDocs.delete(key);
      this.cacheTimestamps.delete(key);
    } else {
      this.cache.clear();
      this.lastDocs.clear();
      this.cacheTimestamps.clear();
    }
  }

  /**
   * Cleanup all listeners
   */
  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    this.clearCache();
  }
}

export const paginationService = new PaginationService();