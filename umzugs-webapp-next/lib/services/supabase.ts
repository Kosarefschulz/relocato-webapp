import { createClient } from '@supabase/supabase-js';
import { 
  Customer, 
  Quote, 
  Invoice, 
  EmailHistory, 
  ShareLink,
  CalendarEvent 
} from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('🚀 Initializing Supabase Service...');
    
    try {
      // Test basic connection first
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔗 Supabase auth connection successful');
      
      // Try to access customers table
      const { data, error } = await supabase.from('customers').select('count').limit(1);
      if (error) {
        console.warn('⚠️ Customers table access failed, but connection works:', error.message);
        // Don't throw error, just log warning
      } else {
        console.log('✅ Customers table accessible');
      }
      
      console.log('✅ Supabase Service initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('❌ Supabase initialization failed:', error);
      // Don't throw error, allow app to continue
      this.initialized = true;
    }
  }

  // Customer Operations
  async getCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ Supabase customers table not accessible:', error.message);
        
        // Keine Mock-Daten mehr - nur echte Lexware-Kunden verwenden
        return [];
      }
      
      return this.mapSupabaseCustomersToLocal(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      
      // Keine Mock-Daten mehr - nur echte Daten verwenden
      return [];
    }
  }

  // Keine Mock-Daten mehr - nur echte Lexware-Kunden verwenden

  async getCustomer(customerId: string): Promise<Customer | null> {
    try {
      console.log('🔍 Searching for customer with ID:', customerId);
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId);
      
      let query;
      if (isUUID) {
        query = supabase
          .from('customers')
          .select('*')
          .eq('id', customerId)
          .eq('is_deleted', false);
      } else {
        query = supabase
          .from('customers')
          .select('*')
          .eq('customer_number', customerId)
          .eq('is_deleted', false);
      }
      
      const { data, error } = await query.single();

      if (error) {
        console.error('❌ Customer query error:', error);
        return null;
      }
      
      console.log('✅ Customer found:', data?.name || data?.id);
      return data ? this.mapSupabaseCustomerToLocal(data) : null;
    } catch (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
  }

  async createCustomer(customer: Omit<Customer, 'id'>): Promise<string> {
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
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<void> {
    try {
      const supabaseUpdates = this.mapLocalCustomerToSupabase(updates as Customer);
      
      const { error } = await supabase
        .from('customers')
        .update(supabaseUpdates)
        .eq('id', customerId);

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
        .eq('id', customerId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  // Quote Operations
  async getQuotes(): Promise<Quote[]> {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          customers (
            name,
            customer_number
          )
        `)
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
        .select(`
          *,
          customers (
            name,
            customer_number
          )
        `)
        .eq('id', quoteId)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      return data ? this.mapSupabaseQuoteToLocal(data) : null;
    } catch (error) {
      console.error('Error fetching quote:', error);
      return null;
    }
  }

  async createQuote(quote: Omit<Quote, 'id'>): Promise<string> {
    try {
      const supabaseQuote = this.mapLocalQuoteToSupabase(quote as Quote);
      
      const { data, error } = await supabase
        .from('quotes')
        .insert(supabaseQuote)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  }

  async updateQuote(quoteId: string, updates: Partial<Quote>): Promise<void> {
    try {
      const supabaseUpdates = this.mapLocalQuoteToSupabase(updates as Quote);
      
      const { error } = await supabase
        .from('quotes')
        .update(supabaseUpdates)
        .eq('id', quoteId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating quote:', error);
      throw error;
    }
  }

  // Mapping functions
  private mapSupabaseCustomersToLocal(customers: any[]): Customer[] {
    return customers.map(customer => this.mapSupabaseCustomerToLocal(customer));
  }

  private mapSupabaseCustomerToLocal(customer: any): Customer {
    return {
      id: customer.id,
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      movingDate: customer.moving_date || '',
      fromAddress: customer.from_address || '',
      toAddress: customer.to_address || '',
      apartment: customer.apartment || {
        rooms: 0,
        area: 0,
        floor: 0,
        hasElevator: false
      },
      services: customer.services || [],
      notes: customer.notes,
      createdAt: customer.created_at ? new Date(customer.created_at) : undefined,
      updatedAt: customer.updated_at ? new Date(customer.updated_at) : undefined,
      viewingScheduled: customer.viewing_scheduled,
      viewingDate: customer.viewing_date,
      contacted: customer.contacted,
      tags: customer.tags,
      extendedNotes: customer.extended_notes,
      priority: customer.priority,
      source: customer.source,
      customerNumber: customer.customer_number,
      company: customer.company,
      status: customer.status,
      address: customer.address,
      city: customer.city,
      zip: customer.zip,
      cancelledAt: customer.cancelled_at,
      volume: customer.volume,
      distance: customer.distance,
      salesStatus: customer.sales_status,
      salutation: customer.salutation,
      cancelledReason: customer.cancelled_reason,
      salesNotes: customer.sales_notes,
    };
  }

  private mapLocalCustomerToSupabase(customer: Customer): any {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      moving_date: customer.movingDate,
      from_address: customer.fromAddress,
      to_address: customer.toAddress,
      apartment: customer.apartment,
      services: customer.services,
      notes: customer.notes,
      viewing_scheduled: customer.viewingScheduled,
      viewing_date: customer.viewingDate,
      contacted: customer.contacted,
      tags: customer.tags,
      extended_notes: customer.extendedNotes,
      priority: customer.priority,
      source: customer.source,
      customer_number: customer.customerNumber,
      company: customer.company,
      status: customer.status,
      address: customer.address,
      city: customer.city,
      zip: customer.zip,
      cancelled_at: customer.cancelledAt,
      volume: customer.volume,
      distance: customer.distance,
      sales_status: customer.salesStatus,
      salutation: customer.salutation,
      cancelled_reason: customer.cancelledReason,
      sales_notes: customer.salesNotes,
      updated_at: new Date().toISOString(),
    };
  }

  private mapSupabaseQuotesToLocal(quotes: any[]): Quote[] {
    return quotes.map(quote => this.mapSupabaseQuoteToLocal(quote));
  }

  private mapSupabaseQuoteToLocal(quote: any): Quote {
    return {
      id: quote.id,
      customerId: quote.customer_id,
      customerName: quote.customers?.name || quote.customer_name || '',
      customerNumber: quote.customers?.customer_number,
      price: quote.price || 0,
      comment: quote.comment,
      createdAt: new Date(quote.created_at),
      updatedAt: quote.updated_at ? new Date(quote.updated_at) : undefined,
      createdBy: quote.created_by || '',
      status: quote.status || 'draft',
      volume: quote.volume,
      company: quote.company,
      distance: quote.distance,
      moveDate: quote.move_date,
      movingDate: quote.moving_date,
      moveFrom: quote.move_from,
      moveTo: quote.move_to,
      fromAddress: quote.from_address,
      toAddress: quote.to_address,
      notes: quote.notes,
      apartment: quote.apartment,
      services: quote.services,
      packingRequested: quote.packing_requested,
      additionalServices: quote.additional_services,
      boxCount: quote.box_count,
      parkingZonePrice: quote.parking_zone_price,
      storagePrice: quote.storage_price,
      furnitureAssemblyPrice: quote.furniture_assembly_price,
      furnitureDisassemblyPrice: quote.furniture_disassembly_price,
      cleaningService: quote.cleaning_service,
      cleaningHours: quote.cleaning_hours,
      clearanceService: quote.clearance_service,
      clearanceVolume: quote.clearance_volume,
      packingMaterials: quote.packing_materials,
      sentAt: quote.sent_at,
      acceptedAt: quote.accepted_at,
      rejectedAt: quote.rejected_at,
      version: quote.version,
      templateId: quote.template_id,
      templateName: quote.template_name,
    };
  }

  private mapLocalQuoteToSupabase(quote: Quote): any {
    return {
      id: quote.id,
      customer_id: quote.customerId,
      customer_name: quote.customerName,
      price: quote.price,
      comment: quote.comment,
      created_by: quote.createdBy,
      status: quote.status,
      volume: quote.volume,
      company: quote.company,
      distance: quote.distance,
      move_date: quote.moveDate,
      moving_date: quote.movingDate,
      move_from: quote.moveFrom,
      move_to: quote.moveTo,
      from_address: quote.fromAddress,
      to_address: quote.toAddress,
      notes: quote.notes,
      apartment: quote.apartment,
      services: quote.services,
      packing_requested: quote.packingRequested,
      additional_services: quote.additionalServices,
      box_count: quote.boxCount,
      parking_zone_price: quote.parkingZonePrice,
      storage_price: quote.storagePrice,
      furniture_assembly_price: quote.furnitureAssemblyPrice,
      furniture_disassembly_price: quote.furnitureDisassemblyPrice,
      cleaning_service: quote.cleaningService,
      cleaning_hours: quote.cleaningHours,
      clearance_service: quote.clearanceService,
      clearance_volume: quote.clearanceVolume,
      packing_materials: quote.packingMaterials,
      sent_at: quote.sentAt,
      accepted_at: quote.acceptedAt,
      rejected_at: quote.rejectedAt,
      version: quote.version,
      template_id: quote.templateId,
      template_name: quote.templateName,
      updated_at: new Date().toISOString(),
    };
  }
}

export const supabaseService = new SupabaseService();