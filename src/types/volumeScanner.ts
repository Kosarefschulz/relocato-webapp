// Types for Volume Scanner Feature

export interface ScannedItem {
  id: string;
  customerId: string;
  sessionId: string;
  
  // Item details
  itemType: FurnitureType;
  customName?: string;
  roomName: string;
  
  // Dimensions
  dimensions: {
    length: number; // cm
    width: number;  // cm
    height: number; // cm
  };
  volumeM3: number;
  weightEstimateKg?: number;
  
  // Scan metadata
  scanMethod: 'photo' | 'manual' | 'ar';
  confidence: number; // 0-1
  photos: ScanPhoto[];
  
  // Additional info
  isFragile: boolean;
  requiresDisassembly: boolean;
  packingMaterials: string[];
  specialInstructions?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ScanPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  angle?: 'front' | 'side' | 'top' | 'perspective';
  timestamp: Date;
}

export interface ScanSession {
  id: string;
  customerId: string;
  employeeId?: string;
  
  startTime: Date;
  endTime?: Date;
  
  totalVolumeM3: number;
  itemCount: number;
  scanQualityScore: number;
  
  deviceInfo?: {
    model: string;
    os: string;
    hasARSupport: boolean;
  };
  
  location?: {
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

export interface RoomScan {
  id: string;
  sessionId: string;
  roomType: RoomType;
  roomName?: string;
  
  floorAreaM2?: number;
  ceilingHeightM?: number;
  
  accessInfo?: {
    doorWidthCm?: number;
    hasElevator?: boolean;
    floorNumber?: number;
    stairsInfo?: string;
  };
  
  items: ScannedItem[];
  photos: ScanPhoto[];
}

export type FurnitureType = 
  | 'sofa'
  | 'bed'
  | 'wardrobe'
  | 'table'
  | 'chair'
  | 'desk'
  | 'dresser'
  | 'bookshelf'
  | 'tv_stand'
  | 'refrigerator'
  | 'washing_machine'
  | 'dishwasher'
  | 'stove'
  | 'piano'
  | 'box'
  | 'other';

export type RoomType =
  | 'living_room'
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'office'
  | 'dining_room'
  | 'basement'
  | 'attic'
  | 'garage'
  | 'other';

// Standard furniture dimensions database
export const FURNITURE_DIMENSIONS: Record<FurnitureType, {
  name: string;
  averageDimensions: { length: number; width: number; height: number };
  weightKg: number;
  variations?: Array<{
    subtype: string;
    dimensions: { length: number; width: number; height: number };
    weightKg: number;
  }>;
}> = {
  sofa: {
    name: 'Sofa',
    averageDimensions: { length: 200, width: 90, height: 85 },
    weightKg: 80,
    variations: [
      { subtype: '2-Sitzer', dimensions: { length: 160, width: 90, height: 85 }, weightKg: 60 },
      { subtype: '3-Sitzer', dimensions: { length: 220, width: 90, height: 85 }, weightKg: 90 },
      { subtype: 'Ecksofa', dimensions: { length: 250, width: 180, height: 85 }, weightKg: 150 }
    ]
  },
  bed: {
    name: 'Bett',
    averageDimensions: { length: 200, width: 160, height: 100 },
    weightKg: 100,
    variations: [
      { subtype: 'Einzelbett', dimensions: { length: 200, width: 90, height: 100 }, weightKg: 50 },
      { subtype: 'Doppelbett', dimensions: { length: 200, width: 160, height: 100 }, weightKg: 100 },
      { subtype: 'King Size', dimensions: { length: 200, width: 180, height: 100 }, weightKg: 120 }
    ]
  },
  wardrobe: {
    name: 'Kleiderschrank',
    averageDimensions: { length: 150, width: 60, height: 220 },
    weightKg: 120,
    variations: [
      { subtype: '2-Türig', dimensions: { length: 100, width: 60, height: 220 }, weightKg: 80 },
      { subtype: '3-Türig', dimensions: { length: 150, width: 60, height: 220 }, weightKg: 120 },
      { subtype: '4-Türig', dimensions: { length: 200, width: 60, height: 220 }, weightKg: 160 }
    ]
  },
  table: {
    name: 'Tisch',
    averageDimensions: { length: 140, width: 80, height: 75 },
    weightKg: 40,
    variations: [
      { subtype: 'Esstisch klein', dimensions: { length: 120, width: 80, height: 75 }, weightKg: 30 },
      { subtype: 'Esstisch groß', dimensions: { length: 180, width: 90, height: 75 }, weightKg: 50 },
      { subtype: 'Couchtisch', dimensions: { length: 120, width: 60, height: 45 }, weightKg: 25 }
    ]
  },
  chair: {
    name: 'Stuhl',
    averageDimensions: { length: 45, width: 45, height: 85 },
    weightKg: 8
  },
  desk: {
    name: 'Schreibtisch',
    averageDimensions: { length: 140, width: 70, height: 75 },
    weightKg: 35
  },
  dresser: {
    name: 'Kommode',
    averageDimensions: { length: 100, width: 45, height: 85 },
    weightKg: 50
  },
  bookshelf: {
    name: 'Bücherregal',
    averageDimensions: { length: 80, width: 30, height: 180 },
    weightKg: 40
  },
  tv_stand: {
    name: 'TV-Möbel',
    averageDimensions: { length: 140, width: 40, height: 50 },
    weightKg: 30
  },
  refrigerator: {
    name: 'Kühlschrank',
    averageDimensions: { length: 60, width: 65, height: 180 },
    weightKg: 80
  },
  washing_machine: {
    name: 'Waschmaschine',
    averageDimensions: { length: 60, width: 60, height: 85 },
    weightKg: 70
  },
  dishwasher: {
    name: 'Geschirrspüler',
    averageDimensions: { length: 60, width: 60, height: 85 },
    weightKg: 45
  },
  stove: {
    name: 'Herd',
    averageDimensions: { length: 60, width: 60, height: 85 },
    weightKg: 50
  },
  piano: {
    name: 'Klavier',
    averageDimensions: { length: 150, width: 60, height: 125 },
    weightKg: 250,
    variations: [
      { subtype: 'Flügel', dimensions: { length: 180, width: 150, height: 100 }, weightKg: 350 },
      { subtype: 'E-Piano', dimensions: { length: 140, width: 40, height: 80 }, weightKg: 40 }
    ]
  },
  box: {
    name: 'Umzugskarton',
    averageDimensions: { length: 60, width: 40, height: 40 },
    weightKg: 15
  },
  other: {
    name: 'Sonstiges',
    averageDimensions: { length: 100, width: 60, height: 60 },
    weightKg: 30
  }
};

// Helper functions
export const calculateVolume = (dimensions: { length: number; width: number; height: number }): number => {
  return (dimensions.length * dimensions.width * dimensions.height) / 1000000; // Convert cm³ to m³
};

export const estimateWeight = (type: FurnitureType, volume: number): number => {
  const standardItem = FURNITURE_DIMENSIONS[type];
  const standardVolume = calculateVolume(standardItem.averageDimensions);
  const weightPerM3 = standardItem.weightKg / standardVolume;
  return Math.round(volume * weightPerM3);
};