import { IAIProvider, LearningRoadmap as ILearningRoadmap } from '@ai-career/shared';

import { config } from '../../config/index.js';
import { logger } from '../../shared/logger.js';
import { LearningRoadmap } from '../models/LearningRoadmap.model.js';
import { Resume } from '../models/Resume.model.js';

import { BedrockAdapter } from './ai/BedrockAdapter.js';
import { MockAIAdapter } from './ai/MockAIAdapter.js';
import { OpenAIAdapter } from './ai/OpenAIAdapter.js';

export class RoadmapService {
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

  async generateRoadmap(userId: string, targetCareerId: string, targetCareerTitle: string): Promise<ILearningRoadmap> {
    const resume = await Resume.findOne({ userId }).sort({ createdAt: -1 });

    if (!resume) {
      throw new Error('No resume found for this user. Cannot generate roadmap without skills context.');
    }

    const resumeContext = JSON.stringify(resume.analysis || {});

    const prompt = `
You are an expert technical career coach.
Based on the following parsed resume context for a user, generate a highly detailed, week-by-week personalized learning roadmap for them to achieve the target career: "${targetCareerTitle}".

Resume Context:
${resumeContext}

Target Career: ${targetCareerTitle}
Time Commitment: 10 hours per week

Return a structured JSON object representing "LearningRoadmap" schema. Include at least 4 weeks of structured activities, key milestones, and a clear path from their current skill level to the required proficiency. Do not include user id or roadmap id in JSON.
`;

    try {
      const generatedRoadmap = await this.aiProvider.generateJSON<any>(prompt);
      
      const newRoadmap = new LearningRoadmap({
        userId,
        targetCareerId,
        targetCareerTitle,
        timeCommitmentHoursPerWeek: generatedRoadmap.timeCommitmentHoursPerWeek || 10,
        weeks: generatedRoadmap.weeks || [],
        milestones: generatedRoadmap.milestones || [],
        estimatedCompletionDate: generatedRoadmap.estimatedCompletionDate || '4 weeks',
        progress: 0,
      });

      await newRoadmap.save();

      return {
        ...newRoadmap.toObject(),
        roadmapId: newRoadmap._id.toString(),
      } as unknown as ILearningRoadmap;
    } catch (error) {
      logger.error('Failed to generate learning roadmap:', error);
      throw new Error('AI Engine failed to generate roadmap.');
    }
  }

  async getRoadmap(userId: string, targetCareerId: string): Promise<ILearningRoadmap | null> {
    const roadmap = await LearningRoadmap.findOne({ userId, targetCareerId }).sort({ createdAt: -1 });
    if (!roadmap) return null;
    return {
      ...roadmap.toObject(),
      roadmapId: roadmap._id.toString(),
    } as unknown as ILearningRoadmap;
  }
}
