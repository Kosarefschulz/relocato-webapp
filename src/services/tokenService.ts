import { v4 as uuidv4 } from 'uuid';
import { Quote } from '../types';

export interface QuoteToken {
  token: string;
  quoteId: string;
  customerId: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

class TokenService {
  // Generiere einen eindeutigen Token für ein Angebot
  generateQuoteToken(quote: Quote): string {
    // Kombination aus UUID und Quote-ID für extra Sicherheit
    const token = `${quote.id}_${uuidv4()}`.replace(/[^a-zA-Z0-9]/g, '');
    return token;
  }

  // Erstelle Token-Metadaten
  createTokenData(quote: Quote, token: string): QuoteToken {
    const expirationDays = 30; // Token läuft nach 30 Tagen ab
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    return {
      token,
      quoteId: quote.id,
      customerId: quote.customerId,
      expiresAt,
      used: false,
      createdAt: new Date()
    };
  }

  // Generiere Bestätigungs-URL
  generateConfirmationUrl(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/quote-confirmation/${token}`;
  }

  // Validiere Token
  isTokenValid(tokenData: QuoteToken): boolean {
    if (tokenData.used) return false;
    if (new Date() > new Date(tokenData.expiresAt)) return false;
    return true;
  }

  // Formatiere Ablaufdatum für Anzeige
  formatExpirationDate(expiresAt: Date): string {
    return new Date(expiresAt).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

export const tokenService = new TokenService();