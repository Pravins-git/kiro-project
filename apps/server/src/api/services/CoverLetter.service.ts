import { IAIProvider } from '@ai-career/shared';

import { config } from '../../config/index.js';
import { logger } from '../../shared/logger.js';
import { BedrockAdapter } from './ai/BedrockAdapter.js';
import { MockAIAdapter } from './ai/MockAIAdapter.js';
import { OpenAIAdapter } from './ai/OpenAIAdapter.js';
import { Resume } from '../models/Resume.model.js';
import { User } from '../models/User.model.js';

export interface CoverLetterRequest {
  jobDescription: string;
  tone: 'Professional' | 'Enthusiastic' | 'Direct';
}

export class CoverLetterService {
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

  async generateCoverLetter(userId: string, data: CoverLetterRequest): Promise<{ content: string }> {
    const user = await User.findById(userId);
    const resume = await Resume.findOne({ userId }).sort({ createdAt: -1 });

    if (!user) throw new Error('User not found');
    if (!resume) throw new Error('No resume found. Please upload a resume first.');

    const resumeContext = JSON.stringify(resume.analysis || {});
    
    // In a real application, we would use the specific IAIProvider text generation method.
    // For now, we will construct a mock response or use a specific JSON prompt mapping since IAIProvider requires JSON.
    const prompt = `
You are an expert career coach.
Write a highly tailored cover letter for a candidate applying to a job.
The tone should be: ${data.tone}.
Use the STAR method where appropriate.

Job Description:
${data.jobDescription}

Candidate Resume Analysis:
${resumeContext}
Candidate Name: ${user.firstName} ${user.lastName}

Respond strictly with a JSON object in this format: { "content": "The generated cover letter text..." }
`;

    try {
      const response = await this.aiProvider.generateJSON<{ content: string }>(prompt);
      return response;
    } catch (error) {
      logger.error('Failed to generate cover letter:', error);
      throw new Error('AI Engine failed to generate cover letter.');
    }
  }
}
