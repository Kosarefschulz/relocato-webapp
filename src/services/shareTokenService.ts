import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface ShareToken {
  id: string;
  customerId: string;
  customerName: string;
  createdAt: Date;
  expiresAt: Date;
  createdBy: string;
  permissions: {
    viewCustomer: boolean;
    viewQuote: boolean;
    viewInvoice: boolean;
    viewPhotos: boolean;
  };
  accessCount: number;
  lastAccessedAt?: Date;
}

class ShareTokenService {
  private readonly TABLE_NAME = 'share_tokens';
  private readonly TOKEN_VALIDITY_DAYS = 7;

  /**
   * Erstellt einen neuen Share-Token für einen Kunden
   */
  async createShareToken(
    customerId: string,
    customerName: string,
    createdBy: string,
    permissions = {
      viewCustomer: true,
      viewQuote: false, // Angebot standardmäßig ausgeschlossen
      viewInvoice: false,
      viewPhotos: true
    }
  ): Promise<ShareToken> {
    try {
      const tokenId = uuidv4();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.TOKEN_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

      const token: ShareToken = {
        id: tokenId,
        customerId,
        customerName,
        createdAt: now,
        expiresAt,
        createdBy,
        permissions,
        accessCount: 0
      };

      // Token in Supabase speichern
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .insert({
          id: token.id,
          customer_id: token.customerId,
          customer_name: token.customerName,
          created_at: token.createdAt.toISOString(),
          expires_at: token.expiresAt.toISOString(),
          created_by: token.createdBy,
          permissions: token.permissions,
          access_count: token.accessCount
        });

      if (error) throw error;

      console.log('✅ Share-Token erstellt:', tokenId);
      return token;
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Share-Tokens:', error);
      throw error;
    }
  }

  /**
   * Validiert einen Token und gibt die Daten zurück
   */
  async validateToken(tokenId: string): Promise<ShareToken | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', tokenId)
        .single();
      
      if (error || !data) {
        console.warn('⚠️ Token nicht gefunden:', tokenId);
        return null;
      }

      const token: ShareToken = {
        id: data.id,
        customerId: data.customer_id,
        customerName: data.customer_name,
        createdAt: new Date(data.created_at),
        expiresAt: new Date(data.expires_at),
        createdBy: data.created_by,
        permissions: data.permissions,
        accessCount: data.access_count,
        lastAccessedAt: data.last_accessed_at ? new Date(data.last_accessed_at) : undefined
      };

      // Prüfe ob Token abgelaufen ist
      if (token.expiresAt < new Date()) {
        console.warn('⚠️ Token abgelaufen:', tokenId);
        return null;
      }

      // Aktualisiere Zugriffszähler
      await this.updateTokenAccess(tokenId);

      return token;
    } catch (error) {
      console.error('❌ Fehler beim Validieren des Tokens:', error);
      return null;
    }
  }

  /**
   * Aktualisiert den Zugriffszähler eines Tokens
   */
  private async updateTokenAccess(tokenId: string): Promise<void> {
    try {
      const { data, error: fetchError } = await supabase
        .from(this.TABLE_NAME)
        .select('access_count')
        .eq('id', tokenId)
        .single();
      
      if (!fetchError && data) {
        const { error: updateError } = await supabase
          .from(this.TABLE_NAME)
          .update({
            access_count: (data.access_count || 0) + 1,
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', tokenId);
        
        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren des Token-Zugriffs:', error);
    }
  }

  /**
   * Holt alle aktiven Tokens für einen Kunden
   */
  async getCustomerTokens(customerId: string): Promise<ShareToken[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('customer_id', customerId)
        .gt('expires_at', new Date().toISOString());
      
      if (error) throw error;
      
      const tokens: ShareToken[] = (data || []).map(item => ({
        id: item.id,
        customerId: item.customer_id,
        customerName: item.customer_name,
        createdAt: new Date(item.created_at),
        expiresAt: new Date(item.expires_at),
        createdBy: item.created_by,
        permissions: item.permissions,
        accessCount: item.access_count,
        lastAccessedAt: item.last_accessed_at ? new Date(item.last_accessed_at) : undefined
      }));

      return tokens;
    } catch (error) {
      console.error('❌ Fehler beim Abrufen der Kunden-Tokens:', error);
      return [];
    }
  }

  /**
   * Löscht einen Token
   */
  async deleteToken(tokenId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', tokenId);
      
      if (error) throw error;
      
      console.log('✅ Token gelöscht:', tokenId);
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Tokens:', error);
      return false;
    }
  }

  /**
   * Generiert eine Share-URL für einen Token
   */
  generateShareUrl(tokenId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/customer/${tokenId}`;
  }

  /**
   * Bereinigt abgelaufene Tokens (sollte regelmäßig ausgeführt werden)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      // Zuerst alle abgelaufenen Tokens abrufen
      const { data: expiredTokens, error: fetchError } = await supabase
        .from(this.TABLE_NAME)
        .select('id')
        .lt('expires_at', new Date().toISOString());
      
      if (fetchError) throw fetchError;
      
      if (!expiredTokens || expiredTokens.length === 0) {
        console.log('🧹 Keine abgelaufenen Tokens gefunden');
        return 0;
      }
      
      // Dann alle abgelaufenen Tokens löschen
      const { error: deleteError } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .lt('expires_at', new Date().toISOString());
      
      if (deleteError) throw deleteError;
      
      const deletedCount = expiredTokens.length;
      console.log(`🧹 ${deletedCount} abgelaufene Tokens gelöscht`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Fehler beim Bereinigen abgelaufener Tokens:', error);
      return 0;
    }
  }
}

export const shareTokenService = new ShareTokenService();