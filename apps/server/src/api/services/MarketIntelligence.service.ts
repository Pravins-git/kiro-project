import { IAIProvider } from '@ai-career/shared';

import { config } from '../../config/index.js';
import { logger } from '../../shared/logger.js';
import { BedrockAdapter } from './ai/BedrockAdapter.js';
import { MockAIAdapter } from './ai/MockAIAdapter.js';
import { OpenAIAdapter } from './ai/OpenAIAdapter.js';

export interface MarketIntelligenceData {
  role: string;
  salaryRange: {
    p10: number;
    median: number;
    p90: number;
    currency: string;
  };
  demandTrend: 'rising' | 'stable' | 'declining';
  growthRate: number; // Percentage
  topSkills: Array<{ name: string; importance: string }>;
  geographicHotspots: string[];
  insights: string[];
}

export class MarketIntelligenceService {
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

  async getMarketInsights(role: string): Promise<MarketIntelligenceData> {
    const prompt = `
You are a top-tier Labor Market Intelligence Analyst.
Provide an up-to-date, highly accurate market analysis for the role of "${role}".
Ensure your response exactly matches the requested JSON schema.
For the 'demandTrend', pick one: 'rising', 'stable', or 'declining'.
For 'growthRate', provide a projected 5-year percentage growth (e.g. 15.5).
For 'topSkills', provide a list of 5 skills, each with an importance description (e.g. 'High', 'Critical').
For 'geographicHotspots', list 3-5 top global or US regions for this role.
For 'insights', provide 3 actionable paragraphs analyzing the current state of this career.
`;

    try {
      const data = await this.aiProvider.generateJSON<MarketIntelligenceData>(prompt);
      return {
        ...data,
        role, // Ensure role matches the requested one
      };
    } catch (error) {
      logger.error('Failed to generate market insights:', error);
      throw new Error('AI Engine failed to generate market insights.');
    }
  }
}
