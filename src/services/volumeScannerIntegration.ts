import { volumeScannerService } from './volumeScannerService';
import { quoteCalculationService, QuoteDetails } from './quoteCalculation';
import { ScannedItem, ScanSession, RoomScan } from '../types/volumeScanner';

export interface VolumeScannerQuoteData {
  totalVolume: number;
  itemCount: number;
  rooms: Array<{
    name: string;
    volume: number;
    itemCount: number;
  }>;
  specialItems: {
    pianos: number;
    heavyItems: number;
    fragileItems: number;
    disassemblyRequired: number;
  };
  recommendations: {
    packingService: boolean;
    packingMaterials: boolean;
    disassemblyService: boolean;
    protectionMaterials: boolean;
  };
  confidence: number;
}

class VolumeScannerIntegrationService {
  /**
   * Get scan data for a customer and convert it to quote details
   */
  async getCustomerScanData(customerId: string): Promise<VolumeScannerQuoteData | null> {
    try {
      // Get most recent scan session for customer
      const scans = await volumeScannerService.getCustomerScans(customerId);
      if (scans.length === 0) return null;

      // Get all items from customer scans
      const items = scans;

      return this.analyzeScanData(items);
    } catch (error) {
      console.error('Error getting customer scan data:', error);
      return null;
    }
  }

  /**
   * Analyze scanned items and create recommendations
   */
  private analyzeScanData(items: ScannedItem[]): VolumeScannerQuoteData {
    // Calculate totals
    const totalVolume = items.reduce((sum, item) => sum + item.volumeM3, 0);
    
    // Group by room
    const roomData = this.groupItemsByRoom(items);
    
    // Count special items
    const specialItems = {
      pianos: items.filter(item => 
        item.itemType === 'piano' || 
        item.customName?.toLowerCase().includes('klavier') ||
        item.customName?.toLowerCase().includes('flügel')
      ).length,
      
      heavyItems: items.filter(item => 
        item.weightEstimateKg && item.weightEstimateKg > 100
      ).length,
      
      fragileItems: items.filter(item => item.isFragile).length,
      
      disassemblyRequired: items.filter(item => item.requiresDisassembly).length
    };

    // Calculate average confidence
    const avgConfidence = items.length > 0
      ? items.reduce((sum, item) => sum + item.confidence, 0) / items.length
      : 0;

    // Generate recommendations
    const recommendations = {
      packingService: items.some(item => item.isFragile) || totalVolume > 20,
      packingMaterials: true, // Always recommend some materials
      disassemblyService: specialItems.disassemblyRequired > 0,
      protectionMaterials: specialItems.fragileItems > 0
    };

    return {
      totalVolume,
      itemCount: items.length,
      rooms: roomData,
      specialItems,
      recommendations,
      confidence: avgConfidence
    };
  }

  /**
   * Group items by room and calculate room statistics
   */
  private groupItemsByRoom(items: ScannedItem[]) {
    const rooms: Record<string, { volume: number; itemCount: number }> = {};
    
    items.forEach(item => {
      if (!rooms[item.roomName]) {
        rooms[item.roomName] = { volume: 0, itemCount: 0 };
      }
      rooms[item.roomName].volume += item.volumeM3;
      rooms[item.roomName].itemCount++;
    });

    return Object.entries(rooms).map(([name, data]) => ({
      name,
      volume: data.volume,
      itemCount: data.itemCount
    }));
  }

  /**
   * Convert scan data to quote details
   */
  convertToQuoteDetails(scanData: VolumeScannerQuoteData): Partial<QuoteDetails> {
    return {
      volume: Math.ceil(scanData.totalVolume), // Round up to next full m³
      packingRequested: scanData.recommendations.packingService,
      packingMaterials: scanData.recommendations.packingMaterials,
      pianoTransport: scanData.specialItems.pianos > 0,
      heavyItemsCount: scanData.specialItems.heavyItems,
      furnitureDisassemblyPrice: scanData.specialItems.disassemblyRequired * 50, // 50€ per item
      notes: this.generateNotes(scanData)
    };
  }

