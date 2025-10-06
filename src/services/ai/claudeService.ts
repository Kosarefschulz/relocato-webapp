import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ClaudeFunctionCall {
  name: string;
  arguments: any;
}

export class ClaudeService {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: ClaudeConfig) {
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.client = new Anthropic({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true // Für Browser-Nutzung
    });

    this.model = config.model || 'claude-sonnet-4-5-20250929';
    this.maxTokens = config.maxTokens || 4096;
    this.temperature = config.temperature || 0.7;
  }

  /**
   * Generiert Text mit Claude
   */
  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const textContent = response.content.find(block => block.type === 'text');
      return textContent && 'text' in textContent ? textContent.text : '';
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generiert Text mit Chat-Historie
   */
  async generateTextWithHistory(
    messages: Array<{ role: 'user' | 'assistant'; content: any }>,
    systemPrompt?: string
  ): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages
      });

      const textContent = response.content.find(block => block.type === 'text');
      return textContent && 'text' in textContent ? textContent.text : '';
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generiert Text mit Vision (Bild-Analyse)
   */
  async generateTextWithVision(
    prompt: string,
    imageBase64: string,
    systemPrompt?: string
  ): Promise<string> {
    try {
      // Entferne data:image/png;base64, prefix falls vorhanden
      const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      });

      const textContent = response.content.find(block => block.type === 'text');
      return textContent && 'text' in textContent ? textContent.text : '';
    } catch (error) {
      console.error('Claude Vision Error:', error);
      throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generiert mit Tool Use (entspricht Function Calling)
   */
  async generateWithTools(
    prompt: string,
    systemPrompt: string,
    tools: any[]
  ): Promise<{
    content: string | null;
    toolUse?: ClaudeFunctionCall;
  }> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        tools
      });

      // Suche nach Text-Content
      const textBlock = response.content.find(block => block.type === 'text');
      const content = textBlock && 'text' in textBlock ? textBlock.text : null;

      // Suche nach Tool Use
      const toolBlock = response.content.find(block => block.type === 'tool_use');
      const toolUse = toolBlock && 'name' in toolBlock && 'input' in toolBlock
        ? {
            name: toolBlock.name,
            arguments: toolBlock.input
          }
        : undefined;

      return { content, toolUse };
    } catch (error) {
      console.error('Claude Tool Use Error:', error);
      throw new Error(`Failed to generate with tools: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Streaming-Unterstützung
   */
  async streamText(
    prompt: string,
    systemPrompt?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      const stream = await this.client.messages.stream({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      let fullResponse = '';

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const chunk = event.delta.text;
          fullResponse += chunk;

          if (onChunk) {
            onChunk(chunk);
          }
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('Claude Stream Error:', error);
      throw new Error(`Failed to stream text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Konfiguration aktualisieren
   */
  setModel(model: string): void {
    this.model = model;
  }

  setMaxTokens(maxTokens: number): void {
    this.maxTokens = maxTokens;
  }

  setTemperature(temperature: number): void {
    this.temperature = temperature;
  }
}
