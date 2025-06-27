import { storage } from '../config/firebase';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  getMetadata 
} from 'firebase/storage';
import { StoredPhoto } from './googleDriveService';

class FirebaseStorageService {
  private readonly PHOTOS_FOLDER = 'customer-photos';
  
  constructor() {
    // Prüfe ob Storage initialisiert ist
    if (!storage) {
      console.error('⚠️ Firebase Storage nicht initialisiert!');
    } else {
      console.log('✅ Firebase Storage Service bereit');
    }
  }

  async uploadPhoto(
    customerId: string, 
    file: File, 
    category: string = 'Sonstiges',
    description?: string
  ): Promise<StoredPhoto> {
    if (!storage) {
      throw new Error('Firebase Storage nicht initialisiert');
    }
    
    try {
      // Erstelle einen eindeutigen Dateinamen
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `${this.PHOTOS_FOLDER}/${customerId}/${fileName}`;
      
      // Upload zu Firebase Storage
      const storageRef = ref(storage, filePath);
      const metadata = {
        customMetadata: {
          customerId,
          category,
          description: description || '',
          originalName: file.name,
          uploadDate: new Date().toISOString()
        }
      };
      
      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Erstelle Photo-Objekt
      const photo: StoredPhoto = {
        id: `firebase_${timestamp}`,
        customerId,
        fileName: file.name,
        category,
        description,
        uploadDate: new Date().toISOString(),
        fileSize: file.size,
        mimeType: file.type,
        webContentLink: downloadURL,
        thumbnailLink: downloadURL // Firebase hat keine separaten Thumbnails
      };
      
      return photo;
    } catch (error) {
      console.error('Fehler beim Upload zu Firebase Storage:', error);
      throw new Error('Upload fehlgeschlagen');
    }
  }

  async loadPhotos(customerId: string): Promise<StoredPhoto[]> {
    if (!storage) {
      console.warn('Firebase Storage nicht initialisiert');
      return [];
    }
    
    try {
      // Stelle sicher dass customerId keine Zeilenumbrüche enthält
      const cleanCustomerId = customerId.trim();
      const folderRef = ref(storage, `${this.PHOTOS_FOLDER}/${cleanCustomerId}`);
      const result = await listAll(folderRef);
      
      const photos: StoredPhoto[] = [];
      
      for (const itemRef of result.items) {
        try {
          const [url, metadata] = await Promise.all([
            getDownloadURL(itemRef),
            getMetadata(itemRef)
          ]);
          
          const customMetadata = metadata.customMetadata || {};
          
          photos.push({
            id: `firebase_${metadata.generation}`,
            customerId: customMetadata.customerId || customerId,
            fileName: customMetadata.originalName || itemRef.name,
            category: customMetadata.category || 'Sonstiges',
            description: customMetadata.description,
            uploadDate: customMetadata.uploadDate || metadata.timeCreated,
            fileSize: metadata.size,
            mimeType: metadata.contentType || 'image/jpeg',
            webContentLink: url,
            thumbnailLink: url
          });
        } catch (error) {
          console.error('Fehler beim Laden eines Fotos:', error);
        }
      }
      
      // Sortiere nach Upload-Datum (neueste zuerst)
      return photos.sort((a, b) => 
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );
    } catch (error) {
      console.error('Fehler beim Laden der Fotos:', error);
      return [];
    }
  }

  async deletePhoto(customerId: string, photoId: string): Promise<boolean> {
    try {
      // Finde das Foto
      const photos = await this.loadPhotos(customerId);
      const photo = photos.find(p => p.id === photoId);
      
      if (!photo) {
        throw new Error('Foto nicht gefunden');
      }
      
      // Lösche aus Firebase Storage
      const fileName = photo.fileName;
      const filePath = `${this.PHOTOS_FOLDER}/${customerId}/${fileName}`;
      const fileRef = ref(storage, filePath);
      
      await deleteObject(fileRef);
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      return false;
    }
  }

  async deleteCustomerPhotos(customerId: string): Promise<boolean> {
    try {
      const photos = await this.loadPhotos(customerId);
      
      // Lösche alle Fotos
      const deletePromises = photos.map(photo => 
        this.deletePhoto(customerId, photo.id)
      );
      
      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen aller Kundenfotos:', error);
      return false;
    }
  }

  // Speicherplatz-Info
  async getStorageInfo(): Promise<{ used: number; limit: number; percentage: number }> {
    // Firebase Free Plan: 5 GB
    const limit = 5 * 1024 * 1024 * 1024; // 5 GB in Bytes
    
    try {
      // Wir können die genaue Nutzung nicht direkt abfragen,
      // aber wir können eine Schätzung basierend auf den Fotos machen
      const rootRef = ref(storage, this.PHOTOS_FOLDER);
      const result = await listAll(rootRef);
      
      let totalSize = 0;
      
      // Zähle alle Unterordner (Kunden)
      for (const folderRef of result.prefixes) {
        const customerResult = await listAll(folderRef);
        
        for (const itemRef of customerResult.items) {
          try {
            const metadata = await getMetadata(itemRef);
            totalSize += metadata.size || 0;
          } catch (error) {
            console.error('Fehler beim Abrufen der Metadaten:', error);
          }
        }
      }
      
      return {
        used: totalSize,
        limit: limit,
        percentage: (totalSize / limit) * 100
      };
    } catch (error) {
      console.error('Fehler beim Abrufen der Speicherinfo:', error);
      return { used: 0, limit: limit, percentage: 0 };
    }
  }
}

export const firebaseStorageService = new FirebaseStorageService();