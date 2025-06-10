import { Customer } from '../types';

// Google Drive Service für Foto-Verwaltung
// WICHTIG: Benötigt Google Cloud Project Setup

interface DriveFolder {
  id: string;
  name: string;
  webViewLink: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdTime: string;
  webViewLink: string;
  webContentLink: string;
  thumbnailLink?: string;
}

interface UploadToken {
  token: string;
  customerId: string;
  customerName: string;
  validUntil: Date;
  maxFiles: number;
  usedFiles: number;
}

class GoogleDriveService {
  private apiKey: string = '';
  private folderId: string = ''; // Haupt-Ordner ID für alle Kunden
  
  // Temporäre Token-Speicherung (später in DB)
  private uploadTokens: Map<string, UploadToken> = new Map();

  constructor() {
    // API Keys werden später aus Umgebungsvariablen geladen
    this.apiKey = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY || '';
    this.folderId = process.env.REACT_APP_GOOGLE_DRIVE_FOLDER_ID || '';
  }

  // Token für Upload generieren
  async generateUploadToken(customer: Customer): Promise<UploadToken> {
    const token: UploadToken = {
      token: this.generateSecureToken(),
      customerId: customer.id,
      customerName: customer.name,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 Stunden
      maxFiles: 50,
      usedFiles: 0
    };
    
    this.uploadTokens.set(token.token, token);
    
    console.log('📸 Upload-Token erstellt:', {
      kunde: customer.name,
      gültigBis: token.validUntil.toLocaleString('de-DE')
    });
    
    return token;
  }

  // QR-Code Daten generieren
  generateQRCodeData(token: UploadToken): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/photo-upload/${token.token}`;
  }

  // Token validieren
  validateToken(tokenString: string): UploadToken | null {
    const token = this.uploadTokens.get(tokenString);
    
    if (!token) {
      console.error('❌ Token nicht gefunden');
      return null;
    }
    
    if (new Date() > token.validUntil) {
      console.error('❌ Token abgelaufen');
      this.uploadTokens.delete(tokenString);
      return null;
    }
    
    if (token.usedFiles >= token.maxFiles) {
      console.error('❌ Maximale Anzahl Uploads erreicht');
      return null;
    }
    
    return token;
  }

  // Ordnerstruktur für Kunden erstellen
  async createCustomerFolder(customer: Customer): Promise<DriveFolder | null> {
    try {
      console.log('📁 Erstelle Kundenordner für:', customer.name);
      
      // Simulation - wird durch echte API ersetzt
      const folder: DriveFolder = {
        id: `folder_${customer.id}`,
        name: customer.name,
        webViewLink: `https://drive.google.com/drive/folders/fake_${customer.id}`
      };
      
      return folder;
    } catch (error) {
      console.error('Fehler beim Erstellen des Ordners:', error);
      return null;
    }
  }

  // Foto hochladen
  async uploadPhoto(
    file: File,
    token: string,
    category: string,
    description?: string
  ): Promise<DriveFile | null> {
    try {
      const validToken = this.validateToken(token);
      if (!validToken) {
        throw new Error('Ungültiger Upload-Token');
      }
      
      console.log('📤 Lade Foto hoch:', {
        datei: file.name,
        größe: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        kategorie: category,
        kunde: validToken.customerName
      });
      
      // Token-Nutzung aktualisieren
      validToken.usedFiles += 1;
      
      // Simulation - wird durch echte API ersetzt
      const uploadedFile: DriveFile = {
        id: `file_${Date.now()}`,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        createdTime: new Date().toISOString(),
        webViewLink: `https://drive.google.com/file/d/fake_${Date.now()}/view`,
        webContentLink: `https://drive.google.com/uc?id=fake_${Date.now()}`,
        thumbnailLink: URL.createObjectURL(file) // Temporär für Demo
      };
      
      return uploadedFile;
    } catch (error) {
      console.error('Fehler beim Upload:', error);
      return null;
    }
  }

  // Fotos für Kunden abrufen
  async getCustomerPhotos(customerId: string): Promise<DriveFile[]> {
    try {
      console.log('📷 Lade Fotos für Kunde:', customerId);
      
      // Simulation - wird durch echte API ersetzt
      return [];
    } catch (error) {
      console.error('Fehler beim Abrufen der Fotos:', error);
      return [];
    }
  }

  // Hilfsfunktion: Sicheren Token generieren
  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Google Drive API initialisieren
  async initialize(): Promise<boolean> {
    if (!this.apiKey) {
      console.error('❌ Google Drive API Key fehlt!');
      console.log('📝 Bitte setzen Sie REACT_APP_GOOGLE_DRIVE_API_KEY in .env');
      return false;
    }
    
    console.log('✅ Google Drive Service bereit (Demo-Modus)');
    return true;
  }
}

export const googleDriveService = new GoogleDriveService();

// Kategorien für Foto-Upload
export const PHOTO_CATEGORIES = [
  { value: 'wohnzimmer', label: 'Wohnzimmer', icon: '🛋️' },
  { value: 'schlafzimmer', label: 'Schlafzimmer', icon: '🛏️' },
  { value: 'kueche', label: 'Küche', icon: '🍳' },
  { value: 'bad', label: 'Bad', icon: '🚿' },
  { value: 'flur', label: 'Flur', icon: '🚪' },
  { value: 'keller', label: 'Keller', icon: '🏚️' },
  { value: 'dachboden', label: 'Dachboden', icon: '🏠' },
  { value: 'garage', label: 'Garage', icon: '🚗' },
  { value: 'garten', label: 'Garten', icon: '🌳' },
  { value: 'schaeden', label: 'Schäden', icon: '⚠️' },
  { value: 'besonderheiten', label: 'Besonderheiten', icon: '⭐' },
  { value: 'sonstiges', label: 'Sonstiges', icon: '📦' }
];