import { supabase } from '../config/supabase';

interface VisionAnalysisResult {
  room: string;
  items: Array<{
    name: string;
    quantity: number;
    volume: number;
    weight: number;
    category: string;
  }>;
  estimatedVolume: number;
  estimatedWeight: number;
  packingMaterial: {
    boxes: number;
    bubbleWrap: number;
    packingPaper: number;
  };
  specialHandling: string[];
  rawAnalysis?: string;
}

class VisionService {
  private apiKey: string | null = null;

  async initialize() {
    // Get OpenAI API key from Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('get-api-keys', {
        body: { service: 'openai' }
      });
      
      if (!error && data?.apiKey) {
        this.apiKey = data.apiKey;
      }
    } catch (error) {
      console.error('Failed to get OpenAI API key:', error);
    }
  }

  async analyzeImage(file: File): Promise<VisionAnalysisResult> {
    // Convert file to base64
    const base64 = await this.fileToBase64(file);
    
    try {
      // Call Supabase Edge Function for GPT-4 Vision analysis
      const { data, error } = await supabase.functions.invoke('analyze-room-image', {
        body: {
          image: base64,
          mimeType: file.type
        }
      });

      if (error) throw error;
      
      return this.processAnalysisResult(data);
    } catch (error) {
      console.error('Vision analysis failed:', error);
      throw new Error('Bildanalyse fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  private processAnalysisResult(rawData: any): VisionAnalysisResult {
    // Process the GPT-4 Vision response into structured data
    const analysis = rawData.analysis || {};
    
    return {
      room: analysis.room || 'Unbekannter Raum',
      items: this.extractItems(analysis),
      estimatedVolume: this.calculateTotalVolume(analysis.items || []),
      estimatedWeight: this.calculateTotalWeight(analysis.items || []),
      packingMaterial: this.estimatePackingMaterial(analysis.items || []),
      specialHandling: this.identifySpecialHandling(analysis.items || []),
      rawAnalysis: rawData.rawResponse
    };
  }

  private extractItems(analysis: any): VisionAnalysisResult['items'] {
    if (!analysis.items || !Array.isArray(analysis.items)) {
      return [];
    }

    return analysis.items.map((item: any) => ({
      name: item.name || 'Unbekannter Gegenstand',
      quantity: item.quantity || 1,
      volume: this.estimateVolume(item),
      weight: this.estimateWeight(item),
      category: item.category || 'Sonstiges'
    }));
  }

  private estimateVolume(item: any): number {
    // Volume estimation based on item type
    const volumeMap: Record<string, number> = {
      'Sofa': 2.5,
      'Bett': 3.0,
      'Schrank': 2.0,
      'Tisch': 1.0,
      'Stuhl': 0.3,
      'Fernseher': 0.2,
      'Kühlschrank': 1.5,
      'Waschmaschine': 0.8,
      'Kommode': 1.2,
      'Regal': 0.8,
      'Karton': 0.1
    };

    const baseVolume = volumeMap[item.name] || 0.5;
    return baseVolume * (item.quantity || 1);
  }

  private estimateWeight(item: any): number {
    // Weight estimation based on item type
    const weightMap: Record<string, number> = {
      'Sofa': 80,
      'Bett': 100,
      'Schrank': 120,
      'Tisch': 40,
      'Stuhl': 10,
      'Fernseher': 20,
      'Kühlschrank': 80,
      'Waschmaschine': 70,
      'Kommode': 60,
      'Regal': 30,
      'Karton': 15
    };

    const baseWeight = weightMap[item.name] || 20;
    return baseWeight * (item.quantity || 1);
  }

  private calculateTotalVolume(items: any[]): number {
    return items.reduce((total, item) => {
      return total + this.estimateVolume(item);
    }, 0);
  }

  private calculateTotalWeight(items: any[]): number {
    return items.reduce((total, item) => {
      return total + this.estimateWeight(item);
    }, 0);
  }

  private estimatePackingMaterial(items: any[]): VisionAnalysisResult['packingMaterial'] {
    const itemCount = items.reduce((total, item) => total + (item.quantity || 1), 0);
    
    return {
      boxes: Math.ceil(itemCount * 1.5),
      bubbleWrap: Math.ceil(itemCount * 2),
      packingPaper: Math.ceil(itemCount * 3)
    };
  }

  private identifySpecialHandling(items: any[]): string[] {
    const special: string[] = [];
    
    if (items.some(item => ['Fernseher', 'Computer', 'Monitor'].includes(item.name))) {
      special.push('Elektronische Geräte - Vorsichtig behandeln');
    }
    
    if (items.some(item => ['Glas', 'Spiegel', 'Geschirr'].includes(item.category))) {
      special.push('Zerbrechliche Gegenstände');
    }
    
    if (items.some(item => ['Klavier', 'Safe', 'Schrank'].includes(item.name))) {
      special.push('Schwere Möbel - Zusätzliche Träger erforderlich');
    }
    
    if (items.some(item => ['Pflanze', 'Aquarium'].includes(item.category))) {
      special.push('Lebende Objekte - Spezielle Behandlung');
    }
    
    return special;
  }
}

export const visionService = new VisionService();