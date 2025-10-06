import { supabase } from '../config/supabase';
import type { Database } from '../config/supabase';
import { 
  Customer, 
  Quote, 
  Invoice, 
  EmailHistory, 
  ShareLink,
  CalendarEvent 
} from '../types';
import { v4 as uuidv4 } from 'uuid';

type Tables = Database['public']['Tables'];

export class SupabaseService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('🚀 Initializing Supabase Service...');
    
    // Test connection
    const { data, error } = await supabase.from('customers').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      throw error;
    }
    
    console.log('✅ Supabase Service initialized successfully');
    this.initialized = true;
  }

  // Customer Operations
  async getCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return this.mapSupabaseCustomersToLocal(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  async getCustomer(customerId: string): Promise<Customer | null> {
    try {
      console.log('🔍 Searching for customer with ID:', customerId);
      
      // Check if it's a UUID format first
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId);
      
      let query;
      if (isUUID) {
        // If it's a UUID, search by id
        query = supabase
          .from('customers')
          .select('*')
          .eq('id', customerId)
          .eq('is_deleted', false);
      } else {
        // If it's not a UUID, search by firebase_id or customer_number
        query = supabase
          .from('customers')
          .select('*')
          .or(`firebase_id.eq.${customerId},customer_number.eq.${customerId}`)
          .eq('is_deleted', false);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('❌ Customer query error:', error);
        return null;
      }

      if (!data) {
        console.warn('⚠️ Customer not found:', customerId);
        return null;
      }

      console.log('✅ Customer found:', data.name || data.id);
      return this.mapSupabaseCustomerToLocal(data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
  }

  async addCustomer(customer: Omit<Customer, 'id'>): Promise<string> {
    try {
      const supabaseCustomer = this.mapLocalCustomerToSupabase(customer as Customer);
      
      const { data, error } = await supabase
        .from('customers')
        .insert(supabaseCustomer)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  }

  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<void> {
    try {
      const supabaseUpdates = this.mapLocalCustomerToSupabase(updates as Customer, true);
      
      const { error } = await supabase
        .from('customers')
        .update(supabaseUpdates)
        .or(`id.eq.${customerId},firebase_id.eq.${customerId}`);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async deleteCustomer(customerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_deleted: true })
        .or(`id.eq.${customerId},firebase_id.eq.${customerId}`);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_deleted', false)
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,customer_number.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return this.mapSupabaseCustomersToLocal(data || []);
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }

  // Quote Operations
  async getQuotes(): Promise<Quote[]> {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return this.mapSupabaseQuotesToLocal(data || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return [];
    }
  }

  async getQuote(quoteId: string): Promise<Quote | null> {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .or(`id.eq.${quoteId},firebase_id.eq.${quoteId}`)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      return data ? this.mapSupabaseQuoteToLocal(data) : null;
    } catch (error) {
      console.error('Error fetching quote:', error);
      return null;
    }
  }

  async getQuotesByCustomerId(customerId: string): Promise<Quote[]> {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return this.mapSupabaseQuotesToLocal(data || []);
    } catch (error) {
      console.error('Error fetching quotes by customer:', error);
      return [];
    }
  }

  async addQuote(quote: Quote): Promise<string> {
    try {
      // Validate quote data before processing
      this.validateQuoteData(quote);

      // First, resolve the customer ID to ensure we have the correct Supabase UUID
      const customer = await this.getCustomer(quote.customerId);
      if (!customer) {
        throw new Error(`Customer not found with ID: ${quote.customerId}`);
      }

      // Create the Supabase quote with resolved customer ID
      const supabaseQuote = this.mapLocalQuoteToSupabase(quote);
      
      // Ensure we use the actual Supabase customer UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quote.customerId);
      
      let customerQuery;
      if (isUUID) {
        customerQuery = supabase
          .from('customers')
          .select('id')
          .eq('id', quote.customerId)
          .eq('is_deleted', false);
      } else {
        customerQuery = supabase
          .from('customers')
          .select('id')
          .or(`firebase_id.eq.${quote.customerId},customer_number.eq.${quote.customerId}`)
          .eq('is_deleted', false);
      }
      
      const { data: customerData, error: customerError } = await customerQuery.single();

      if (customerError || !customerData) {
        throw new Error(`Cannot resolve customer ID: ${quote.customerId}. Customer may not exist in Supabase.`);
      }

      // Update the customer_id to use the resolved Supabase UUID
      supabaseQuote.customer_id = customerData.id;

      console.log('📝 Creating quote in Supabase:', {
        originalCustomerId: quote.customerId,
        resolvedCustomerId: supabaseQuote.customer_id,
        customerName: supabaseQuote.customer_name,
        price: supabaseQuote.price,
        status: supabaseQuote.status,
        supabaseQuote
      });

      const { data, error } = await supabase
        .from('quotes')
        .insert(supabaseQuote)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase quote creation failed:', {
          error,
          quote: supabaseQuote,
          postgresErrorCode: error.code,
          postgresErrorMessage: error.message
        });
        throw error;
      }

      console.log('✅ Quote created successfully in Supabase:', data.id);
      return data.id;
    } catch (error) {
      console.error('❌ Error adding quote to Supabase:', error);
      throw error;
    }
  }

  async updateQuote(quoteId: string, updates: Partial<Quote>): Promise<void> {
    try {
      const supabaseUpdates = this.mapLocalQuoteToSupabase(updates as Quote, true);
      
      const { error } = await supabase
        .from('quotes')
        .update(supabaseUpdates)
        .or(`id.eq.${quoteId},firebase_id.eq.${quoteId}`);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating quote:', error);
      throw error;
    }
  }

  async deleteQuote(quoteId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ is_deleted: true })
        .or(`id.eq.${quoteId},firebase_id.eq.${quoteId}`);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting quote:', error);
      throw error;
    }
  }

  // Invoice Operations
  async getInvoices(): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return this.mapSupabaseInvoicesToLocal(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .or(`id.eq.${invoiceId},firebase_id.eq.${invoiceId}`)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      return data ? this.mapSupabaseInvoiceToLocal(data) : null;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }

  async addInvoice(invoice: Invoice): Promise<string> {
    try {
      const supabaseInvoice = this.mapLocalInvoiceToSupabase(invoice);
      
      const { data, error } = await supabase
        .from('invoices')
        .insert(supabaseInvoice)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error adding invoice:', error);
      throw error;
    }
  }

  async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<void> {
    try {
      const supabaseUpdates = this.mapLocalInvoiceToSupabase(updates as Invoice, true);
      
      const { error } = await supabase
        .from('invoices')
        .update(supabaseUpdates)
        .or(`id.eq.${invoiceId},firebase_id.eq.${invoiceId}`);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  // ShareLink Operations
  async createShareLink(customerId: string, quoteId: string, expiresIn: number = 7): Promise<ShareLink> {
    try {
      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresIn);

      const shareLink = {
        customer_id: customerId,
        quote_id: quoteId,
        token,
        expires_at: expiresAt.toISOString(),
        created_by: 'system'
      };

      const { data, error } = await supabase
        .from('share_links')
        .insert(shareLink)
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        customerId: data.customer_id,
        quoteId: data.quote_id,
        token: data.token,
        expiresAt: new Date(data.expires_at),
        createdAt: new Date(data.created_at),
        createdBy: data.created_by,
        usedAt: data.used_at ? new Date(data.used_at) : undefined,
        arbeitsscheinHTML: data.arbeitsschein_html,
        arbeitsscheinData: data.arbeitsschein_data
      };
    } catch (error) {
      console.error('Error creating share link:', error);
      throw error;
    }
  }

  async getShareLinkByToken(token: string): Promise<ShareLink | null> {
    try {
      const { data, error } = await supabase
        .from('share_links')
        .select('*')
        .eq('token', token)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        console.log('Share link expired');
        return null;
      }

      return {
        id: data.id,
        customerId: data.customer_id,
        quoteId: data.quote_id,
        token: data.token,
        expiresAt: new Date(data.expires_at),
        createdAt: new Date(data.created_at),
        createdBy: data.created_by,
        usedAt: data.used_at ? new Date(data.used_at) : undefined,
        arbeitsscheinHTML: data.arbeitsschein_html,
        arbeitsscheinData: data.arbeitsschein_data
      };
    } catch (error) {
      console.error('Error fetching share link:', error);
      return null;
    }
  }

  async updateShareLink(token: string, updates: Partial<ShareLink>): Promise<void> {
    try {
      const supabaseUpdates: any = {};
      
      if (updates.usedAt !== undefined) {
        supabaseUpdates.used_at = updates.usedAt instanceof Date ? updates.usedAt.toISOString() : updates.usedAt;
      }
      if (updates.arbeitsscheinHTML !== undefined) {
        supabaseUpdates.arbeitsschein_html = updates.arbeitsscheinHTML;
      }
      if (updates.arbeitsscheinData !== undefined) {
        supabaseUpdates.arbeitsschein_data = updates.arbeitsscheinData;
      }

      const { error } = await supabase
        .from('share_links')
        .update(supabaseUpdates)
        .eq('token', token);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating share link:', error);
      throw error;
    }
  }

  // Email History Operations
  async addEmailHistory(emailHistory: EmailHistory): Promise<string> {
    try {
      const supabaseEmail = {
        customer_id: emailHistory.customerId,
        recipient: emailHistory.recipient,
        subject: emailHistory.subject,
        type: emailHistory.type,
        status: emailHistory.status,
        sent_at: emailHistory.sentAt.toISOString(),
        body: emailHistory.body,
        attachments: emailHistory.attachments,
        error_message: emailHistory.error
      };

      const { data, error } = await supabase
        .from('email_history')
        .insert(supabaseEmail)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error adding email history:', error);
      throw error;
    }
  }

  async getEmailHistory(customerId?: string): Promise<EmailHistory[]> {
    try {
      let query = supabase
        .from('email_history')
        .select('*')
        .eq('is_deleted', false)
        .order('sent_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(email => ({
        id: email.id,
        customerId: email.customer_id,
        recipient: email.recipient,
        subject: email.subject,
        type: email.type,
        status: email.status as 'sent' | 'failed' | 'pending',
        sentAt: new Date(email.sent_at || email.created_at),
        createdAt: new Date(email.created_at),
        body: email.body,
        attachments: email.attachments,
        error: email.error_message
      }));
    } catch (error) {
      console.error('Error fetching email history:', error);
      return [];
    }
  }

  // Calendar Operations
  async getCalendarEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    try {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('is_deleted', false)
        .order('start_date', { ascending: true });

      if (startDate) {
        query = query.gte('start_date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('start_date', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(event => ({
        id: event.id,
        customerId: event.customer_id,
        title: event.title,
        start: new Date(event.start_date),
        end: new Date(event.end_date),
        type: event.type,
        description: event.description,
        location: event.location,
        attendees: event.attendees
      }));
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  async addCalendarEvent(event: CalendarEvent): Promise<string> {
    try {
      const supabaseEvent = {
        customer_id: event.customerId,
        title: event.title,
        start_date: event.start instanceof Date ? event.start.toISOString() : event.start,
        end_date: event.end instanceof Date ? event.end.toISOString() : event.end,
        type: event.type,
        description: event.description,
        location: event.location,
        attendees: event.attendees
      };

      const { data, error } = await supabase
        .from('calendar_events')
        .insert(supabaseEvent)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error adding calendar event:', error);
      throw error;
    }
  }

  // Real-time subscriptions
  subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
    const subscription = supabase
      .channel('customers-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'customers' },
        async () => {
          const customers = await this.getCustomers();
          callback(customers);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  subscribeToQuotes(callback: (quotes: Quote[]) => void): () => void {
    const subscription = supabase
      .channel('quotes-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'quotes' },
        async () => {
          const quotes = await this.getQuotes();
          callback(quotes);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  subscribeToInvoices(callback: (invoices: Invoice[]) => void): () => void {
    const subscription = supabase
      .channel('invoices-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        async () => {
          const invoices = await this.getInvoices();
          callback(invoices);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  // Utility methods
  private generateToken(): string {
    return btoa(uuidv4()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  private validateQuoteData(quote: Quote): void {
    const errors: string[] = [];

    if (!quote.customerId) {
      errors.push('customerId is required');
    }
    if (!quote.customerName) {
      errors.push('customerName is required');
    }
    if (quote.price === undefined || quote.price === null || isNaN(Number(quote.price))) {
      errors.push('price must be a valid number');
    }
    if (!quote.createdBy) {
      errors.push('createdBy is required');
    }

    // Validate status if provided
    const validStatuses = ['draft', 'sent', 'accepted', 'confirmed', 'rejected', 'invoiced'];
    if (quote.status && !validStatuses.includes(quote.status)) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    }

    if (errors.length > 0) {
      throw new Error(`Quote validation failed: ${errors.join(', ')}`);
    }
  }

  // Mapping functions
  private mapSupabaseCustomerToLocal(data: any): Customer {
    return {
      id: data.firebase_id || data.id,
      customerNumber: data.customer_number,
      name: data.name,
      email: data.email,
      phone: data.phone,
      fromAddress: data.from_address,
      toAddress: data.to_address,
      movingDate: data.moving_date,
      apartment: data.apartment,
      services: data.services || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      salesStatus: data.sales_status,
      status: data.status,
      currentPhase: data.current_phase,
      phaseUpdatedAt: data.phase_updated_at ? new Date(data.phase_updated_at) : undefined,
      phaseHistory: data.phase_history || [],
      cancelledAt: data.cancelled_at ? new Date(data.cancelled_at) : undefined,
      notes: data.notes,
      volume: data.volume,
      distance: data.distance,
      furnitureAssemblyPrice: data.furniture_assembly_price,
      packingServicePrice: data.packing_service_price,
      storageServicePrice: data.storage_service_price,
      disposalServicePrice: data.disposal_service_price,
      cleaningServicePrice: data.cleaning_service_price,
      boreServicePrice: data.bore_service_price,
      heavyItemPrice: data.heavy_item_price,
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total
    };
  }

  private mapSupabaseCustomersToLocal(data: any[]): Customer[] {
    return data.map(item => this.mapSupabaseCustomerToLocal(item));
  }

  private mapLocalCustomerToSupabase(customer: Customer, isUpdate = false): any {
    const supabaseCustomer: any = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      from_address: customer.fromAddress,
      to_address: customer.toAddress,
      moving_date: customer.movingDate,
      apartment: customer.apartment,
      services: customer.services,
      sales_status: customer.salesStatus,
      status: customer.status,
      current_phase: customer.currentPhase,
      phase_history: customer.phaseHistory,
      cancelled_at: customer.cancelledAt instanceof Date ? customer.cancelledAt.toISOString() : customer.cancelledAt,
      notes: customer.notes,
      volume: customer.volume,
      distance: customer.distance,
      furniture_assembly_price: customer.furnitureAssemblyPrice || 0,
      packing_service_price: customer.packingServicePrice || 0,
      storage_service_price: customer.storageServicePrice || 0,
      disposal_service_price: customer.disposalServicePrice || 0,
      cleaning_service_price: customer.cleaningServicePrice || 0,
      bore_service_price: customer.boreServicePrice || 0,
      heavy_item_price: customer.heavyItemPrice || 0,
      subtotal: customer.subtotal || 0,
      tax: customer.tax || 0,
      total: customer.total || 0
    };

    if (!isUpdate) {
      supabaseCustomer.customer_number = customer.customerNumber;
      supabaseCustomer.firebase_id = customer.id;
    }

    return supabaseCustomer;
  }

  private mapSupabaseQuoteToLocal(data: any): Quote {
    return {
      id: data.firebase_id || data.id,
      customerId: data.customer_id,
      customerName: data.customer_name,
      status: data.status,
      price: data.price,
      volume: data.volume,
      distance: data.distance,
      moveDate: data.move_date,
      moveFrom: data.move_from,
      moveTo: data.move_to,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      confirmationToken: data.confirmation_token,
      confirmedAt: data.confirmed_at ? new Date(data.confirmed_at) : undefined,
      confirmedBy: data.confirmed_by,
      comment: data.comment,
      createdBy: data.created_by,
      services: data.services || {}
    };
  }

  private mapSupabaseQuotesToLocal(data: any[]): Quote[] {
    return data.map(item => this.mapSupabaseQuoteToLocal(item));
  }

  private mapLocalQuoteToSupabase(quote: Quote, isUpdate = false): any {
    // Validate required fields
    if (!quote.customerName) {
      throw new Error('Quote customerName is required');
    }
    if (quote.price === undefined || quote.price === null) {
      throw new Error('Quote price is required');
    }

    // Ensure status is valid for Supabase CHECK constraint
    const validStatuses = ['draft', 'sent', 'accepted', 'confirmed', 'rejected', 'invoiced'];
    const status = quote.status || 'draft';
    if (!validStatuses.includes(status)) {
      console.warn(`Invalid quote status '${status}', using 'draft' instead`);
    }

    const supabaseQuote: any = {
      customer_name: quote.customerName,
      status: validStatuses.includes(status) ? status : 'draft',
      price: Number(quote.price),
      volume: quote.volume ? Number(quote.volume) : null,
      distance: quote.distance ? Number(quote.distance) : null,
      move_date: quote.moveDate || null,
      move_from: quote.moveFrom || null,
      move_to: quote.moveTo || null,
      confirmation_token: quote.confirmationToken || null,
      confirmed_at: quote.confirmedAt ? (quote.confirmedAt instanceof Date ? quote.confirmedAt.toISOString() : quote.confirmedAt) : null,
      confirmed_by: quote.confirmedBy || null,
      comment: quote.comment || null,
      created_by: quote.createdBy || 'system',
      services: quote.services || {}
    };

    if (!isUpdate) {
      supabaseQuote.customer_id = quote.customerId;
      supabaseQuote.firebase_id = quote.id;
    }

    // Remove undefined values to avoid Supabase issues
    Object.keys(supabaseQuote).forEach(key => {
      if (supabaseQuote[key] === undefined) {
        delete supabaseQuote[key];
      }
    });

    return supabaseQuote;
  }

  private mapSupabaseInvoiceToLocal(data: any): Invoice {
    return {
      id: data.firebase_id || data.id,
      customerId: data.customer_id,
      quoteId: data.quote_id,
      customerName: data.customer_name || '',
      invoiceNumber: data.invoice_number,
      amount: data.amount,
      totalPrice: data.total_price || data.amount || 0,
      status: data.status,
      dueDate: new Date(data.due_date),
      paidDate: data.paid_date ? new Date(data.paid_date) : undefined,
      createdAt: new Date(data.created_at),
      items: data.items || [],
      notes: data.notes
    };
  }

  private mapSupabaseInvoicesToLocal(data: any[]): Invoice[] {
    return data.map(item => this.mapSupabaseInvoiceToLocal(item));
  }

  private mapLocalInvoiceToSupabase(invoice: Invoice, isUpdate = false): any {
    const supabaseInvoice: any = {
      amount: invoice.amount,
      status: invoice.status,
      due_date: invoice.dueDate instanceof Date ? invoice.dueDate.toISOString() : invoice.dueDate,
      paid_date: invoice.paidDate instanceof Date ? invoice.paidDate.toISOString() : invoice.paidDate,
      items: invoice.items,
      notes: invoice.notes
    };

    if (!isUpdate) {
      supabaseInvoice.customer_id = invoice.customerId;
      supabaseInvoice.quote_id = invoice.quoteId;
      supabaseInvoice.invoice_number = invoice.invoiceNumber;
      supabaseInvoice.firebase_id = invoice.id;
    }

    return supabaseInvoice;
  }

  // Test connection
  async testConnection(): Promise<void> {
    console.log('🧪 Testing Supabase connection...');
    try {
      const { data, error } = await supabase.from('customers').select('count').limit(1);
      if (error) throw error;
      console.log('✅ Supabase connection successful!');
    } catch (error) {
      console.error('❌ Supabase connection test failed:', error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return this.initialized;
  }
}

// Create singleton instance
export const supabaseService = new SupabaseService();

// Re-export supabase client for direct access
export { supabase } from '../config/supabase';