import OpenAI from 'openai';

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class OpenAIService {
  private openai: OpenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: OpenAIConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.openai = new OpenAI({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true
    });

    this.model = config.model || 'gpt-4o-mini';
    this.maxTokens = config.maxTokens || 2000;
    this.temperature = config.temperature || 0.7;
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateStructuredOutput<T>(
    prompt: string,
    systemPrompt: string,
    responseFormat: any
  ): Promise<T> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: responseFormat
      });

      const content = completion.choices[0]?.message?.content || '{}';
      return JSON.parse(content) as T;
    } catch (error) {
      console.error('OpenAI Structured Output Error:', error);
      throw new Error(`Failed to generate structured output: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateWithFunctions(
    prompt: string,
    systemPrompt: string,
    functions: OpenAI.Chat.ChatCompletionCreateParams.Function[]
  ): Promise<{
    content: string | null;
    functionCall?: {
      name: string;
      arguments: any;
    };
  }> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        functions,
        function_call: 'auto',
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const message = completion.choices[0]?.message;
      
      if (message?.function_call) {
        return {
          content: message.content,
          functionCall: {
            name: message.function_call.name,
            arguments: JSON.parse(message.function_call.arguments || '{}')
          }
        };
      }

      return { content: message?.content || '' };
    } catch (error) {
      console.error('OpenAI Function Call Error:', error);
      throw new Error(`Failed to generate with functions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async streamText(
    prompt: string,
    systemPrompt?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: true,
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        
        if (onChunk) {
          onChunk(content);
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('OpenAI Stream Error:', error);
      throw new Error(`Failed to stream text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

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