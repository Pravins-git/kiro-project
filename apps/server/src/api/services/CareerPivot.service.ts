import { IAIProvider } from '@ai-career/shared';

import { config } from '../../config/index.js';
import { logger } from '../../shared/logger.js';
import { BedrockAdapter } from './ai/BedrockAdapter.js';
import { MockAIAdapter } from './ai/MockAIAdapter.js';
import { OpenAIAdapter } from './ai/OpenAIAdapter.js';
import { Resume } from '../models/Resume.model.js';

export interface PivotAnalysis {
  targetRole: string;
  transferableSkills: Array<{ skill: string; reasoning: string; matchScore: number }>;
  criticalGaps: Array<{ skill: string; reasoning: string; suggestedAction: string }>;
  pivotFeasibilityScore: number;
}

export class CareerPivotService {
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

  async analyzePivot(userId: string, targetRole: string): Promise<PivotAnalysis> {
    const resume = await Resume.findOne({ userId }).sort({ createdAt: -1 });
    if (!resume) {
      throw new Error('No resume found. Please upload a resume first to analyze a pivot.');
    }

    const resumeContext = JSON.stringify(resume.analysis || {});

    const prompt = `
You are an expert career transition coach.
Analyze the candidate's parsed resume against a totally new target role: "${targetRole}".
Identify what transferable skills they already possess, and what critical gaps they need to fill.

Candidate Resume Context:
${resumeContext}

Respond strictly with a JSON object in this format:
{
  "transferableSkills": [ { "skill": "...", "reasoning": "...", "matchScore": 85 } ],
  "criticalGaps": [ { "skill": "...", "reasoning": "...", "suggestedAction": "..." } ],
  "pivotFeasibilityScore": 75
}
`;

    try {
      const data = await this.aiProvider.generateJSON<PivotAnalysis>(prompt);
      return { ...data, targetRole };
    } catch (error) {
      logger.error('Failed to generate pivot analysis:', error);
      throw new Error('AI Engine failed to generate pivot analysis.');
    }
  }
}
