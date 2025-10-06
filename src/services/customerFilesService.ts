import { supabase } from './supabaseService';
import { ruempelPdfParserService } from './ruempelPdfParserService';

export interface CustomerFile {
  id: string;
  customer_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  mime_type?: string;
  category: 'angebot' | 'rechnung' | 'vertrag' | 'besichtigung' | 'sonstiges' | 'allgemein';
  parsed_data?: any;
  is_parsed: boolean;
  parse_status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  parse_error?: string;
  description?: string;
  tags?: string[];
  uploaded_by?: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface FileUploadResult {
  success: boolean;
  file?: CustomerFile;
  error?: string;
  downloadUrl?: string;
}

class CustomerFilesService {
  private readonly BUCKET_NAME = 'customer-files';

  /**
   * Initialisiere Storage Bucket (falls noch nicht vorhanden)
   */
  async initializeBucket(): Promise<void> {
    try {
      // Prüfe ob Bucket existiert
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === this.BUCKET_NAME);

      if (!bucketExists) {
        console.log('📦 Creating customer-files bucket...');
        const { error } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: false,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ],
        });

        if (error) {
          console.error('❌ Error creating bucket:', error);
        } else {
          console.log('✅ Bucket created successfully');
        }
      }
    } catch (error) {
      console.error('❌ Error initializing bucket:', error);
    }
  }

  /**
   * Datei hochladen und automatisch analysieren
   */
  async uploadFile(
    customerId: string,
    file: File,
    category: CustomerFile['category'] = 'allgemein',
    description?: string
  ): Promise<FileUploadResult> {
    try {
      console.log('📤 Uploading file:', file.name, 'for customer:', customerId);

      // Generiere eindeutigen Dateinamen
      const fileId = crypto.randomUUID();
      const fileExtension = file.name.split('.').pop();
      const storagePath = `${customerId}/${fileId}/${file.name}`;

      // Upload zu Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        return { success: false, error: uploadError.message };
      }

      console.log('✅ File uploaded to storage:', uploadData.path);

      // Erstelle Datenbank-Eintrag
      const fileRecord: Partial<CustomerFile> = {
        customer_id: customerId,
        file_name: file.name,
        file_type: fileExtension?.toLowerCase() || 'unknown',
        file_size: file.size,
        file_path: storagePath,
        mime_type: file.type,
        category,
        description,
        is_parsed: false,
        parse_status: fileExtension?.toLowerCase() === 'pdf' ? 'pending' : 'skipped',
      };

      const { data: dbData, error: dbError } = await supabase
        .from('customer_files')
        .insert([fileRecord])
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error:', dbError);
        // Cleanup: Lösche hochgeladene Datei
        await supabase.storage.from(this.BUCKET_NAME).remove([storagePath]);
        return { success: false, error: dbError.message };
      }

      console.log('✅ File record created in database:', dbData.id);

      // Wenn PDF: Automatisch parsen
      if (fileExtension?.toLowerCase() === 'pdf') {
        this.parsePdfAsync(dbData.id, customerId, file);
      }

      // Get download URL
      const { data: urlData } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(storagePath, 3600);

      return {
        success: true,
        file: dbData as CustomerFile,
        downloadUrl: urlData?.signedUrl,
      };
    } catch (error: any) {
      console.error('❌ Error uploading file:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * PDF asynchron parsen (im Hintergrund)
   */
  private async parsePdfAsync(fileId: string, customerId: string, file: File): Promise<void> {
    try {
      console.log('🔄 Starting async PDF parsing for file:', fileId);

      // Status auf "processing" setzen
      await supabase
        .from('customer_files')
        .update({ parse_status: 'processing' })
        .eq('id', fileId);

      // Parse PDF
      const parseResult = await ruempelPdfParserService.parsePDF(file);

      if (parseResult.success && parseResult.data) {
        // Speichere geparste Daten
        await supabase.rpc('mark_file_as_parsed', {
          p_file_id: fileId,
          p_parsed_data: parseResult.data,
          p_success: true,
        });

        console.log('✅ PDF parsed successfully:', fileId);

        // Optional: Erstelle automatisch Angebot aus geparsten Daten
        if (parseResult.data.offerNumber) {
          const { offerService } = await import('./offerService');
          await offerService.createOfferFromPDF(
            parseResult.data,
            customerId,
            file.name
          );
          console.log('✅ Offer created from parsed PDF');
        }
      } else {
        // Fehler beim Parsen
        await supabase.rpc('mark_file_as_parsed', {
          p_file_id: fileId,
          p_parsed_data: null,
          p_success: false,
          p_error: parseResult.error || 'Unknown parsing error',
        });

        console.warn('⚠️ PDF parsing failed:', parseResult.error);
      }
    } catch (error: any) {
      console.error('❌ Error in async PDF parsing:', error);
      await supabase.rpc('mark_file_as_parsed', {
        p_file_id: fileId,
        p_parsed_data: null,
        p_success: false,
        p_error: error.message,
      });
    }
  }

  /**
   * Alle Dateien eines Kunden abrufen
   */
  async getCustomerFiles(customerId: string): Promise<CustomerFile[]> {
    try {
      const { data, error } = await supabase
        .from('customer_files')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_deleted', false)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return (data as CustomerFile[]) || [];
    } catch (error) {
      console.error('❌ Error fetching customer files:', error);
      return [];
    }
  }

  /**
   * Einzelne Datei abrufen
   */
  async getFile(fileId: string): Promise<CustomerFile | null> {
    try {
      const { data, error } = await supabase
        .from('customer_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error) throw error;
      return data as CustomerFile;
    } catch (error) {
      console.error('❌ Error fetching file:', error);
      return null;
    }
  }

  /**
   * Download-URL für Datei generieren
   */
  async getDownloadUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('❌ Error generating download URL:', error);
      return null;
    }
  }

  /**
   * Datei herunterladen
   */
  async downloadFile(filePath: string): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(filePath);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      return null;
    }
  }

  /**
   * Datei löschen (soft delete)
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('soft_delete_file', {
        p_file_id: fileId,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      return false;
    }
  }

  /**
   * Datei permanent löschen (auch aus Storage)
   */
  async permanentlyDeleteFile(fileId: string): Promise<boolean> {
    try {
      // Hole Datei-Info
      const file = await this.getFile(fileId);
      if (!file) return false;

      // Lösche aus Storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([file.file_path]);

      if (storageError) {
        console.error('❌ Storage delete error:', storageError);
      }

      // Lösche aus Datenbank
      const { error: dbError } = await supabase
        .from('customer_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      console.log('✅ File permanently deleted:', fileId);
      return true;
    } catch (error) {
      console.error('❌ Error permanently deleting file:', error);
      return false;
    }
  }

  /**
   * Datei-Metadaten aktualisieren
   */
  async updateFile(
    fileId: string,
    updates: {
      category?: CustomerFile['category'];
      description?: string;
      tags?: string[];
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customer_files')
        .update(updates)
        .eq('id', fileId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Error updating file:', error);
      return false;
    }
  }

  /**
   * PDF manuell neu parsen
   */
  async reparseFile(fileId: string): Promise<boolean> {
    try {
      const file = await this.getFile(fileId);
      if (!file || file.file_type !== 'pdf') {
        return false;
      }

      // Lade Datei herunter
      const blob = await this.downloadFile(file.file_path);
      if (!blob) return false;

      const fileObject = new File([blob], file.file_name, { type: 'application/pdf' });

      // Parse neu
      await this.parsePdfAsync(fileId, file.customer_id, fileObject);
      return true;
    } catch (error) {
      console.error('❌ Error reparsing file:', error);
      return false;
    }
  }

  /**
   * Datei-Statistiken für Kunden
   */
  async getFileStats(customerId: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
    totalSize: number;
    parsedPdfs: number;
  }> {
    try {
      const files = await this.getCustomerFiles(customerId);

      const stats = {
        total: files.length,
        byCategory: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        totalSize: files.reduce((sum, f) => sum + f.file_size, 0),
        parsedPdfs: files.filter((f) => f.is_parsed && f.file_type === 'pdf').length,
      };

      files.forEach((file) => {
        stats.byCategory[file.category] = (stats.byCategory[file.category] || 0) + 1;
        stats.byType[file.file_type] = (stats.byType[file.file_type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('❌ Error getting file stats:', error);
      return {
        total: 0,
        byCategory: {},
        byType: {},
        totalSize: 0,
        parsedPdfs: 0,
      };
    }
  }

  /**
   * Formatiere Dateigröße für Anzeige
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Validiere Datei vor Upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Maximale Größe: 50MB
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'Datei ist zu groß (max. 50MB)' };
    }

    // Erlaubte Dateitypen
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Dateityp nicht unterstützt' };
    }

    return { valid: true };
  }
}

export const customerFilesService = new CustomerFilesService();
