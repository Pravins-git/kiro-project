import { IAIProvider, AIProviderOptions } from '@ai-career/shared';
import OpenAI from 'openai';

export class OpenAIAdapter implements IAIProvider {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateText(prompt: string, options?: AIProviderOptions): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: options?.model || 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens,
    });

    return response.choices[0].message.content || '';
  }

  async generateJSON<T>(prompt: string, _schema?: any): Promise<T> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    return JSON.parse(content) as T;
  }
}
