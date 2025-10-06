import { supabase } from './supabaseService';

// ========== INTERFACES ==========

export interface Offer {
  id: string;
  customer_id: string;

  // Angebotskopfdaten
  offer_number: string;
  customer_number?: string;
  offer_date: string;
  valid_until?: string;

  // Status
  status: 'offen' | 'verhandlung' | 'angenommen' | 'abgelehnt' | 'abgelaufen' | 'storniert';

  // Preise
  net_amount?: number;
  vat_rate?: number;
  vat_amount?: number;
  gross_amount: number;
  price_type?: string;

  // Zahlung
  payment_timing?: string;
  payment_methods?: string[];

  // Service
  service_details?: {
    type?: string;
    object_size?: string;
    rooms?: string[];
    exceptions?: string[];
    condition?: string;
    details?: string;
  };

  // Termine
  appointments?: Array<{
    date?: string;
    time?: string;
  }>;

  // Meta
  document_type?: string;
  pdf_file_name?: string;
  raw_text?: string;

  // Follow-up
  follow_up_date?: string;
  follow_up_done?: boolean;

  // Timestamps
  created_at?: string;
  updated_at?: string;
  accepted_at?: string;
  rejected_at?: string;
}

export interface OfferLineItem {
  id?: string;
  offer_id: string;
  position: number;
  designation: string;
  object_size?: string;
  rooms?: string[];
  exceptions?: string[];
  condition?: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  total_price: number;
}

export interface FollowUp {
  id?: string;
  offer_id?: string;
  customer_id: string;
  due_date: string;
  priority: 'niedrig' | 'normal' | 'hoch' | 'dringend';
  type: string;
  status: 'offen' | 'erledigt' | 'verschoben' | 'abgebrochen';
  notes?: string;
  completed_at?: string;
}

export interface OfferHistory {
  id?: string;
  offer_id: string;
  action: string;
  old_value?: string;
  new_value?: string;
  comment?: string;
  user_id?: string;
  created_at?: string;
}

// ========== SERVICE CLASS ==========

