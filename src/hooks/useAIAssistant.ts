import { useState, useEffect, useCallback } from 'react';
import { AIAssistantService, AIAction } from '../services/ai/aiAssistantService';
import { aiConfigService, AIConfig } from '../services/ai/aiConfigService';
import { useAuth } from '../contexts/AuthContext';

export interface UseAIAssistantReturn {
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  processCommand: (command: string) => Promise<any>;
  executeAction: (action: AIAction) => Promise<any>;
  checkFeature: (feature: keyof AIConfig['features']) => Promise<boolean>;
  config: AIConfig | null;
  refreshConfig: () => Promise<void>;
}

export const useAIAssistant = (): UseAIAssistantReturn => {
  const [aiService, setAiService] = useState<AIAssistantService | null>(null);
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const initializeService = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const aiConfig = await aiConfigService.getConfig();
      
      if (!aiConfig || !aiConfig.enabled) {
        setAiService(null);
        setConfig(null);
        return;
      }

      const isAllowed = await aiConfigService.isUserAllowed(user.uid);
      if (!isAllowed) {
        setError('Sie sind nicht berechtigt, die KI-Funktionen zu nutzen');
        setAiService(null);
        return;
      }

      const service = new AIAssistantService({
        apiKey: aiConfig.apiKey,
        model: aiConfig.model
      });

      setAiService(service);
      setConfig(aiConfig);
    } catch (err) {
      console.error('Error initializing AI service:', err);
      setError('Fehler beim Initialisieren des KI-Assistenten');
      setAiService(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    initializeService();
  }, [initializeService]);

  const processCommand = useCallback(async (command: string) => {
    if (!aiService) {
      throw new Error('KI-Assistent ist nicht verfügbar');
    }

    try {
      const result = await aiService.processCommand(command);
      return result;
    } catch (err) {
      console.error('Error processing command:', err);
      throw err;
    }
  }, [aiService]);

  const executeAction = useCallback(async (action: AIAction) => {
    if (!aiService) {
      throw new Error('KI-Assistent ist nicht verfügbar');
    }

    if (!config) {
      throw new Error('KI-Konfiguration nicht geladen');
    }

    const featureMap: { [key: string]: keyof AIConfig['features'] } = {
      'create_quote': 'quoteGeneration',
      'create_invoice': 'invoiceGeneration',
      'send_email': 'emailAutomation',
      'search_customer': 'customerSearch',
      'calculate_price': 'priceCalculation'
    };

    const requiredFeature = featureMap[action.type];
    if (requiredFeature && !config.features[requiredFeature]) {
      throw new Error(`Die Funktion "${action.type}" ist deaktiviert`);
    }

    try {
      const result = await aiService.executeAction(action);
      return result;
    } catch (err) {
      console.error('Error executing action:', err);
      throw err;
    }
  }, [aiService, config]);

  const checkFeature = useCallback(async (feature: keyof AIConfig['features']) => {
    return await aiConfigService.isFeatureEnabled(feature);
  }, []);

  const refreshConfig = useCallback(async () => {
    aiConfigService.clearCache();
    await initializeService();
  }, [initializeService]);

  return {
    isEnabled: !!aiService && !!config?.enabled,
    isLoading,
    error,
    processCommand,
    executeAction,
    checkFeature,
    config,
    refreshConfig
  };
};