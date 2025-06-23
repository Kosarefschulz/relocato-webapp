// Default AI Configuration - API Key wird über Environment Variable geladen
export const DEFAULT_AI_CONFIG = {
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
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