import { Customer } from '../types';

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

class GoogleDriveServiceEnhanced {
  private readonly BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://europe-west1-umzugsapp.cloudfunctions.net/backendApi';
  private readonly STORAGE_KEY = 'customerPhotos';
  private backendAvailable = false;

  constructor() {
    console.log('📸 Google Drive Service Enhanced initialisiert');
    this.checkBackendAvailability();
  }

  private async checkBackendAvailability() {
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/health`);
      if (response.ok) {
        this.backendAvailable = true;
        console.log('✅ Backend verfügbar:', this.BACKEND_URL);
      }
    } catch (error) {
      console.log('⚠️ Backend nicht erreichbar, nutze localStorage');
    }
  }

  // Upload mehrerer Fotos
  async uploadPhotos(
    customerId: string,
    customerName: string,
    files: File[],
    category: string = 'Allgemein',
    description?: string
  ): Promise<StoredPhoto[]> {
    if (!this.backendAvailable) {
      console.warn('Backend nicht verfügbar, nutze localStorage');
      return this.uploadPhotosToLocalStorage(customerId, files, category, description);
    }

    try {
      const formData = new FormData();
      
      // Füge alle Dateien hinzu
      files.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('customerId', customerId);
      formData.append('customerName', customerName);
      formData.append('category', category);
      if (description) formData.append('description', description);

      const response = await fetch(`${this.BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload fehlgeschlagen: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.files) {
        console.log(`✅ ${result.files.length} Fotos erfolgreich hochgeladen`);
        
        // Erstelle StoredPhoto Objekte
        const photos: StoredPhoto[] = await Promise.all(
          result.files.map(async (file: any, index: number) => {
            const originalFile = files[index];
            const thumbnail = await this.createThumbnail(originalFile);
            
            return {
              id: file.id,
              customerId,
              fileName: file.name,
              category,
              description,
              uploadDate: new Date().toISOString(),
              fileSize: originalFile.size,
              mimeType: originalFile.type,
              driveFileId: file.id,
              webViewLink: file.url,
              base64Thumbnail: thumbnail
            };
          })
        );

        // Speichere auch lokal für Cache
        this.addPhotosToLocalStorage(photos);
        
        return photos;
      }
      
      throw new Error('Unerwartete Server-Antwort');
    } catch (error) {
      console.error('Upload-Fehler:', error);
      return this.uploadPhotosToLocalStorage(customerId, files, category, description);
    }
  }

  // Einzelnes Foto hochladen (Wrapper)
  async uploadPhoto(
    customerId: string,
    customerName: string,
    file: File,
    category: string = 'Allgemein',
    description?: string
  ): Promise<StoredPhoto | null> {
    const results = await this.uploadPhotos(customerId, customerName, [file], category, description);
    return results.length > 0 ? results[0] : null;
  }

  // Direkter Upload (kompatibel mit altem Code)
  async uploadPhotoDirect(
    customerId: string,
    file: File,
    category: string = 'Allgemein',
    description?: string
  ): Promise<StoredPhoto | null> {
    // Hole Kundennamen aus localStorage oder nutze customerId
    const customerName = this.getCustomerName(customerId) || customerId;
    return this.uploadPhoto(customerId, customerName, file, category, description);
  }

  // Fotos eines Kunden abrufen
  async getCustomerPhotos(customerId: string): Promise<StoredPhoto[]> {
    // Zuerst aus lokalem Cache
    const allPhotos = this.loadPhotosFromStorage();
    return allPhotos.filter(photo => photo.customerId === customerId);
  }

  // Foto löschen
  async deletePhoto(photoId: string): Promise<boolean> {
    try {
      // Versuche über Backend zu löschen
      if (this.backendAvailable && photoId.startsWith('drive_')) {
        const response = await fetch(`${this.BACKEND_URL}/api/photos/${photoId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          console.warn('Backend-Löschung fehlgeschlagen');
        }
      }

      // Lösche auch lokal
      const photos = this.loadPhotosFromStorage();
      const filtered = photos.filter(p => p.id !== photoId);
      this.savePhotosToStorage(filtered);
      
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      return false;
    }
  }

  // Alle Fotos eines Kunden löschen
  async deleteCustomerPhotos(customerId: string): Promise<boolean> {
    try {
      const photos = this.loadPhotosFromStorage();
      const filtered = photos.filter(p => p.customerId !== customerId);
      this.savePhotosToStorage(filtered);
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen der Kundenfotos:', error);
      return false;
    }
  }

  // Private Hilfsmethoden
  private loadPhotosFromStorage(): StoredPhoto[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Fehler beim Laden der Fotos:', error);
      return [];
    }
  }

  private savePhotosToStorage(photos: StoredPhoto[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(photos));
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      // Bei Speicherplatzproblemen alte Fotos entfernen
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        const sorted = photos.sort((a, b) => 
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
        const reduced = sorted.slice(0, 100);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reduced));
      }
    }
  }

  private addPhotosToLocalStorage(newPhotos: StoredPhoto[]) {
    const existing = this.loadPhotosFromStorage();
    const combined = [...existing, ...newPhotos];
    this.savePhotosToStorage(combined);
  }

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

          // Thumbnail-Größe
          const maxSize = 200;
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  private async uploadPhotosToLocalStorage(
    customerId: string,
    files: File[],
    category: string,
    description?: string
  ): Promise<StoredPhoto[]> {
    const photos: StoredPhoto[] = [];
    
    for (const file of files) {
      try {
        const base64 = await this.fileToBase64(file);
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
          base64Thumbnail: thumbnail
        };
        
        photos.push(photo);
      } catch (error) {
        console.error(`Fehler beim Verarbeiten von ${file.name}:`, error);
      }
    }
    
    if (photos.length > 0) {
      this.addPhotosToLocalStorage(photos);
    }
    
    return photos;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private getCustomerName(customerId: string): string | null {
    try {
      const customersStr = localStorage.getItem('customers');
      if (customersStr) {
        const customers = JSON.parse(customersStr);
        const customer = customers.find((c: any) => c.id === customerId);
        return customer?.name || null;
      }
    } catch (error) {
      console.error('Fehler beim Abrufen des Kundennamens:', error);
    }
    return null;
  }
}

// Singleton-Instanz
const googleDriveServiceEnhanced = new GoogleDriveServiceEnhanced();
export default googleDriveServiceEnhanced;