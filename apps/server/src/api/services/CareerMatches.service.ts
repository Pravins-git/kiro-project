import { IAIProvider, RecommendationResponse } from '@ai-career/shared';

import { config } from '../../config/index.js';
import { logger } from '../../shared/logger.js';
import { ChatSession } from '../models/ChatSession.model.js';
import { Resume } from '../models/Resume.model.js';

import { BedrockAdapter } from './ai/BedrockAdapter.js';
import { MockAIAdapter } from './ai/MockAIAdapter.js';
import { OpenAIAdapter } from './ai/OpenAIAdapter.js';
import { cloudWatchService } from './aws/CloudWatch.service.js';
import { sqsService } from './aws/SQS.service.js';

export class CareerMatchesService {
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

  async generateMatches(userId: string): Promise<RecommendationResponse> {
    const startTime = Date.now();
    const resume = await Resume.findOne({ userId }).sort({ createdAt: -1 });
    const chatSession = await ChatSession.findOne({ userId }).sort({ createdAt: -1 });

    if (!resume) {
      throw new Error('No resume found for this user. Please upload a resume first.');
    }

    const resumeContext = JSON.stringify(resume.analysis || {});
    const chatContext = chatSession 
      ? JSON.stringify(chatSession.messages.map(m => `${m.role}: ${m.content}`))
      : 'No chat history available.';

    const prompt = `
You are an expert AI career strategist. 
Based on the following resume analysis and user behavioral chat context, generate a highly personalized career recommendation report matching the exact JSON schema provided.

Resume Analysis:
${resumeContext}

Behavioral Chat Context:
${chatContext}

Return a structured JSON object representing "RecommendationResponse" with top 5 career recommendations. Include confidence scores, evidence points, and salary ranges.
`;

    try {
      const recommendations = await this.aiProvider.generateJSON<RecommendationResponse>(prompt);
      const durationMs = Date.now() - startTime;

      // Publish CloudWatch metric for AI inference time
      cloudWatchService.recordAIInferenceTime(
        'career-recommendation',
        'generateMatches',
        durationMs,
      ).catch((err) => {
        logger.warn({ error: err.message }, 'CloudWatch AI inference metric failed (non-blocking)');
      });

      // Send message to embedding queue to update student profile embedding
      if (config.sqs.embeddingQueueUrl) {
        sqsService.sendMessage('embedding-generation', {
          type: 'profile-embedding-update',
          userId,
          trigger: 'career-matches-generated',
          timestamp: new Date().toISOString(),
        }).catch((err) => {
          logger.warn({ error: err.message }, 'SQS embedding queue message failed (non-blocking)');
        });
      }

      return recommendations;
    } catch (error) {
      logger.error('Failed to generate career matches:', error);
      throw new Error('AI Engine failed to generate career matches.');
    }
  }
}
