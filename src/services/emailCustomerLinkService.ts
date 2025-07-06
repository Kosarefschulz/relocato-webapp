import { supabase } from '../config/supabase';

export interface EmailCustomerLink {
  id: string;
  email_id: string;
  customer_id: string;
  linked_at: string;
  linked_by: string;
}

export const emailCustomerLinkService = {
  // Link an email to a customer
  async linkEmailToCustomer(emailId: string, customerId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('email_customer_links')
      .insert({
        email_id: emailId,
        customer_id: customerId,
        linked_by: user?.id
      });

    if (error) {
      console.error('Error linking email to customer:', error);
      throw error;
    }
  },

  // Unlink an email from a customer
  async unlinkEmailFromCustomer(emailId: string, customerId: string): Promise<void> {
    const { error } = await supabase
      .from('email_customer_links')
      .delete()
      .match({ email_id: emailId, customer_id: customerId });

    if (error) {
      console.error('Error unlinking email from customer:', error);
      throw error;
    }
  },

  // Get customer linked to an email
  async getLinkedCustomer(emailId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('email_customer_links')
      .select(`
        customer_id,
        customers (
          id,
          firstName,
          lastName,
          email,
          phoneNumber,
          status,
          source
        )
      `)
      .eq('email_id', emailId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No customer linked
        return null;
      }
      console.error('Error getting linked customer:', error);
      throw error;
    }

    return data?.customers || null;
  },

  // Get all emails linked to a customer
  async getCustomerEmails(customerId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('email_customer_links')
      .select('email_id')
      .eq('customer_id', customerId);

    if (error) {
      console.error('Error getting customer emails:', error);
      throw error;
    }

    return data?.map(link => link.email_id) || [];
  },

  // Check if email is linked to any customer
  async isEmailLinked(emailId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('email_customer_links')
      .select('id')
      .eq('email_id', emailId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking email link:', error);
      throw error;
    }

    return !!data;
  }
};