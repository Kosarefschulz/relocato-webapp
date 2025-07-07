export interface ARMeasurement {
  id: string;
  type: 'distance' | 'area' | 'volume';
  points: ARPoint[];
  value: number;
  unit: 'cm' | 'm';
  confidence: number;
  timestamp: Date;
}

export interface ARPoint {
  x: number;
  y: number;
  z: number;
  screenX?: number;
  screenY?: number;
}

export interface ARPlane {
  id: string;
  type: 'horizontal' | 'vertical';
  center: ARPoint;
  extent: { width: number; height: number };
  transform: number[];
}

export interface ARSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  measurements: ARMeasurement[];
  detectedPlanes: ARPlane[];
  roomDimensions?: {
    length: number;
    width: number;
    height: number;
  };
  capturedImages: string[];
}

export interface FurnitureDetection {
  id: string;
  type: string;
  boundingBox: {
    center: ARPoint;
    size: { width: number; height: number; depth: number };
  };
  confidence: number;
  volume: number;
  imageUrl?: string;
}

export interface ARCapabilities {
  hasARKit: boolean;
  hasLiDAR: boolean;
  arKitVersion: string;
  deviceModel: string;
}

export interface WebBridgeMessage {
  type: 'measurement' | 'detection' | 'session' | 'error' | 'capabilities';
  data: any;
  timestamp: string;
}