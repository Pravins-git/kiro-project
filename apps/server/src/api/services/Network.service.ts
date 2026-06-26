import { IAIProvider } from '@ai-career/shared';

import { config } from '../../config/index.js';
import { logger } from '../../shared/logger.js';
import { BedrockAdapter } from './ai/BedrockAdapter.js';
import { MockAIAdapter } from './ai/MockAIAdapter.js';
import { OpenAIAdapter } from './ai/OpenAIAdapter.js';

export interface NetworkRecommendations {
  role: string;
  targetCompanies: Array<{ name: string; description: string; whyTarget: string }>;
  openSourceProjects: Array<{ name: string; url: string; contributionType: string }>;
  networkingStrategy: string[];
}

export class NetworkService {
  private aiProvider: IAIProvider;

  constructor() {
    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      this.aiProvider = new BedrockAdapter();
    } else if (config.nodeEnv === 'production' || process.env.USE_REAL_AI === 'true') {
      this.aiProvider = new OpenAIAdapter(config.openaiApiKey);
    } else {
      this.aiProvider = new MockAIAdapter();
    }
  }

  async getRecommendations(role: string): Promise<NetworkRecommendations> {
    const prompt = `
You are an expert career network strategist.
For a candidate targeting the role of "${role}", generate a highly actionable networking plan.
Ensure your response exactly matches the requested JSON schema.
For 'targetCompanies', list 5 companies (mix of enterprise and high-growth startups) that hire this role.
For 'openSourceProjects', recommend 3-5 foundational open-source communities to join/contribute to.
For 'networkingStrategy', provide 3 actionable networking steps for LinkedIn or local meetups.
`;

    try {
      const data = await this.aiProvider.generateJSON<NetworkRecommendations>(prompt);
      return {
        ...data,
        role,
      };
    } catch (error) {
      logger.error('Failed to generate network recommendations:', error);
      throw new Error('AI Engine failed to generate network recommendations.');
    }
  }
}
