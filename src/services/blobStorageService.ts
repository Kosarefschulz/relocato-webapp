import { put, del, list, head } from '@vercel/blob';
import { StoredPhoto } from './googleDriveService';

interface BlobUploadOptions {
  access?: 'public' | 'private';
  contentType?: string;
  cacheControlMaxAge?: number;
}

class BlobStorageService {
  private readonly prefix = 'customers';

  /**
   * Upload einer Datei zu Vercel Blob
   */
  async uploadFile(
    customerId: string,
    file: File,
    category: string = 'general'
  ): Promise<StoredPhoto> {
    try {
      // Erstelle Pfad
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const pathname = `${this.prefix}/${customerId}/${category}/${timestamp}_${safeName}`;

      // Upload zu Vercel Blob
      const blob = await put(pathname, file, {
        access: 'public',
        contentType: file.type,
      });

      // Erstelle StoredPhoto Objekt
      const storedPhoto: StoredPhoto = {
        id: blob.pathname,
        customerId,
        fileName: file.name,
        category,
        uploadDate: new Date().toISOString(),
        fileSize: file.size,
        mimeType: file.type,
        webViewLink: blob.url,
        webContentLink: blob.downloadUrl || blob.url,
        thumbnailLink: blob.url, // Vercel Blob hat automatische Bildoptimierung
      };

      return storedPhoto;
    } catch (error) {
      console.error('Blob upload error:', error);
      throw new Error('Failed to upload file to Vercel Blob');
    }
  }

  /**
   * Upload mehrerer Dateien
   */
  async uploadMultipleFiles(
    customerId: string,
    files: File[],
    category: string = 'general'
  ): Promise<StoredPhoto[]> {
    const uploads = files.map(file => this.uploadFile(customerId, file, category));
    return Promise.all(uploads);
  }

  /**
   * Liste alle Dateien eines Kunden
   */
  async listCustomerFiles(customerId: string): Promise<StoredPhoto[]> {
    try {
      const { blobs } = await list({
        prefix: `${this.prefix}/${customerId}/`,
      });

      return blobs.map(blob => ({
        id: blob.pathname,
        customerId,
        fileName: blob.pathname.split('/').pop() || '',
        category: this.extractCategory(blob.pathname),
        uploadDate: blob.uploadedAt.toISOString(),
        fileSize: blob.size,
        mimeType: 'application/octet-stream', // Default mime type as contentType is not available
        webViewLink: blob.url,
        webContentLink: blob.url, // Use url as downloadUrl is not available
        thumbnailLink: blob.url,
      }));
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  /**
   * Lösche eine Datei
   */
  async deleteFile(pathname: string): Promise<void> {
    try {
      await del(pathname);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Lösche alle Dateien eines Kunden
   */
  async deleteCustomerFiles(customerId: string): Promise<void> {
    const files = await this.listCustomerFiles(customerId);
    const deletions = files.map(file => this.deleteFile(file.id));
    await Promise.all(deletions);
  }

  /**
   * Hole Metadaten einer Datei
   */
  async getFileMetadata(pathname: string) {
    try {
      return await head(pathname);
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }

  /**
   * Generiere eine temporäre Download-URL (für private Dateien)
   */
  async generateDownloadUrl(pathname: string): Promise<string> {
    // Bei Vercel Blob sind public URLs immer zugänglich
    // Für private Dateien würde man hier eine signierte URL generieren
    const metadata = await this.getFileMetadata(pathname);
    return metadata?.downloadUrl || metadata?.url || '';
  }

  /**
   * Migriere Foto von Google Drive zu Vercel Blob
   */
  async migrateFromGoogleDrive(
    driveFileId: string,
    customerId: string,
    fileName: string,
    category: string = 'migrated'
  ): Promise<StoredPhoto | null> {
    try {
      // Hier würde die Google Drive Download-Logik kommen
      // Für jetzt simulieren wir es
      console.log(`Would migrate file ${driveFileId} for customer ${customerId}`);
      
      // Placeholder return
      return null;
    } catch (error) {
      console.error('Migration error:', error);
      return null;
    }
  }

  /**
   * Hilfsfunktion: Extrahiere Kategorie aus Pfad
   */
  private extractCategory(pathname: string): string {
    const parts = pathname.split('/');
    // Format: customers/{customerId}/{category}/{filename}
    return parts[2] || 'general';
  }

  /**
   * Erstelle Thumbnail-URL mit Vercel's Bildoptimierung
   */
  getOptimizedImageUrl(url: string, width: number = 200): string {
    // Vercel's Image Optimization API
    return `${url}?w=${width}&q=75`;
  }

  /**
   * Lade alle Fotos eines Kunden (Alias für listCustomerFiles)
   */
  async loadPhotos(customerId: string): Promise<StoredPhoto[]> {
    return this.listCustomerFiles(customerId);
  }
}

// Singleton Export
export const blobStorageService = new BlobStorageService();