  /**
   * Generate helpful notes based on scan data
   */
  private generateNotes(scanData: VolumeScannerQuoteData): string {
    const notes: string[] = [];

    // Volume information
    notes.push(`Gescanntes Volumen: ${scanData.totalVolume.toFixed(2)} m³ (${scanData.itemCount} Gegenstände)`);
    
    // Room breakdown
    const roomInfo = scanData.rooms
      .map(room => `${this.getRoomName(room.name)}: ${room.volume.toFixed(1)} m³`)
      .join(', ');
    notes.push(`Räume: ${roomInfo}`);

    // Special items
    if (scanData.specialItems.pianos > 0) {
      notes.push(`⚠️ ${scanData.specialItems.pianos} Klavier(e) - Spezialtransport erforderlich`);
    }
    if (scanData.specialItems.fragileItems > 0) {
      notes.push(`⚠️ ${scanData.specialItems.fragileItems} zerbrechliche Gegenstände`);
    }
    if (scanData.specialItems.disassemblyRequired > 0) {
      notes.push(`🔧 ${scanData.specialItems.disassemblyRequired} Möbelstücke müssen demontiert werden`);
    }

    // Confidence note
    if (scanData.confidence < 0.8) {
      notes.push(`ℹ️ Scan-Genauigkeit: ${Math.round(scanData.confidence * 100)}% - Vor-Ort-Besichtigung empfohlen`);
    }

    return notes.join('\n');
  }

  /**
   * Get localized room name
   */
  private getRoomName(roomType: string): string {
    const roomNames: Record<string, string> = {
      living_room: 'Wohnzimmer',
      bedroom: 'Schlafzimmer',
      kitchen: 'Küche',
      bathroom: 'Bad',
      office: 'Büro',
      dining_room: 'Esszimmer',
      basement: 'Keller',
      attic: 'Dachboden',
      garage: 'Garage',
      other: 'Sonstiges'
    };
    return roomNames[roomType] || roomType;
  }

  /**
   * Calculate recommended services based on scan data
   */
  getRecommendedServices(scanData: VolumeScannerQuoteData): string[] {
    const services: string[] = [];

    if (scanData.recommendations.packingService) {
      services.push('packing');
    }
    if (scanData.recommendations.packingMaterials) {
      services.push('materials');
    }
    if (scanData.specialItems.pianos > 0) {
      services.push('piano');
    }
    if (scanData.specialItems.heavyItems > 0) {
      services.push('heavy');
    }
    if (scanData.specialItems.disassemblyRequired > 0) {
      services.push('disassembly');
    }

    return services;
  }

  /**
   * Validate scan data quality
   */
  validateScanQuality(scanData: VolumeScannerQuoteData): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check minimum requirements
    if (scanData.itemCount === 0) {
      warnings.push('Keine Gegenstände gescannt');
    }
    if (scanData.totalVolume < 1) {
      warnings.push('Sehr geringes Volumen - bitte überprüfen');
    }
    if (scanData.confidence < 0.6) {
      warnings.push('Niedrige Scan-Genauigkeit - manuelle Überprüfung empfohlen');
    }
    if (scanData.rooms.length === 0) {
      warnings.push('Keine Räume erfasst');
    }

    // Check for suspicious data
    const avgVolumePerItem = scanData.totalVolume / scanData.itemCount;
    if (avgVolumePerItem > 2) {
      warnings.push('Ungewöhnlich hohes Durchschnittsvolumen pro Gegenstand');
    }
    if (avgVolumePerItem < 0.01) {
      warnings.push('Ungewöhnlich niedriges Durchschnittsvolumen pro Gegenstand');
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }
}

export const volumeScannerIntegration = new VolumeScannerIntegrationService();