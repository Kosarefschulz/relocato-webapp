import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://kmxipuaqierjqaikuimi.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';

console.log('🔧 Initializing Supabase with:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey
});

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Export types for tables
export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          customer_number: string;
          name: string;
          email: string;
          phone: string;
          from_address: string;
          to_address: string;
          moving_date: string | null;
          apartment: number;
          services: string[];
          created_at: string;
          updated_at: string;
          sales_status: string | null;
          status: string | null;
          cancelled_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
      quotes: {
        Row: {
          id: string;
          customer_id: string;
          customer_name: string;
          status: 'draft' | 'sent' | 'accepted' | 'confirmed' | 'rejected' | 'invoiced';
          price: number;
          volume: number;
          distance: number;
          move_date: string | null;
          move_from: string;
          move_to: string;
          created_at: string;
          updated_at: string;
          confirmation_token: string | null;
          confirmed_at: string | null;
          confirmed_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['quotes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>;
      };
      invoices: {
        Row: {
          id: string;
          customer_id: string;
          quote_id: string;
          invoice_number: string;
          amount: number;
          status: 'pending' | 'paid' | 'overdue' | 'cancelled';
          due_date: string;
          paid_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };
      share_links: {
        Row: {
          id: string;
          customer_id: string;
          quote_id: string;
          token: string;
          expires_at: string;
          created_at: string;
          created_by: string | null;
          used_at: string | null;
          arbeitsschein_html: string | null;
          arbeitsschein_data: string | null;
        };
        Insert: Omit<Database['public']['Tables']['share_links']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['share_links']['Insert']>;
      };
      share_tokens: {
        Row: {
          id: string;
          customer_id: string;
          customer_name: string;
          created_at: string;
          expires_at: string;
          created_by: string;
          permissions: {
            viewCustomer: boolean;
            viewQuote: boolean;
            viewInvoice: boolean;
            viewPhotos: boolean;
          };
          access_count: number;
          last_accessed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['share_tokens']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['share_tokens']['Insert']>;
      };
      email_history: {
        Row: {
          id: string;
          customer_id: string;
          recipient: string;
          subject: string;
          type: string;
          status: 'sent' | 'failed' | 'pending';
          sent_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['email_history']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['email_history']['Insert']>;
      };
      calendar_events: {
        Row: {
          id: string;
          customer_id: string;
          title: string;
          start_date: string;
          end_date: string;
          type: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['calendar_events']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['calendar_events']['Insert']>;
      };
    };
  };
};

export default supabase;