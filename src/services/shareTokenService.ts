import { db } from '../config/firebase';
import { collection, doc, setDoc, getDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
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
  private readonly COLLECTION_NAME = 'shareTokens';
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

      // Token in Firestore speichern
      await setDoc(doc(db, this.COLLECTION_NAME, tokenId), {
        ...token,
        createdAt: token.createdAt.toISOString(),
        expiresAt: token.expiresAt.toISOString()
      });

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
      const tokenDoc = await getDoc(doc(db, this.COLLECTION_NAME, tokenId));
      
      if (!tokenDoc.exists()) {
        console.warn('⚠️ Token nicht gefunden:', tokenId);
        return null;
      }

      const data = tokenDoc.data();
      const token: ShareToken = {
        ...data,
        id: tokenDoc.id,
        createdAt: new Date(data.createdAt),
        expiresAt: new Date(data.expiresAt),
        lastAccessedAt: data.lastAccessedAt ? new Date(data.lastAccessedAt) : undefined
      } as ShareToken;

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
      const tokenRef = doc(db, this.COLLECTION_NAME, tokenId);
      const tokenDoc = await getDoc(tokenRef);
      
      if (tokenDoc.exists()) {
        const currentData = tokenDoc.data();
        await setDoc(tokenRef, {
          ...currentData,
          accessCount: (currentData.accessCount || 0) + 1,
          lastAccessedAt: new Date().toISOString()
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
      const tokensQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('customerId', '==', customerId)
      );
      
      const snapshot = await getDocs(tokensQuery);
      const now = new Date();
      const tokens: ShareToken[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const token: ShareToken = {
          ...data,
          id: doc.id,
          createdAt: new Date(data.createdAt),
          expiresAt: new Date(data.expiresAt),
          lastAccessedAt: data.lastAccessedAt ? new Date(data.lastAccessedAt) : undefined
        } as ShareToken;

        // Nur nicht abgelaufene Tokens zurückgeben
        if (token.expiresAt > now) {
          tokens.push(token);
        }
      });

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
      await deleteDoc(doc(db, this.COLLECTION_NAME, tokenId));
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
      const tokensQuery = query(collection(db, this.COLLECTION_NAME));
      const snapshot = await getDocs(tokensQuery);
      const now = new Date();
      let deletedCount = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const expiresAt = new Date(data.expiresAt);
        
        if (expiresAt < now) {
          await deleteDoc(doc.ref);
          deletedCount++;
        }
      }

      console.log(`🧹 ${deletedCount} abgelaufene Tokens gelöscht`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Fehler beim Bereinigen abgelaufener Tokens:', error);
      return 0;
    }
  }
}

export const shareTokenService = new ShareTokenService();