import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
} from 'firebase/storage';
import { storage } from '../config/firebase';

// Prüfe ob Storage verfügbar ist
const isStorageAvailable = () => !!storage;

export interface StoredPhoto {
  id: string;
  url: string;
  name: string;
  size: number;
  uploadedAt: Date;
  category?: string;
}

class FirebaseStorageService {
  private readonly baseStoragePath = 'customers';

  /**
   * Upload ein Foto für einen Kunden
   */
  async uploadPhoto(
    customerId: string,
    file: File,
    category: string = 'general'
  ): Promise<StoredPhoto> {
    if (!isStorageAvailable()) {
      throw new Error('Firebase Storage nicht verfügbar - bitte konfigurieren Sie Firebase');
    }
    
    try {
      console.log('📸 Lade Foto hoch:', file.name);

      // Generiere eindeutigen Dateinamen
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `${this.baseStoragePath}/${customerId}/photos/${category}/${fileName}`;

      // Storage Referenz
      const storageRef = ref(storage, filePath);

      // Upload
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          customerId,
          category,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Download URL abrufen
      const downloadURL = await getDownloadURL(snapshot.ref);

      const photo: StoredPhoto = {
        id: snapshot.ref.fullPath,
        url: downloadURL,
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        category,
      };

      console.log('✅ Foto erfolgreich hochgeladen:', photo.url);
      return photo;
    } catch (error) {
      console.error('❌ Fehler beim Foto-Upload:', error);
      throw error;
    }
  }

  /**
   * Lade alle Fotos eines Kunden
   */
  async getCustomerPhotos(customerId: string): Promise<StoredPhoto[]> {
    try {
      console.log('📋 Lade Fotos für Kunde:', customerId);
      
      const photos: StoredPhoto[] = [];
      const basePath = `${this.baseStoragePath}/${customerId}/photos`;
      const baseRef = ref(storage, basePath);

      // Liste alle Kategorien
      const categoriesList = await listAll(baseRef);

      // Durchlaufe alle Kategorien
      for (const categoryRef of categoriesList.prefixes) {
        const categoryName = categoryRef.name;
        const photosList = await listAll(categoryRef);

        // Durchlaufe alle Fotos in der Kategorie
        for (const photoRef of photosList.items) {
          try {
            const [url, metadata] = await Promise.all([
              getDownloadURL(photoRef),
              getMetadata(photoRef),
            ]);

            photos.push({
              id: photoRef.fullPath,
              url,
              name: metadata.customMetadata?.originalName || photoRef.name,
              size: metadata.size,
              uploadedAt: new Date(metadata.timeCreated),
              category: categoryName,
            });
          } catch (error) {
            console.error('Fehler beim Laden eines Fotos:', error);
          }
        }
      }

      console.log(`✅ ${photos.length} Fotos gefunden`);
      return photos.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    } catch (error) {
      console.error('❌ Fehler beim Laden der Fotos:', error);
      return [];
    }
  }

  /**
   * Lösche ein Foto
   */
  async deletePhoto(photoId: string): Promise<void> {
    try {
      console.log('🗑️ Lösche Foto:', photoId);
      const photoRef = ref(storage, photoId);
      await deleteObject(photoRef);
      console.log('✅ Foto gelöscht');
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Fotos:', error);
      throw error;
    }
  }

  /**
   * Lösche alle Fotos eines Kunden
   */
  async deleteAllCustomerPhotos(customerId: string): Promise<void> {
    try {
      console.log('🗑️ Lösche alle Fotos für Kunde:', customerId);
      
      const basePath = `${this.baseStoragePath}/${customerId}/photos`;
      const baseRef = ref(storage, basePath);
      const result = await listAll(baseRef);

      // Lösche alle Dateien in allen Unterordnern
      const deletePromises: Promise<void>[] = [];
      
      for (const folderRef of result.prefixes) {
        const folderContents = await listAll(folderRef);
        for (const fileRef of folderContents.items) {
          deletePromises.push(deleteObject(fileRef));
        }
      }

      await Promise.all(deletePromises);
      console.log('✅ Alle Fotos gelöscht');
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Fotos:', error);
      throw error;
    }
  }

  /**
   * Generiere einen temporären Download-Link
   */
  async getTemporaryDownloadLink(photoId: string): Promise<string> {
    try {
      const photoRef = ref(storage, photoId);
      return await getDownloadURL(photoRef);
    } catch (error) {
      console.error('❌ Fehler beim Generieren des Download-Links:', error);
      throw error;
    }
  }

  /**
   * Upload mehrere Fotos gleichzeitig
   */
  async uploadMultiplePhotos(
    customerId: string,
    files: FileList | File[],
    category: string = 'general',
    onProgress?: (completed: number, total: number) => void
  ): Promise<StoredPhoto[]> {
    const photos: StoredPhoto[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      try {
        const file = files[i];
        const photo = await this.uploadPhoto(customerId, file, category);
        photos.push(photo);
        
        if (onProgress) {
          onProgress(i + 1, totalFiles);
        }
      } catch (error) {
        console.error(`Fehler beim Upload von Datei ${i + 1}:`, error);
      }
    }

    return photos;
  }

  /**
   * Komprimiere Bild vor Upload (Client-seitig)
   */
  async compressImage(file: File, maxWidth: number = 2560, quality: number = 0.95): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Berechne neue Dimensionen
          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context nicht verfügbar'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Blob-Erstellung fehlgeschlagen'));
              }
            },
            file.type,
            quality
          );
        };

        img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
      reader.readAsDataURL(file);
    });
  }
}

// Photo-Kategorien für die Umzugs-App
export const PHOTO_CATEGORIES = {
  BEFORE: 'vorher',
  AFTER: 'nachher',
  DAMAGE: 'schaeden',
  INVENTORY: 'inventar',
  DOCUMENTS: 'dokumente',
  GENERAL: 'allgemein',
} as const;

export const firebaseStorageService = new FirebaseStorageService();