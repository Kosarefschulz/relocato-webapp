import { supabase } from '../config/supabase';
import { ScannedItem, ScanSession, ScanPhoto } from '../types/volumeScanner';
import { googleVisionService, mockGoogleVisionService } from './googleVisionService';

class VolumeScannerService {
  // Upload photos to Supabase Storage
  async uploadPhotos(files: File[], itemId: string): Promise<string[]> {
    const urls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `scans/${itemId}/photo_${Date.now()}_${i}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('furniture-scans')
        .upload(fileName, file, {
          contentType: 'image/jpeg',
          upsert: false
        });
      
      if (error) {
        console.error('Error uploading photo:', error);
        continue;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('furniture-scans')
        .getPublicUrl(fileName);
      
      urls.push(publicUrl);
    }
    
    return urls;
  }

  // Save scan session
  async saveSession(session: ScanSession): Promise<void> {
    const { error } = await supabase
      .from('scan_sessions')
      .insert({
        id: session.id,
        customer_id: session.customerId,
        employee_id: session.employeeId,
        start_time: session.startTime,
        end_time: session.endTime,
        total_volume_m3: session.totalVolumeM3,
        item_count: session.itemCount,
        scan_quality_score: session.scanQualityScore,
        device_info: session.deviceInfo,
        location: session.location
      });
    
    if (error) {
      console.error('Error saving scan session:', error);
      throw error;
    }
  }

  // Save scanned item
  async saveScannedItem(item: ScannedItem): Promise<void> {
    const { error } = await supabase
      .from('scanned_furniture')
      .insert({
        id: item.id,
        session_id: item.sessionId,
        customer_id: item.customerId,
        furniture_type: item.itemType,
        custom_name: item.customName,
        room_name: item.roomName,
        length_cm: item.dimensions.length,
        width_cm: item.dimensions.width,
        height_cm: item.dimensions.height,
        volume_m3: item.volumeM3,
        weight_estimate_kg: item.weightEstimateKg,
        scan_method: item.scanMethod,
        confidence_score: item.confidence,
        is_fragile: item.isFragile,
        requires_disassembly: item.requiresDisassembly,
        packing_materials: item.packingMaterials,
        special_instructions: item.specialInstructions,
        photos: item.photos
      });
    
    if (error) {
      console.error('Error saving scanned item:', error);
      throw error;
    }
  }

  // Get all scanned items for a customer
  async getCustomerScans(customerId: string): Promise<ScannedItem[]> {
    const { data, error } = await supabase
      .from('scanned_furniture')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching customer scans:', error);
      throw error;
    }
    
    return data.map(this.mapScannedItem);
  }

  // Get scan session details
  async getSession(sessionId: string): Promise<ScanSession | null> {
    const { data, error } = await supabase
      .from('scan_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) {
      console.error('Error fetching scan session:', error);
      return null;
    }
    
    return this.mapScanSession(data);
  }

  // Calculate total volume for a customer
  async calculateCustomerVolume(customerId: string): Promise<number> {
    const items = await this.getCustomerScans(customerId);
    return items.reduce((total, item) => total + item.volumeM3, 0);
  }

  // AI-powered furniture detection using Google Vision API
  async detectFurnitureFromImage(imageFile: File): Promise<{
    type: string;
    confidence: number;
    suggestedDimensions?: { length: number; width: number; height: number };
  }> {
    try {
      // Use real API if configured, otherwise use mock
      const visionService = googleVisionService.isConfigured() 
        ? googleVisionService 
        : mockGoogleVisionService;
      
      // Detect furniture in image
      const detection = await visionService.detectFurniture(imageFile);
      
      if (!detection.furnitureType) {
        return {
          type: 'other',
          confidence: 0.5
        };
      }
      
      // Get the highest confidence detection
      const bestDetection = detection.detections[0];
      
      // Estimate dimensions if we have bounds
      let suggestedDimensions;
      if (bestDetection?.bounds) {
        const dimensionEstimate = await visionService.estimateDimensions(
          imageFile, 
          bestDetection.bounds
        );
        suggestedDimensions = dimensionEstimate.dimensions;
      }
      
      return {
        type: detection.furnitureType,
        confidence: bestDetection?.confidence || 0.5,
        suggestedDimensions
      };
      
    } catch (error) {
      console.error('AI detection error:', error);
      // Fallback to basic detection
      return {
        type: 'other',
        confidence: 0.3
      };
    }
  }

  // Map database record to ScannedItem
  private mapScannedItem(record: any): ScannedItem {
    return {
      id: record.id,
      customerId: record.customer_id,
      sessionId: record.session_id,
      itemType: record.furniture_type,
      customName: record.custom_name,
      roomName: record.room_name,
      dimensions: {
        length: record.length_cm,
        width: record.width_cm,
        height: record.height_cm
      },
      volumeM3: record.volume_m3,
      weightEstimateKg: record.weight_estimate_kg,
      scanMethod: record.scan_method,
      confidence: record.confidence_score,
      photos: record.photos || [],
      isFragile: record.is_fragile,
      requiresDisassembly: record.requires_disassembly,
      packingMaterials: record.packing_materials || [],
      specialInstructions: record.special_instructions,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    };
  }

  // Map database record to ScanSession
  private mapScanSession(record: any): ScanSession {
    return {
      id: record.id,
      customerId: record.customer_id,
      employeeId: record.employee_id,
      startTime: new Date(record.start_time),
      endTime: record.end_time ? new Date(record.end_time) : undefined,
      totalVolumeM3: record.total_volume_m3,
      itemCount: record.item_count,
      scanQualityScore: record.scan_quality_score,
      deviceInfo: record.device_info,
      location: record.location
    };
  }
}

export const volumeScannerService = new VolumeScannerService();