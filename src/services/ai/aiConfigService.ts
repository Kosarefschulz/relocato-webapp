import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import CryptoJS from 'crypto-js';

export interface AIConfig {
  apiKey: string;
  model: string;
  enabled: boolean;
  maxTokens: number;
  temperature: number;
  allowedUsers?: string[];
  features: {
    quoteGeneration: boolean;
    invoiceGeneration: boolean;
    emailAutomation: boolean;
    customerSearch: boolean;
    priceCalculation: boolean;
  };
}

class AIConfigService {
  private configCache: AIConfig | null = null;
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.REACT_APP_ENCRYPTION_KEY || 'umzugsapp-ai-2024';
  }

  async getConfig(): Promise<AIConfig | null> {
    if (this.configCache) {
      return this.configCache;
    }

    try {
      const configDoc = await getDoc(doc(db, 'settings', 'ai_config'));
      
      if (!configDoc.exists()) {
        return null;
      }

      const data = configDoc.data();
      
      const decryptedApiKey = this.decrypt(data.encryptedApiKey);
      
      this.configCache = {
        apiKey: decryptedApiKey,
        model: data.model || 'gpt-4o',
        enabled: data.enabled || false,
        maxTokens: data.maxTokens || 2000,
        temperature: data.temperature || 0.7,
        allowedUsers: data.allowedUsers || [],
        features: data.features || {
          quoteGeneration: true,
          invoiceGeneration: true,
          emailAutomation: true,
          customerSearch: true,
          priceCalculation: true
        }
      };

      return this.configCache;
    } catch (error) {
      console.error('Error fetching AI config:', error);
      return null;
    }
  }

  async saveConfig(config: AIConfig): Promise<void> {
    try {
      const encryptedApiKey = this.encrypt(config.apiKey);
      
      const dataToSave = {
        encryptedApiKey,
        model: config.model,
        enabled: config.enabled,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        allowedUsers: config.allowedUsers || [],
        features: config.features,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'settings', 'ai_config'), dataToSave);
      
      this.configCache = config;
    } catch (error) {
      console.error('Error saving AI config:', error);
      throw error;
    }
  }

  async updateApiKey(apiKey: string): Promise<void> {
    const config = await this.getConfig();
    if (!config) {
      throw new Error('No AI configuration found');
    }

    config.apiKey = apiKey;
    await this.saveConfig(config);
  }

  async toggleFeature(feature: keyof AIConfig['features'], enabled: boolean): Promise<void> {
    const config = await this.getConfig();
    if (!config) {
      throw new Error('No AI configuration found');
    }

    config.features[feature] = enabled;
    await this.saveConfig(config);
  }

  async isUserAllowed(userId: string): Promise<boolean> {
    const config = await this.getConfig();
    if (!config || !config.enabled) {
      return false;
    }

    if (!config.allowedUsers || config.allowedUsers.length === 0) {
      return true;
    }

    return config.allowedUsers.includes(userId);
  }

  async isFeatureEnabled(feature: keyof AIConfig['features']): Promise<boolean> {
    const config = await this.getConfig();
    if (!config || !config.enabled) {
      return false;
    }

    return config.features[feature] || false;
  }

  private encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
  }

  private decrypt(encryptedText: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  clearCache(): void {
    this.configCache = null;
  }

  async getDefaultConfig(): Promise<Partial<AIConfig>> {
    return {
      model: 'gpt-4o',
      enabled: false,
      maxTokens: 2000,
      temperature: 0.7,
      features: {
        quoteGeneration: true,
        invoiceGeneration: true,
        emailAutomation: true,
        customerSearch: true,
        priceCalculation: true
      }
    };
  }
}

export const aiConfigService = new AIConfigService();