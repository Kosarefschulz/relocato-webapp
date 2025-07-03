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
    // Firebase Storage is disabled - this service is inactive
    console.log('⚠️ Firebase Storage Service ist deaktiviert - App nutzt nur noch Supabase');
  }

  async uploadPhoto(
    customerId: string, 
    file: File, 
    category: string = 'Sonstiges',
    description?: string
  ): Promise<StoredPhoto> {
    throw new Error('Firebase Storage ist deaktiviert. Foto-Upload ist derzeit nicht verfügbar. Verwenden Sie Supabase Storage stattdessen.');
  }

  async loadPhotos(customerId: string): Promise<StoredPhoto[]> {
    console.warn('Firebase Storage ist deaktiviert. Keine Fotos verfügbar.');
    return [];
  }

  async deletePhoto(customerId: string, photoId: string): Promise<boolean> {
    console.warn('Firebase Storage ist deaktiviert. Foto-Löschung nicht verfügbar.');
    return false;
  }

  async deleteCustomerPhotos(customerId: string): Promise<boolean> {
    console.warn('Firebase Storage ist deaktiviert. Massenföschung von Fotos nicht verfügbar.');
    return false;
  }

  // Speicherplatz-Info
  async getStorageInfo(): Promise<{ used: number; limit: number; percentage: number }> {
    console.warn('Firebase Storage ist deaktiviert. Speicherplatz-Info nicht verfügbar.');
    return { used: 0, limit: 0, percentage: 0 };
  }
}

export const firebaseStorageService = new FirebaseStorageService();