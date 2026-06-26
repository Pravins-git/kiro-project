export interface IAIProvider {
  /**
   * Generates text based on a prompt.
   * @param prompt The system/user prompt.
   * @param options Optional parameters like temperature, maxTokens.
   */
  generateText(prompt: string, options?: AIProviderOptions): Promise<string>;

  /**
   * Generates a structured JSON object based on a prompt and a schema.
   * @param prompt The system/user prompt.
   * @param schema The expected JSON schema structure.
   */
  generateJSON<T>(prompt: string, schema?: any): Promise<T>;
}

export interface AIProviderOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}
