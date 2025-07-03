import { databaseService } from '../config/database.config';
import { ShareLink } from '../types';

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

class ShareTokenAbstractionService {
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
      viewQuote: false,
      viewInvoice: false,
      viewPhotos: true
    }
  ): Promise<ShareToken> {
    try {
      console.log('🔥 Erstelle ShareToken mit databaseService...', {
        customerId,
        customerName,
        createdBy
      });

      // For customer sharing, we need to find a quote for this customer
      // or create a placeholder quote ID
      let quoteId = 'customer-share'; // Default for customer-only sharing
      
      try {
        const quotes = await databaseService.getQuotesByCustomerId(customerId);
        if (quotes.length > 0) {
          // Use the most recent quote
          const sortedQuotes = quotes.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          quoteId = sortedQuotes[0].id;
        }
      } catch (error) {
        console.warn('Could not find quotes for customer, using default quoteId');
      }

      const expiresIn = this.TOKEN_VALIDITY_DAYS * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      const shareLink = await databaseService.createShareLink(
        customerId,
        quoteId,
        expiresIn
      );

      // Convert ShareLink to ShareToken format for compatibility
      const token: ShareToken = {
        id: shareLink.token, // Use token as ID for compatibility
        customerId: shareLink.customerId,
        customerName: customerName,
        createdAt: new Date(shareLink.createdAt),
        expiresAt: new Date(shareLink.expiresAt),
        createdBy: createdBy,
        permissions: permissions,
        accessCount: shareLink.usageCount || 0,
        lastAccessedAt: shareLink.lastUsed ? new Date(shareLink.lastUsed) : undefined
      };

      console.log('✅ ShareToken erfolgreich erstellt:', {
        tokenId: token.id,
        customerId: token.customerId,
        expiresAt: token.expiresAt
      });

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
      const shareLink = await databaseService.getShareLinkByToken(tokenId);
      
      if (!shareLink) {
        console.warn('⚠️ Token nicht gefunden:', tokenId);
        return null;
      }

      // Check if token is expired
      const expiresAt = new Date(shareLink.expiresAt);
      if (expiresAt < new Date()) {
        console.warn('⚠️ Token abgelaufen:', tokenId);
        return null;
      }

      // Convert ShareLink to ShareToken format
      const token: ShareToken = {
        id: shareLink.token,
        customerId: shareLink.customerId,
        customerName: shareLink.customerId, // Will be updated by caller with actual name
        createdAt: new Date(shareLink.createdAt),
        expiresAt: new Date(shareLink.expiresAt),
        createdBy: shareLink.createdBy || 'unknown',
        permissions: {
          viewCustomer: true,
          viewQuote: true,
          viewInvoice: false,
          viewPhotos: true
        },
        accessCount: shareLink.usageCount || 0,
        lastAccessedAt: shareLink.lastUsed ? new Date(shareLink.lastUsed) : undefined
      };

      // Update access count
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
      const shareLink = await databaseService.getShareLinkByToken(tokenId);
      if (shareLink) {
        await databaseService.updateShareLink(tokenId, {
          usageCount: (shareLink.usageCount || 0) + 1,
          lastUsed: new Date().toISOString()
        });
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
      // Since databaseService doesn't have a method to get share links by customer,
      // we would need to implement this differently or extend the database abstraction
      console.warn('getCustomerTokens: Not fully implemented in database abstraction yet');
      return [];
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
      // Since databaseService doesn't have a delete ShareLink method,
      // we could implement this by setting an expired date
      await databaseService.updateShareLink(tokenId, {
        expiresAt: new Date().toISOString() // Set to expired
      });
      console.log('✅ Token als abgelaufen markiert:', tokenId);
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
   * Bereinigt abgelaufene Tokens (würde regelmäßig ausgeführt werden)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      console.log('🧹 Cleanup would be handled by database service or scheduled task');
      return 0;
    } catch (error) {
      console.error('❌ Fehler beim Bereinigen abgelaufener Tokens:', error);
      return 0;
    }
  }
}

export const shareTokenAbstraction = new ShareTokenAbstractionService();