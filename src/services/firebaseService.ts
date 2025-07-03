// Firebase Service Stub - Firebase is disabled
// This file provides empty implementations for backward compatibility

import { Customer, Quote, Invoice, EmailHistory, CalendarEvent, ShareLink } from '../types';

export class FirebaseServiceStub {
  private logDisabled(operation: string) {
    console.log(`⚠️ Firebase operation "${operation}" called but Firebase is disabled - using Supabase instead`);
  }

  // Initialization
  async initialize(): Promise<void> {
    this.logDisabled('initialize');
  }

  async testConnection(): Promise<void> {
    this.logDisabled('testConnection');
    throw new Error('Firebase is disabled - app uses Supabase only');
  }

  isAvailable(): boolean {
    return false;
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    this.logDisabled('getCustomers');
    return [];
  }

  async getCustomer(customerId: string): Promise<Customer | null> {
    this.logDisabled('getCustomer');
    return null;
  }

  async addCustomer(customer: Omit<Customer, 'id'>): Promise<string> {
    this.logDisabled('addCustomer');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<void> {
    this.logDisabled('updateCustomer');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async deleteCustomer(customerId: string): Promise<void> {
    this.logDisabled('deleteCustomer');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    this.logDisabled('searchCustomers');
    return [];
  }

  // Quote operations
  async getQuotes(): Promise<Quote[]> {
    this.logDisabled('getQuotes');
    return [];
  }

  async getQuote(quoteId: string): Promise<Quote | null> {
    this.logDisabled('getQuote');
    return null;
  }

  async getQuotesByCustomerId(customerId: string): Promise<Quote[]> {
    this.logDisabled('getQuotesByCustomerId');
    return [];
  }

  async addQuote(quote: Omit<Quote, 'id'>): Promise<string> {
    this.logDisabled('addQuote');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async updateQuote(quoteId: string, updates: Partial<Quote>): Promise<void> {
    this.logDisabled('updateQuote');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async deleteQuote(quoteId: string): Promise<void> {
    this.logDisabled('deleteQuote');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    this.logDisabled('getInvoices');
    return [];
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    this.logDisabled('getInvoice');
    return null;
  }

  async addInvoice(invoice: Omit<Invoice, 'id'>): Promise<string> {
    this.logDisabled('addInvoice');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<void> {
    this.logDisabled('updateInvoice');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    this.logDisabled('deleteInvoice');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    this.logDisabled('getInvoicesByCustomer');
    return [];
  }

  // ShareLink operations
  async createShareLink(customerId: string, quoteId: string, expiresIn?: number): Promise<ShareLink> {
    this.logDisabled('createShareLink');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async getShareLinkByToken(token: string): Promise<ShareLink | null> {
    this.logDisabled('getShareLinkByToken');
    return null;
  }

  async updateShareLink(token: string, updates: Partial<ShareLink>): Promise<void> {
    this.logDisabled('updateShareLink');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  // Email history operations
  async addEmailHistory(emailHistory: Omit<EmailHistory, 'id'>): Promise<string> {
    this.logDisabled('addEmailHistory');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async getEmailHistory(customerId?: string): Promise<EmailHistory[]> {
    this.logDisabled('getEmailHistory');
    return [];
  }

  // Calendar operations
  async getCalendarEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    this.logDisabled('getCalendarEvents');
    return [];
  }

  async addCalendarEvent(event: Omit<CalendarEvent, 'id'>): Promise<string> {
    this.logDisabled('addCalendarEvent');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async getCalendarEventsByCustomer(customerId: string): Promise<CalendarEvent[]> {
    this.logDisabled('getCalendarEventsByCustomer');
    return [];
  }

  async updateCalendarEvent(id: string, event: Partial<CalendarEvent>): Promise<void> {
    this.logDisabled('updateCalendarEvent');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    this.logDisabled('deleteCalendarEvent');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  // Real-time subscriptions
  subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
    this.logDisabled('subscribeToCustomers');
    return () => {};
  }

  subscribeToQuotes(callback: (quotes: Quote[]) => void): () => void {
    this.logDisabled('subscribeToQuotes');
    return () => {};
  }

  subscribeToInvoices(callback: (invoices: Invoice[]) => void): () => void {
    this.logDisabled('subscribeToInvoices');
    return () => {};
  }

  // Migration methods
  async migrateCustomerFromGoogleSheets(customer: Customer): Promise<void> {
    this.logDisabled('migrateCustomerFromGoogleSheets');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async migrateQuoteFromGoogleSheets(quote: Quote): Promise<void> {
    this.logDisabled('migrateQuoteFromGoogleSheets');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async migrateInvoiceFromGoogleSheets(invoice: Invoice): Promise<void> {
    this.logDisabled('migrateInvoiceFromGoogleSheets');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  // Recognition rules methods
  async getRecognitionRules(): Promise<any[]> {
    this.logDisabled('getRecognitionRules');
    return [];
  }

  async saveRecognitionRule(rule: any): Promise<void> {
    this.logDisabled('saveRecognitionRule');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async updateRecognitionRule(id: string, rule: any): Promise<void> {
    this.logDisabled('updateRecognitionRule');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async deleteRecognitionRule(ruleId: string): Promise<void> {
    this.logDisabled('deleteRecognitionRule');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  // Email invoice methods
  async getEmailInvoices(): Promise<any[]> {
    this.logDisabled('getEmailInvoices');
    return [];
  }

  async saveEmailInvoice(invoice: any): Promise<void> {
    this.logDisabled('saveEmailInvoice');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async updateEmailInvoice(id: string, invoice: any): Promise<void> {
    this.logDisabled('updateEmailInvoice');
    throw new Error('Firebase is disabled - use Supabase service');
  }

  async deleteEmailInvoice(id: string): Promise<void> {
    this.logDisabled('deleteEmailInvoice');
    throw new Error('Firebase is disabled - use Supabase service');
  }
}

// Export stub instance
export const firebaseService = new FirebaseServiceStub();