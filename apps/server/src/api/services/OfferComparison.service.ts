import { IAIProvider } from '@ai-career/shared';

import { config } from '../../config/index.js';
import { logger } from '../../shared/logger.js';
import { BedrockAdapter } from './ai/BedrockAdapter.js';
import { MockAIAdapter } from './ai/MockAIAdapter.js';
import { OpenAIAdapter } from './ai/OpenAIAdapter.js';

export interface OfferDetails {
  companyName: string;
  baseSalary: number;
  bonus: number;
  equity: number;
  benefits: string;
}

export interface OfferComparisonResult {
  offers: Array<{
    companyName: string;
    totalCompensation: number;
    pros: string[];
    cons: string[];
  }>;
  recommendation: string;
  negotiationLever: string;
}

export class OfferComparisonService {
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

  async compareOffers(offers: OfferDetails[]): Promise<OfferComparisonResult> {
    const prompt = `
You are an expert career negotiator and compensation analyst.
Analyze the following competing job offers.

Offers:
${JSON.stringify(offers, null, 2)}

Calculate total estimated compensation for each. Provide 2 pros and 2 cons for each offer. 
Give a final recommendation on which offer is the strongest. 
Finally, provide a "negotiationLever" - advice on how to use the competing offers to negotiate a better deal at their preferred company.

Respond strictly with a JSON object in this format:
{
  "offers": [
    {
      "companyName": "...",
      "totalCompensation": 150000,
      "pros": ["...", "..."],
      "cons": ["...", "..."]
    }
  ],
  "recommendation": "Overall recommendation explaining why one offer is better.",
  "negotiationLever": "Actionable advice on what to say to negotiate."
}
`;

    try {
      const response = await this.aiProvider.generateJSON<OfferComparisonResult>(prompt);
      return response;
    } catch (error) {
      logger.error('Failed to compare offers:', error);
      throw new Error('AI Engine failed to compare offers.');
    }
  }
}