class OfferService {
  /**
   * Erstellt ein neues Angebot aus geparsten PDF-Daten
   */
  async createOfferFromPDF(data: any, customerId: string, pdfFileName?: string): Promise<Offer> {
    try {
      console.log('📄 Creating offer from parsed PDF data');

      const offer: Partial<Offer> = {
        customer_id: customerId,
        offer_number: data.offerNumber || `AG${Date.now()}`,
        customer_number: data.customerNumber,
        offer_date: data.offerDate || new Date().toISOString().split('T')[0],
        valid_until: data.validUntil,
        status: 'offen',

        // Preise
        net_amount: data.pricing?.netAmount,
        vat_rate: data.pricing?.vatRate,
        vat_amount: data.pricing?.vatAmount,
        gross_amount: data.pricing?.grossAmount || 0,
        price_type: data.pricing?.priceType,

        // Zahlung
        payment_timing: data.payment?.timing,
        payment_methods: data.payment?.methods,

        // Service
        service_details: data.service,

        // Termine
        appointments: data.appointments,

        // Meta
        document_type: data.documentType || 'Angebot',
        pdf_file_name: pdfFileName,
        raw_text: data.rawText,
      };

      const { data: createdOffer, error } = await supabase
        .from('offers')
        .insert([offer])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating offer:', error);
        throw error;
      }

      console.log('✅ Offer created:', createdOffer.offer_number);

      // Erstelle automatisch Line Items falls Service-Details vorhanden
      if (data.service?.type) {
        await this.createLineItem({
          offer_id: createdOffer.id,
          position: 1,
          designation: data.service.type,
          object_size: data.service.objectSize,
          rooms: data.service.rooms,
          exceptions: data.service.exceptions,
          condition: data.service.condition,
          quantity: 1,
          unit: 'Pauschal',
          total_price: data.pricing?.grossAmount || 0,
        });
      }

      return createdOffer as Offer;
    } catch (error: any) {
      console.error('❌ Error in createOfferFromPDF:', error);
      throw error;
    }
  }

  /**
   * Hole alle Angebote eines Kunden
   */
  async getOffersByCustomer(customerId: string): Promise<Offer[]> {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('customer_id', customerId)
      .order('offer_date', { ascending: false });

    if (error) {
      console.error('❌ Error fetching offers:', error);
      throw error;
    }

    return (data as Offer[]) || [];
  }

  /**
   * Hole ein einzelnes Angebot
   */
  async getOffer(offerId: string): Promise<Offer | null> {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (error) {
      console.error('❌ Error fetching offer:', error);
      return null;
    }

    return data as Offer;
  }

  /**
   * Aktualisiere Angebots-Status
   */
  async updateOfferStatus(
    offerId: string,
    status: Offer['status'],
    comment?: string
  ): Promise<void> {
    const updates: any = { status };

    if (status === 'angenommen') {
      updates.accepted_at = new Date().toISOString();
    } else if (status === 'abgelehnt') {
      updates.rejected_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('offers')
      .update(updates)
      .eq('id', offerId);

    if (error) {
      console.error('❌ Error updating offer status:', error);
      throw error;
    }

    // Logge Status-Änderung (zusätzlich zum Trigger)
    if (comment) {
      await this.addHistory({
        offer_id: offerId,
        action: 'Status geändert mit Kommentar',
        new_value: status,
        comment,
      });
    }

    console.log(`✅ Offer ${offerId} status updated to ${status}`);
  }

  /**
   * Erstelle Leistungsposition
   */
  async createLineItem(lineItem: OfferLineItem): Promise<OfferLineItem> {
    const { data, error } = await supabase
      .from('offer_line_items')
      .insert([lineItem])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating line item:', error);
      throw error;
    }

    return data as OfferLineItem;
  }

  /**
   * Hole alle Leistungspositionen eines Angebots
   */
  async getLineItems(offerId: string): Promise<OfferLineItem[]> {
    const { data, error } = await supabase
      .from('offer_line_items')
      .select('*')
      .eq('offer_id', offerId)
      .order('position', { ascending: true });

    if (error) {
      console.error('❌ Error fetching line items:', error);
      throw error;
    }

    return (data as OfferLineItem[]) || [];
  }

  /**
   * Erstelle Wiedervorlage
   */
  async createFollowUp(followUp: FollowUp): Promise<FollowUp> {
    const { data, error } = await supabase
      .from('follow_ups')
      .insert([followUp])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating follow-up:', error);
      throw error;
    }

    return data as FollowUp;
  }

  /**
   * Hole offene Wiedervorlagen
   */
  async getPendingFollowUps(customerId?: string): Promise<FollowUp[]> {
    let query = supabase
      .from('follow_ups')
      .select('*')
      .eq('status', 'offen')
      .order('due_date', { ascending: true });

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching follow-ups:', error);
      throw error;
    }

    return (data as FollowUp[]) || [];
  }

  /**
   * Markiere Wiedervorlage als erledigt
   */
  async completeFollowUp(followUpId: string): Promise<void> {
    const { error } = await supabase
      .from('follow_ups')
      .update({
        status: 'erledigt',
        completed_at: new Date().toISOString(),
      })
      .eq('id', followUpId);

    if (error) {
      console.error('❌ Error completing follow-up:', error);
      throw error;
    }
  }

  /**
   * Füge Eintrag zur Historie hinzu
   */
  async addHistory(history: Omit<OfferHistory, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase.from('offer_history').insert([history]);

    if (error) {
      console.error('❌ Error adding history:', error);
      throw error;
    }
  }

  /**
   * Hole Historie eines Angebots
   */
  async getHistory(offerId: string): Promise<OfferHistory[]> {
    const { data, error } = await supabase
      .from('offer_history')
      .select('*')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching history:', error);
      throw error;
    }

    return (data as OfferHistory[]) || [];
  }

  /**
   * Hole aktive Angebote (offen + in Verhandlung)
   */
  async getActiveOffers(): Promise<any[]> {
    const { data, error } = await supabase
      .from('v_active_offers')
      .select('*')
      .order('offer_date', { ascending: false });

    if (error) {
      console.error('❌ Error fetching active offers:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Hole bald ablaufende Angebote
   */
  async getExpiringOffers(): Promise<any[]> {
    const { data, error } = await supabase
      .from('v_expiring_offers')
      .select('*');

    if (error) {
      console.error('❌ Error fetching expiring offers:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Automatische Abgelaufene-Status-Aktualisierung
   */
  async updateExpiredOffers(): Promise<number> {
    const { data, error } = await supabase
      .from('offers')
      .update({ status: 'abgelaufen' })
      .eq('status', 'offen')
      .lt('valid_until', new Date().toISOString().split('T')[0])
      .select();

    if (error) {
      console.error('❌ Error updating expired offers:', error);
      throw error;
    }

    const count = data?.length || 0;
    console.log(`✅ Updated ${count} expired offers`);
    return count;
  }

  /**
   * Dashboard-Statistiken
   */
  async getOfferStats(): Promise<{
    total: number;
    open: number;
    accepted: number;
    rejected: number;
    expired: number;
    totalValue: number;
    averageValue: number;
  }> {
    const { data, error } = await supabase.from('offers').select('status, gross_amount');

    if (error) {
      console.error('❌ Error fetching offer stats:', error);
      throw error;
    }

    const stats = {
      total: data?.length || 0,
      open: data?.filter((o) => o.status === 'offen').length || 0,
      accepted: data?.filter((o) => o.status === 'angenommen').length || 0,
      rejected: data?.filter((o) => o.status === 'abgelehnt').length || 0,
      expired: data?.filter((o) => o.status === 'abgelaufen').length || 0,
      totalValue: data?.reduce((sum, o) => sum + (o.gross_amount || 0), 0) || 0,
      averageValue: 0,
    };

    stats.averageValue = stats.total > 0 ? stats.totalValue / stats.total : 0;

    return stats;
  }
}

export const offerService = new OfferService();
