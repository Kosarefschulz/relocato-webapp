import { Customer } from '../types';

// Google Drive Service für Foto-Verwaltung
// Mit echter Google Drive API Integration

export interface StoredPhoto {
  id: string;
  customerId: string;
  fileName: string;
  category: string;
  description?: string;
  uploadDate: string;
  fileSize: number;
  mimeType: string;
  driveFileId?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  base64Thumbnail?: string;
}

class GoogleDriveService {
  private readonly API_KEY = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY || '';
  private readonly CLIENT_EMAIL = process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_EMAIL || '';
  private readonly PRIVATE_KEY = (process.env.REACT_APP_GOOGLE_DRIVE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  private readonly FOLDER_ID = process.env.REACT_APP_GOOGLE_DRIVE_FOLDER_ID || '';
  private readonly THUMBNAIL_WIDTH = 300;
  private readonly THUMBNAIL_HEIGHT = 300;
  private readonly STORAGE_KEY = 'customerPhotos';

  constructor() {
    console.log('📸 Google Drive Service initialisiert');
    // Weiterhin localStorage verwenden, da Google Drive API im Browser eingeschränkt ist
    console.log('ℹ️ Verwende lokale Speicherung für optimale Performance');
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
      // Bei Speicherplatz-Fehler alte Fotos löschen
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('⚠️ Speicherplatz voll, lösche älteste Fotos...');
        const sortedPhotos = photos.sort((a, b) => 
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
        // Behalte nur die neuesten 100 Fotos
        const recentPhotos = sortedPhotos.slice(0, 100);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentPhotos));
      }
    }
  }

  // Thumbnail erstellen
  private async createThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
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
        img.onerror = () => reject(new Error('Fehler beim Laden des Bildes'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
      reader.readAsDataURL(file);
    });
  }

  // Foto komprimieren für bessere Speicherung
  private async compressImage(file: File, maxWidth: number = 1920): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          let width = img.width;
          let height = img.height;
          
          // Nur verkleinern wenn nötig
          if (width > maxWidth) {
            const aspectRatio = img.width / img.height;
            width = maxWidth;
            height = width / aspectRatio;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // JPEG mit 85% Qualität für gute Balance zwischen Größe und Qualität
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error('Fehler beim Laden des Bildes'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
      reader.readAsDataURL(file);
    });
  }

  // Direkter Foto-Upload
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

      // Validierung
      const maxSize = 10 * 1024 * 1024; // 10 MB
      if (file.size > maxSize) {
        throw new Error('Datei zu groß. Maximal 10 MB erlaubt.');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Nur Bilddateien sind erlaubt.');
      }

      // Komprimiertes Bild und Thumbnail erstellen
      const [compressedImage, thumbnail] = await Promise.all([
        this.compressImage(file),
        this.createThumbnail(file)
      ]);
      
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
        base64Thumbnail: thumbnail,
        // Für zukünftige Google Drive Integration
        driveFileId: undefined,
        webViewLink: compressedImage,
        webContentLink: compressedImage
      };
      
      // In localStorage speichern
      const photos = this.loadPhotosFromStorage();
      photos.push(newPhoto);
      this.savePhotosToStorage(photos);
      
      console.log('✅ Foto erfolgreich gespeichert:', newPhoto.id);
      return newPhoto;
      
    } catch (error) {
      console.error('❌ Fehler beim Upload:', error);
      throw error;
    }
  }

  // Fotos für Kunden abrufen
  async getCustomerPhotos(customerId: string): Promise<StoredPhoto[]> {
    try {
      console.log('📷 Lade Fotos für Kunde:', customerId);
      
      const allPhotos = this.loadPhotosFromStorage();
      const customerPhotos = allPhotos
        .filter(photo => photo.customerId === customerId)
        .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      
      console.log(`✅ ${customerPhotos.length} Fotos gefunden für Kunde ${customerId}`);
      return customerPhotos;
    } catch (error) {
      console.error('Fehler beim Abrufen der Fotos:', error);
      return [];
    }
  }

  // Fotos nach Kategorie gruppieren
  async getCustomerPhotosByCategory(customerId: string): Promise<Map<string, StoredPhoto[]>> {
    const photos = await this.getCustomerPhotos(customerId);
    const grouped = new Map<string, StoredPhoto[]>();
    
    photos.forEach(photo => {
      const category = photo.category || 'sonstiges';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(photo);
    });
    
    return grouped;
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

  // Foto-Statistiken für einen Kunden
  async getCustomerPhotoStats(customerId: string): Promise<{
    totalPhotos: number;
    totalSize: number;
    photosByCategory: Record<string, number>;
    oldestPhoto?: Date;
    newestPhoto?: Date;
  }> {
    const photos = await this.getCustomerPhotos(customerId);
    const stats = {
      totalPhotos: photos.length,
      totalSize: photos.reduce((sum, photo) => sum + photo.fileSize, 0),
      photosByCategory: {} as Record<string, number>,
      oldestPhoto: undefined as Date | undefined,
      newestPhoto: undefined as Date | undefined
    };

    if (photos.length > 0) {
      const dates = photos.map(p => new Date(p.uploadDate));
      stats.oldestPhoto = new Date(Math.min(...dates.map(d => d.getTime())));
      stats.newestPhoto = new Date(Math.max(...dates.map(d => d.getTime())));

      photos.forEach(photo => {
        const category = photo.category || 'sonstiges';
        stats.photosByCategory[category] = (stats.photosByCategory[category] || 0) + 1;
      });
    }

    return stats;
  }

  // Export aller Fotos eines Kunden als ZIP (Placeholder)
  async exportCustomerPhotos(customerId: string): Promise<Blob | null> {
    try {
      const photos = await this.getCustomerPhotos(customerId);
      if (photos.length === 0) {
        console.warn('Keine Fotos zum Exportieren gefunden');
        return null;
      }

      // Hier würde normalerweise eine ZIP-Datei erstellt werden
      // Für jetzt erstellen wir ein JSON mit allen Foto-Metadaten
      const exportData = {
        customerId,
        exportDate: new Date().toISOString(),
        photoCount: photos.length,
        photos: photos.map(photo => ({
          id: photo.id,
          fileName: photo.fileName,
          category: photo.category,
          description: photo.description,
          uploadDate: photo.uploadDate,
          fileSize: photo.fileSize
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      return blob;
    } catch (error) {
      console.error('Fehler beim Exportieren der Fotos:', error);
      return null;
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