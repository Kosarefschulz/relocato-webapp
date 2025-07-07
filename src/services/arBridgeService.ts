import { ARSession, ARMeasurement, FurnitureDetection } from '../types/volumeScanner';

export interface ARCapabilities {
  available: boolean;
  platform: 'ios' | 'android' | 'web';
  hasLiDAR?: boolean;
  arKitVersion?: string;
}

export interface ARBridgeMessage {
  type: 'measurement' | 'detection' | 'session' | 'error' | 'capabilities' | 'ar_ready';
  data: any;
  timestamp: string;
}

class ARBridgeService {
  private capabilities: ARCapabilities | null = null;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private isReady = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Listen for messages from React Native
    window.addEventListener('message', this.handleMessage.bind(this));
    
    // Check if running in React Native WebView
    if ((window as any).ReactNativeWebView) {
      console.log('AR Bridge: Running in React Native WebView');
      this.waitForARReady();
    } else {
      console.log('AR Bridge: Running in browser');
      this.capabilities = {
        available: false,
        platform: 'web'
      };
    }
  }

  private waitForARReady() {
    // Wait for AR module to be ready
    const checkInterval = setInterval(() => {
      if ((window as any).ARCapabilities) {
        clearInterval(checkInterval);
        this.capabilities = (window as any).ARCapabilities;
        this.isReady = true;
        this.emit('ar_ready', this.capabilities);
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!this.isReady) {
        console.warn('AR Bridge: Timeout waiting for AR module');
        this.capabilities = {
          available: false,
          platform: 'ios'
        };
      }
    }, 5000);
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message = event.data as ARBridgeMessage;
      if (message.type) {
        console.log('AR Bridge: Received message', message.type);
        this.emit(message.type, message.data);
      }
    } catch (error) {
      console.error('AR Bridge: Error handling message', error);
    }
  }

  on(event: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: (data: any) => void) {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  getCapabilities(): ARCapabilities | null {
    return this.capabilities;
  }

  isARAvailable(): boolean {
    return this.capabilities?.available || false;
  }

  async startARScan(sessionId: string, roomName: string): Promise<void> {
    if (!this.isARAvailable()) {
      throw new Error('AR not available');
    }

    if ((window as any).ARCapabilities?.startARScan) {
      (window as any).ARCapabilities.startARScan(sessionId, roomName);
    } else {
      throw new Error('AR scan function not available');
    }
  }

  // Convert AR session data to volume scanner format
  convertARSession(arSession: any): Partial<ARSession> {
    return {
      measurements: arSession.measurements || [],
      detections: arSession.detections || [],
      roomDimensions: arSession.roomDimensions,
      capturedImages: arSession.capturedImages || []
    };
  }

  // Convert AR measurement to furniture item
  convertMeasurementToFurniture(measurement: ARMeasurement): any {
    const volume = measurement.type === 'volume' 
      ? measurement.value 
      : measurement.value * 0.1; // Rough estimate for area measurements

    return {
      id: measurement.id,
      name: `Messung ${measurement.type}`,
      type: 'custom',
      dimensions: {
        length: measurement.value,
        width: 1,
        height: 1
      },
      volume: volume,
      weight: volume * 100, // Rough weight estimate
      quantity: 1,
      notes: `AR ${measurement.type} measurement`,
      confidence: measurement.confidence
    };
  }

  // Convert AR detection to furniture item
  convertDetectionToFurniture(detection: FurnitureDetection): any {
    return {
      id: detection.id,
      name: detection.type || 'Unbekanntes Möbelstück',
      type: detection.type || 'custom',
      dimensions: detection.boundingBox.size,
      volume: detection.volume,
      weight: detection.volume * 100, // Rough weight estimate
      quantity: 1,
      imageUrl: detection.imageUrl,
      confidence: detection.confidence,
      notes: `AR-erkannt mit ${Math.round(detection.confidence * 100)}% Genauigkeit`
    };
  }
}

export const arBridgeService = new ARBridgeService();