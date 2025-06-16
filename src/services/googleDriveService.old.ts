import { Customer } from '../types';

// Google Drive Service für Foto-Verwaltung
// Kommuniziert mit dem Backend für echte Google Drive Integration

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
  private readonly BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
  private readonly THUMBNAIL_WIDTH = 300;
  private readonly THUMBNAIL_HEIGHT = 300;
  private readonly STORAGE_KEY = 'customerPhotos';
  private useBackend = false;

  constructor() {
    console.log('📸 Google Drive Service initialisiert');
    this.checkBackendAvailability();
  }

  // Prüfe ob Backend verfügbar ist
  private async checkBackendAvailability() {
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/health`);
      const data = await response.json();
      
      if (data.googleDrive === 'ready') {
        console.log('✅ Google Drive Backend verfügbar');
        this.useBackend = true;
      } else {
        console.log('⚠️ Google Drive im Backend nicht konfiguriert - verwende localStorage');
      }
    } catch (error) {
      console.log('ℹ️ Backend nicht erreichbar - verwende localStorage Fallback');
    }
  }

  // Alle Fotos aus localStorage laden (Fallback)
  private loadPhotosFromStorage(): StoredPhoto[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Fehler beim Laden der Fotos:', error);
      return [];
    }
  }

  // Fotos in localStorage speichern (Fallback)
  private savePhotosToStorage(photos: StoredPhoto[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(photos));
    } catch (error) {
      console.error('Fehler beim Speichern der Fotos:', error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Lösche älteste Fotos wenn Speicher voll
        const sortedPhotos = photos.sort((a, b) => 
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
        const reducedPhotos = sortedPhotos.slice(0, 100); // Behalte nur die neuesten 100
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reducedPhotos));
        console.log(`⚠️ Speicher voll - behalte nur die neuesten ${reducedPhotos.length} Fotos`);
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
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context nicht verfügbar'));
            return;
          }

          // Berechne Skalierung für Thumbnail
          const scale = Math.min(
            this.THUMBNAIL_WIDTH / img.width,
            this.THUMBNAIL_HEIGHT / img.height
          );
          
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Foto zu Google Drive hochladen (über Backend)
  async uploadPhoto(
    customerId: string,
    customerName: string,
    file: File,
    category: string = 'Allgemein',
    description?: string
  ): Promise<StoredPhoto> {
    try {
      // Versuche zuerst über Backend hochzuladen
      if (this.useBackend) {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('customerId', customerId);
        formData.append('customerName', customerName);

        const response = await fetch(`${this.BACKEND_URL}/api/upload-photo`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          
          // Erstelle Thumbnail für lokale Anzeige
          const thumbnail = await this.createThumbnail(file);
          
          const photo: StoredPhoto = {
            id: data.fileId,
            customerId,
            fileName: data.fileName,
            category,
            description,
            uploadDate: new Date().toISOString(),
            fileSize: file.size,
            mimeType: file.type,
            driveFileId: data.fileId,
            webViewLink: data.webViewLink,
            webContentLink: data.webContentLink,
            base64Thumbnail: thumbnail
          };

          // Speichere auch lokal für schnellen Zugriff
          const photos = this.loadPhotosFromStorage();
          photos.push(photo);
          this.savePhotosToStorage(photos);

          console.log('✅ Foto erfolgreich zu Google Drive hochgeladen');
          return photo;
        }
      }

      // Fallback zu localStorage
      console.log('ℹ️ Verwende localStorage für Foto-Upload');
      return await this.uploadPhotoToLocalStorage(customerId, file, category, description);
      
    } catch (error) {
      console.error('Upload-Fehler, verwende Fallback:', error);
      return await this.uploadPhotoToLocalStorage(customerId, file, category, description);
    }
  }

  // Fallback: Foto in localStorage speichern
  private async uploadPhotoToLocalStorage(
    customerId: string,
    file: File,
    category: string,
    description?: string
  ): Promise<StoredPhoto> {
    const fileReader = new FileReader();
    
    return new Promise((resolve, reject) => {
      fileReader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;
          
          // Komprimiere das Bild
          const compressedBase64 = await this.compressImage(base64);
          
          // Erstelle Thumbnail
          const thumbnail = await this.createThumbnail(file);
          
          const photo: StoredPhoto = {
            id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            customerId,
            fileName: file.name,
            category,
            description,
            uploadDate: new Date().toISOString(),
            fileSize: file.size,
            mimeType: file.type,
            base64Thumbnail: thumbnail,
            webContentLink: compressedBase64
          };
          
          const photos = this.loadPhotosFromStorage();
          photos.push(photo);
          this.savePhotosToStorage(photos);
          
          resolve(photo);
        } catch (error) {
          reject(error);
        }
      };
      
      fileReader.onerror = reject;
      fileReader.readAsDataURL(file);
    });
  }

  // Bild komprimieren
  private async compressImage(base64: string, quality: number = 0.85): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context nicht verfügbar'));
          return;
        }

        // Maximal 2000x2000 Pixel
        const maxSize = 2000;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          const scale = Math.min(maxSize / width, maxSize / height);
          width *= scale;
          height *= scale;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = base64;
    });
  }

  // Alle Fotos eines Kunden abrufen
  async getCustomerPhotos(customerId: string): Promise<StoredPhoto[]> {
    try {
      // Versuche zuerst vom Backend
      if (this.useBackend) {
        const response = await fetch(`${this.BACKEND_URL}/api/customer-photos/${customerId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.photos) {
            // Konvertiere Backend-Format zu StoredPhoto
            const photos = data.photos.map((photo: any) => ({
              id: photo.id,
              customerId,
              fileName: photo.name,
              category: 'Allgemein',
              uploadDate: photo.createdTime,
              fileSize: photo.size || 0,
              mimeType: 'image/jpeg',
              driveFileId: photo.id,
              webViewLink: photo.webViewLink,
              webContentLink: photo.webContentLink
            }));

            console.log(`✅ ${photos.length} Fotos von Google Drive geladen`);
            return photos;
          }
        }
      }

      // Fallback zu localStorage
      const allPhotos = this.loadPhotosFromStorage();
      return allPhotos.filter(photo => photo.customerId === customerId);
      
    } catch (error) {
      console.error('Fehler beim Abrufen der Fotos:', error);
      // Fallback zu localStorage
      const allPhotos = this.loadPhotosFromStorage();
      return allPhotos.filter(photo => photo.customerId === customerId);
    }
  }

  // Foto löschen
  async deletePhoto(photoId: string): Promise<boolean> {
    try {
      // Versuche zuerst über Backend
      if (this.useBackend && !photoId.startsWith('local_')) {
        const response = await fetch(`${this.BACKEND_URL}/api/delete-photo/${photoId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          console.log('✅ Foto von Google Drive gelöscht');
          
          // Lösche auch aus localStorage
          const photos = this.loadPhotosFromStorage();
          const filtered = photos.filter(p => p.id !== photoId);
          this.savePhotosToStorage(filtered);
          
          return true;
        }
      }

      // Fallback: Nur aus localStorage löschen
      const photos = this.loadPhotosFromStorage();
      const filtered = photos.filter(p => p.id !== photoId);
      this.savePhotosToStorage(filtered);
      
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      // Versuche trotzdem aus localStorage zu löschen
      const photos = this.loadPhotosFromStorage();
      const filtered = photos.filter(p => p.id !== photoId);
      this.savePhotosToStorage(filtered);
      return true;
    }
  }

  // Alle Fotos eines Kunden löschen
  async deleteAllCustomerPhotos(customerId: string): Promise<boolean> {
    try {
      const customerPhotos = await this.getCustomerPhotos(customerId);
      
      // Lösche jedes Foto einzeln
      for (const photo of customerPhotos) {
        await this.deletePhoto(photo.id);
      }
      
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen aller Fotos:', error);
      return false;
    }
  }

  // Prüfe ob Backend verfügbar ist
  isBackendAvailable(): boolean {
    return this.useBackend;
  }
}

// Singleton Instance
const googleDriveService = new GoogleDriveService();
export default googleDriveService;