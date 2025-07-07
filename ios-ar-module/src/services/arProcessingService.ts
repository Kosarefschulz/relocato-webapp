import { NativeModules, Platform } from 'react-native';
import { ARPoint, FurnitureDetection } from '../types/ar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { ARKitManager } = NativeModules;

export class ARProcessingService {
  static async checkLiDARSupport(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    
    try {
      // Check device model for LiDAR support (iPhone 12 Pro and later)
      const deviceModel = await this.getDeviceModel();
      const lidarModels = [
        'iPhone12,3', 'iPhone12,5', // iPhone 12 Pro, Pro Max
        'iPhone13,3', 'iPhone13,4', // iPhone 13 Pro, Pro Max
        'iPhone14,2', 'iPhone14,3', // iPhone 14 Pro, Pro Max
        'iPhone15,2', 'iPhone15,3', // iPhone 15 Pro, Pro Max
      ];
      
      return lidarModels.some(model => deviceModel.includes(model));
    } catch (error) {
      console.error('Error checking LiDAR support:', error);
      return false;
    }
  }

  static async getDeviceModel(): Promise<string> {
    try {
      if (ARKitManager && ARKitManager.getDeviceModel) {
        return await ARKitManager.getDeviceModel();
      }
      return 'Unknown';
    } catch (error) {
      console.error('Error getting device model:', error);
      return 'Unknown';
    }
  }

  static async hitTest(touchPoint: { x: number; y: number }): Promise<ARPoint | null> {
    try {
      if (ARKitManager && ARKitManager.hitTest) {
        const results = await ARKitManager.hitTest(touchPoint);
        if (results && results.length > 0) {
          const hit = results[0];
          return {
            x: hit.worldTransform[12],
            y: hit.worldTransform[13],
            z: hit.worldTransform[14],
            screenX: touchPoint.x,
            screenY: touchPoint.y
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Hit test error:', error);
      return null;
    }
  }

  static calculateDistance(point1: ARPoint, point2: ARPoint): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) * 100; // Convert to cm
  }

  static calculateArea(points: ARPoint[]): number {
    if (points.length < 3) return 0;
    
    // Simplified area calculation using shoelace formula
    // Assuming points are coplanar
    let area = 0;
    const n = points.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].z;
      area -= points[j].x * points[i].z;
    }
    
    return Math.abs(area / 2);
  }

  static calculateVolume(boundingBox: { width: number; height: number; depth: number }): number {
    return boundingBox.width * boundingBox.height * boundingBox.depth;
  }

  static async captureFrame(): Promise<string> {
    try {
      if (ARKitManager && ARKitManager.captureFrame) {
        const imageData = await ARKitManager.captureFrame();
        return imageData;
      }
      throw new Error('Frame capture not available');
    } catch (error) {
      console.error('Frame capture error:', error);
      throw error;
    }
  }

  static async getDepthData(): Promise<any> {
    try {
      if (ARKitManager && ARKitManager.getDepthData) {
        const depthData = await ARKitManager.getDepthData();
        return depthData;
      }
      return null;
    } catch (error) {
      console.error('Depth data error:', error);
      return null;
    }
  }

  static async analyzeFurniture(
    imageData: string,
    depthData: any
  ): Promise<FurnitureDetection | null> {
    try {
      // In production, this would send to a ML model
      // For now, we'll use mock detection with depth-based volume estimation
      
      if (depthData) {
        // Use depth data for more accurate volume estimation
        const boundingBox = this.estimateBoundingBoxFromDepth(depthData);
        
        return {
          id: `detection_${Date.now()}`,
          type: 'furniture_unknown',
          boundingBox: {
            center: { x: 0, y: 0, z: 0 },
            size: boundingBox
          },
          confidence: 0.75,
          volume: this.calculateVolume(boundingBox),
          imageUrl: imageData
        };
      }
      
      // Fallback to image-only detection
      return {
        id: `detection_${Date.now()}`,
        type: 'furniture_unknown',
        boundingBox: {
          center: { x: 0, y: 0, z: 0 },
          size: { width: 0.5, height: 0.5, depth: 0.5 }
        },
        confidence: 0.5,
        volume: 0.125,
        imageUrl: imageData
      };
    } catch (error) {
      console.error('Furniture analysis error:', error);
      return null;
    }
  }

  static estimateBoundingBoxFromDepth(depthData: any): { width: number; height: number; depth: number } {
    // Simplified depth-based bounding box estimation
    // In production, this would use advanced point cloud processing
    
    try {
      const depthPoints = depthData.points || [];
      if (depthPoints.length === 0) {
        return { width: 0.5, height: 0.5, depth: 0.5 };
      }
      
      // Find min/max bounds
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      
      depthPoints.forEach((point: any) => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
        minZ = Math.min(minZ, point.z);
        maxZ = Math.max(maxZ, point.z);
      });
      
      return {
        width: maxX - minX,
        height: maxY - minY,
        depth: maxZ - minZ
      };
    } catch (error) {
      console.error('Bounding box estimation error:', error);
      return { width: 0.5, height: 0.5, depth: 0.5 };
    }
  }

  static async saveSessionLocally(sessionData: any): Promise<void> {
    try {
      const key = `ar_session_${sessionData.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  static async loadSessionLocally(sessionId: string): Promise<any> {
    try {
      const key = `ar_session_${sessionId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading session:', error);
      return null;
    }
  }

  static async clearLocalSessions(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sessionKeys = keys.filter(key => key.startsWith('ar_session_'));
      await AsyncStorage.multiRemove(sessionKeys);
    } catch (error) {
      console.error('Error clearing sessions:', error);
    }
  }
}