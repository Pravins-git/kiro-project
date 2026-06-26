import { IAIProvider, AIProviderOptions } from '@ai-career/shared';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

import { config } from '../../../config/index.js';
import { logger } from '../../../shared/logger.js';

export class BedrockAdapter implements IAIProvider {
  private client: BedrockRuntimeClient;
  private defaultModelId = 'anthropic.claude-3-sonnet-20240229-v1:0';

  constructor() {
    const clientConfig: any = { region: config.aws.region };
    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      };
    }
    this.client = new BedrockRuntimeClient(clientConfig);
  }

  async generateText(prompt: string, options?: AIProviderOptions): Promise<string> {
    try {
      const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: options?.maxTokens || 2048,
        temperature: options?.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: prompt }],
          },
        ],
      };

      const command = new InvokeModelCommand({
        modelId: options?.model || this.defaultModelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return responseBody.content[0].text;
    } catch (error) {
      logger.error('Bedrock generateText failed:', error);
      throw new Error('AI Model Invocation Failed');
    }
  }

  async generateJSON<T>(prompt: string, _schema?: any): Promise<T> {
    try {
      // For Claude 3 on Bedrock, we instruct it to output only JSON
      const jsonPrompt = `${prompt}\n\nRespond ONLY with a valid JSON object. Do not include any conversational text, markdown formatting (like \`\`\`json), or explanations.`;
      
      const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4096,
        temperature: 0.1, // Low temperature for deterministic JSON output
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: jsonPrompt }],
          },
        ],
      };

      const command = new InvokeModelCommand({
        modelId: this.defaultModelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      let text = responseBody.content[0].text.trim();
      
      // Cleanup any accidental markdown if Claude ignores instructions
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      }

      return JSON.parse(text) as T;
    } catch (error) {
      logger.error('Bedrock generateJSON failed:', error);
      throw new Error('AI Model Invocation Failed to generate valid JSON');
    }
  }
}
