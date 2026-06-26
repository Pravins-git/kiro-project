import { IAIProvider } from '@ai-career/shared';

import { config } from '../../config/index.js';
import { logger } from '../../shared/logger.js';
import { BedrockAdapter } from './ai/BedrockAdapter.js';
import { MockAIAdapter } from './ai/MockAIAdapter.js';
import { OpenAIAdapter } from './ai/OpenAIAdapter.js';
import { Resume } from '../models/Resume.model.js';
import { User } from '../models/User.model.js';

export interface ColdEmailSequence {
  initialOutreach: {
    subject: string;
    body: string;
  };
  followUp: {
    subject: string;
    body: string;
  };
}

export class ColdEmailService {
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

  async generateSequence(userId: string, targetCompany: string, jobDescription: string): Promise<ColdEmailSequence> {
    const user = await User.findById(userId);
    const resume = await Resume.findOne({ userId }).sort({ createdAt: -1 });

    if (!user) throw new Error('User not found');
    if (!resume) throw new Error('No resume found. Please upload a resume first.');

    const resumeContext = JSON.stringify(resume.analysis || {});

    const prompt = `
You are an expert career strategist and executive recruiter.
Generate a cold email sequence (an initial outreach email and one follow-up) tailored for a hiring manager at "${targetCompany}".

Candidate Name: ${user.firstName} ${user.lastName}
Candidate Resume Context:
${resumeContext}

Target Job Description:
${jobDescription}

Respond strictly with a JSON object in this format:
{
  "initialOutreach": {
    "subject": "Compelling subject line",
    "body": "Hi [Hiring Manager Name],\\n\\n...\\n\\nBest,\\n${user.firstName}"
  },
  "followUp": {
    "subject": "Re: Compelling subject line",
    "body": "Hi [Hiring Manager Name],\\n\\n...\\n\\nBest,\\n${user.firstName}"
  }
}
`;

    try {
      const response = await this.aiProvider.generateJSON<ColdEmailSequence>(prompt);
      return response;
    } catch (error) {
      logger.error('Failed to generate cold email sequence:', error);
      throw new Error('AI Engine failed to generate cold email sequence.');
    }
  }
}
