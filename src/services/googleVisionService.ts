// Google Vision API Service for furniture detection
// This service uses the REST API directly - no SDK needed

interface VisionResponse {
  responses: Array<{
    localizedObjectAnnotations?: Array<{
      name: string;
      score: number;
      boundingPoly: {
        normalizedVertices: Array<{
          x: number;
          y: number;
        }>;
      };
    }>;
    error?: {
      code: number;
      message: string;
    };
  }>;
}

class GoogleVisionService {
  private apiKey: string;
  private apiUrl = 'https://vision.googleapis.com/v1/images:annotate';

  constructor() {
    // Get API key from environment variable
    this.apiKey = process.env.REACT_APP_GOOGLE_VISION_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Google Vision API key not configured. AI detection will be limited.');
    }
  }

  // Detect objects in an image
  async detectFurniture(imageFile: File): Promise<{
    detections: Array<{
      name: string;
      confidence: number;
      bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
    furnitureType?: string;
    error?: string;
  }> {
    try {
      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      // Prepare request
      const requestBody = {
        requests: [{
          image: {
            content: base64Image.split(',')[1] // Remove data:image/jpeg;base64, prefix
          },
          features: [
            {
              type: 'OBJECT_LOCALIZATION',
              maxResults: 10
            },
            {
              type: 'LABEL_DETECTION',
              maxResults: 10
            }
          ]
        }]
      };

      // Make API request
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data: VisionResponse = await response.json();
      
      if (data.responses[0]?.error) {
        throw new Error(data.responses[0].error.message);
      }

      // Process detections
      const detections = data.responses[0]?.localizedObjectAnnotations || [];
      
      // Map to our format
      const mappedDetections = detections.map(detection => {
        const vertices = detection.boundingPoly.normalizedVertices;
        const minX = Math.min(...vertices.map(v => v.x));
        const maxX = Math.max(...vertices.map(v => v.x));
        const minY = Math.min(...vertices.map(v => v.y));
        const maxY = Math.max(...vertices.map(v => v.y));
        
        return {
          name: detection.name,
          confidence: detection.score,
          bounds: {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
          }
        };
      });

      // Try to identify furniture type
      const furnitureType = this.identifyFurnitureType(mappedDetections);

      return {
        detections: mappedDetections,
        furnitureType
      };

    } catch (error) {
      console.error('Google Vision API error:', error);
      
      // Fallback to basic detection
      return {
        detections: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Identify specific furniture type from detections
  private identifyFurnitureType(detections: Array<{ name: string; confidence: number }>): string | undefined {
    // Mapping of Google Vision labels to our furniture types
    const furnitureMapping: Record<string, string> = {
      'couch': 'sofa',
      'sofa': 'sofa',
      'bed': 'bed',
      'chair': 'chair',
      'table': 'table',
      'desk': 'desk',
      'wardrobe': 'wardrobe',
      'dresser': 'dresser',
      'cabinet': 'wardrobe',
      'bookshelf': 'bookshelf',
      'shelf': 'bookshelf',
      'television': 'tv_stand',
      'tv': 'tv_stand',
      'refrigerator': 'refrigerator',
      'washing machine': 'washing_machine',
      'dishwasher': 'dishwasher',
      'stove': 'stove',
      'piano': 'piano',
      'box': 'box',
      'cardboard': 'box'
    };

    // Find the highest confidence furniture match
    for (const detection of detections) {
      const lowerName = detection.name.toLowerCase();
      for (const [key, value] of Object.entries(furnitureMapping)) {
        if (lowerName.includes(key)) {
          return value;
        }
      }
    }

    // Check if it's furniture at all
    const furnitureKeywords = ['furniture', 'home', 'living', 'room'];
    for (const detection of detections) {
      const lowerName = detection.name.toLowerCase();
      if (furnitureKeywords.some(keyword => lowerName.includes(keyword))) {
        return 'other';
      }
    }

    return undefined;
  }

  // Estimate dimensions based on object detection and image analysis
  async estimateDimensions(imageFile: File, objectBounds: { x: number; y: number; width: number; height: number }): Promise<{
    estimated: boolean;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    confidence: number;
  }> {
    // This is a simplified estimation
    // In a real implementation, you would:
    // 1. Use reference objects (like a door frame) for scale
    // 2. Apply perspective correction
    // 3. Use ML models trained on furniture dimensions
    
    // For now, return typical dimensions based on object type
    return {
      estimated: true,
      dimensions: {
        length: 200, // Default 2m length
        width: 90,   // Default 90cm width
        height: 85   // Default 85cm height
      },
      confidence: 0.6 // Lower confidence for estimation
    };
  }

  // Convert file to base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  // Check if API is configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const googleVisionService = new GoogleVisionService();

// Export mock service for development
export const mockGoogleVisionService = {
  async detectFurniture(imageFile: File) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock detection
    return {
      detections: [
        {
          name: 'Sofa',
          confidence: 0.92,
          bounds: {
            x: 0.1,
            y: 0.2,
            width: 0.8,
            height: 0.6
          }
        }
      ],
      furnitureType: 'sofa'
    };
  },
  
  async estimateDimensions() {
    return {
      estimated: true,
      dimensions: {
        length: 200,
        width: 90,
        height: 85
      },
      confidence: 0.85
    };
  },
  
  isConfigured() {
    return true;
  }
};