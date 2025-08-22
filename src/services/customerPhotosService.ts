import { supabase } from '../config/supabase';

export interface CustomerPhoto {
  id: string;
  customer_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  url: string;
  thumbnail_url?: string;
  uploaded_at: string;
  uploaded_by?: string;
  description?: string;
  tags?: string[];
}

class CustomerPhotosService {
  private bucketName = 'customer-photos';

  async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      
      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(this.bucketName, {
          public: false,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic']
        });
        
        if (error && !error.message.includes('already exists')) {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
    }
  }

  async uploadPhoto(
    customerId: string,
    file: File,
    description?: string,
    tags?: string[]
  ): Promise<CustomerPhoto> {
    await this.ensureBucketExists();
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${customerId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(this.bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);

    // Save metadata to database
    const photoData = {
      customer_id: customerId,
      file_name: file.name,
      file_path: fileName,
      file_size: file.size,
      mime_type: file.type,
      url: urlData.publicUrl,
      description,
      tags,
      uploaded_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('customer_photos')
      .insert([photoData])
      .select()
      .single();

    if (error) {
      // If database insert fails, delete the uploaded file
      await supabase.storage.from(this.bucketName).remove([fileName]);
      throw error;
    }

    return data;
  }

  async getCustomerPhotos(customerId: string): Promise<CustomerPhoto[]> {
    const { data, error } = await supabase
      .from('customer_photos')
      .select('*')
      .eq('customer_id', customerId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  async deletePhoto(photoId: string): Promise<void> {
    // Get photo details first
    const { data: photo, error: fetchError } = await supabase
      .from('customer_photos')
      .select('file_path')
      .eq('id', photoId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!photo) {
      throw new Error('Photo not found');
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(this.bucketName)
      .remove([photo.file_path]);

    if (storageError) {
      throw storageError;
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('customer_photos')
      .delete()
      .eq('id', photoId);

    if (dbError) {
      throw dbError;
    }
  }

  async updatePhotoDetails(
    photoId: string,
    description?: string,
    tags?: string[]
  ): Promise<CustomerPhoto> {
    const updateData: any = {};
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;

    const { data, error } = await supabase
      .from('customer_photos')
      .update(updateData)
      .eq('id', photoId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async downloadPhoto(photoId: string): Promise<Blob> {
    const { data: photo, error: fetchError } = await supabase
      .from('customer_photos')
      .select('file_path')
      .eq('id', photoId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!photo) {
      throw new Error('Photo not found');
    }

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .download(photo.file_path);

    if (error) {
      throw error;
    }

    return data;
  }
}

export const customerPhotosService = new CustomerPhotosService();