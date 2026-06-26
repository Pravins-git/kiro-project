import { IAIProvider } from '@ai-career/shared';

import { config } from '../../config/index.js';
import { logger } from '../../shared/logger.js';
import { BedrockAdapter } from './ai/BedrockAdapter.js';
import { MockAIAdapter } from './ai/MockAIAdapter.js';
import { OpenAIAdapter } from './ai/OpenAIAdapter.js';
import { Resume } from '../models/Resume.model.js';
import { User } from '../models/User.model.js';

export interface LinkedInOptimization {
  headline: string;
  summary: string;
  experienceBullets: Array<{ role: string; company: string; bullets: string[] }>;
}

export class LinkedInOptimizerService {
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

  async optimizeProfile(userId: string): Promise<LinkedInOptimization> {
    const user = await User.findById(userId);
    const resume = await Resume.findOne({ userId }).sort({ createdAt: -1 });

    if (!user) throw new Error('User not found');
    if (!resume) throw new Error('No resume found. Please upload a resume first.');

    const resumeContext = JSON.stringify(resume.analysis || {});

    const prompt = `
You are an expert LinkedIn profile optimizer and technical recruiter.
Analyze the candidate's parsed resume and generate highly optimized LinkedIn content.

Candidate Resume Context:
${resumeContext}
Candidate Name: ${user.firstName} ${user.lastName}

Respond strictly with a JSON object in this format:
{
  "headline": "A highly optimized, SEO-friendly LinkedIn headline (max 120 chars).",
  "summary": "An engaging, professional 'About' section summary.",
  "experienceBullets": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "bullets": ["Action-oriented, metrics-driven bullet point 1", "Bullet point 2"]
    }
  ]
}
`;

    try {
      const response = await this.aiProvider.generateJSON<LinkedInOptimization>(prompt);
      return response;
    } catch (error) {
      logger.error('Failed to generate LinkedIn optimization:', error);
      throw new Error('AI Engine failed to generate LinkedIn profile optimization.');
    }
  }
}
