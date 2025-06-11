import { Customer } from '../types';

// Google Drive Service für Foto-Verwaltung
// Vereinfachte Version ohne Token-System

export interface StoredPhoto {
  id: string;
  customerId: string;
  fileName: string;
  category: string;
  description?: string;
  uploadDate: string;
  fileSize: number;
  mimeType: string;
  base64Thumbnail: string;
  base64Full: string;
}

class GoogleDriveService {
  private readonly STORAGE_KEY = 'customerPhotos';
  private readonly THUMBNAIL_WIDTH = 300;
  private readonly THUMBNAIL_HEIGHT = 300;

  constructor() {
    console.log('📸 Google Drive Service initialisiert (Vereinfachte Version)');
  }

  // Alle Fotos aus localStorage laden
  private loadPhotosFromStorage(): StoredPhoto[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Fehler beim Laden der Fotos:', error);
      return [];
    }
  }

  // Fotos in localStorage speichern
  private savePhotosToStorage(photos: StoredPhoto[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(photos));
    } catch (error) {
      console.error('Fehler beim Speichern der Fotos:', error);
    }
  }

  // Thumbnail erstellen
  private async createThumbnail(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // Aspect Ratio beibehalten
          const aspectRatio = img.width / img.height;
          let width = this.THUMBNAIL_WIDTH;
          let height = this.THUMBNAIL_HEIGHT;
          
          if (aspectRatio > 1) {
            height = width / aspectRatio;
          } else {
            width = height * aspectRatio;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  // Direkter Foto-Upload ohne Token
  async uploadPhotoDirect(
    customerId: string,
    file: File,
    category: string,
    description?: string
  ): Promise<StoredPhoto | null> {
    try {
      console.log('📤 Lade Foto hoch:', {
        datei: file.name,
        größe: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        kategorie: category,
        customerId: customerId
      });

      // Base64 für Full-Size und Thumbnail erstellen
      const base64Full = await this.fileToBase64(file);
      const base64Thumbnail = await this.createThumbnail(file);
      
      // Neues Foto-Objekt
      const newPhoto: StoredPhoto = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerId: customerId,
        fileName: file.name,
        category: category,
        description: description,
        uploadDate: new Date().toISOString(),
        fileSize: file.size,
        mimeType: file.type,
        base64Thumbnail: base64Thumbnail,
        base64Full: base64Full
      };
      
      // In localStorage speichern
      const photos = this.loadPhotosFromStorage();
      photos.push(newPhoto);
      this.savePhotosToStorage(photos);
      
      console.log('✅ Foto erfolgreich gespeichert:', newPhoto.id);
      return newPhoto;
      
    } catch (error) {
      console.error('❌ Fehler beim Upload:', error);
      return null;
    }
  }

  // File zu Base64 konvertieren
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Fotos für Kunden abrufen
  async getCustomerPhotos(customerId: string): Promise<StoredPhoto[]> {
    try {
      console.log('📷 Lade Fotos für Kunde:', customerId);
      
      const allPhotos = this.loadPhotosFromStorage();
      const customerPhotos = allPhotos.filter(photo => photo.customerId === customerId);
      
      console.log(`✅ ${customerPhotos.length} Fotos gefunden für Kunde ${customerId}`);
      return customerPhotos;
    } catch (error) {
      console.error('Fehler beim Abrufen der Fotos:', error);
      return [];
    }
  }

  // Einzelnes Foto löschen
  async deletePhoto(photoId: string): Promise<boolean> {
    try {
      const photos = this.loadPhotosFromStorage();
      const filteredPhotos = photos.filter(photo => photo.id !== photoId);
      
      if (photos.length === filteredPhotos.length) {
        console.error('❌ Foto nicht gefunden:', photoId);
        return false;
      }
      
      this.savePhotosToStorage(filteredPhotos);
      console.log('✅ Foto gelöscht:', photoId);
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen des Fotos:', error);
      return false;
    }
  }

  // Alle Fotos eines Kunden löschen
  async deleteCustomerPhotos(customerId: string): Promise<boolean> {
    try {
      const photos = this.loadPhotosFromStorage();
      const filteredPhotos = photos.filter(photo => photo.customerId !== customerId);
      
      const deletedCount = photos.length - filteredPhotos.length;
      this.savePhotosToStorage(filteredPhotos);
      
      console.log(`✅ ${deletedCount} Fotos für Kunde ${customerId} gelöscht`);
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen der Kundenfotos:', error);
      return false;
    }
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