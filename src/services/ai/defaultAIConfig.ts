import { getOpenAIKey } from './getAPIKey';

// Default AI Configuration
export const DEFAULT_AI_CONFIG = {
  apiKey: getOpenAIKey(),
  model: 'gpt-4o',
  enabled: true,
  maxTokens: 3000,
  temperature: 0.8,
  allowedUsers: [], // Leer = alle Benutzer erlaubt
  features: {
    quoteGeneration: true,
    invoiceGeneration: true,
    emailAutomation: true,
    customerSearch: true,
    priceCalculation: true
  }
};