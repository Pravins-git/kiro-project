import { IAIProvider, ChatResponse } from '@ai-career/shared';

import { config } from '../../config/index.js';
import { logger } from '../../shared/logger.js';
import { ChatSession } from '../models/ChatSession.model.js';

import { BedrockAdapter } from './ai/BedrockAdapter.js';
import { MockAIAdapter } from './ai/MockAIAdapter.js';
import { OpenAIAdapter } from './ai/OpenAIAdapter.js';

export class ChatService {
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

  private buildSystemPrompt(): string {
    return `You are an elite AI Career Mentor for a SaaS platform. Your goal is to guide the user in discovering their perfect career path. Ask insightful, behavioral, and goal-oriented questions to extract their soft skills, preferences, and long-term ambitions. Keep responses concise, engaging, and highly professional. Limit responses to 2-3 short paragraphs.`;
  }

  async processMessage(userId: string, message: string, sessionId?: string): Promise<ChatResponse> {
    let session;

    if (sessionId) {
      session = await ChatSession.findById(sessionId);
      if (!session || session.userId.toString() !== userId) {
        throw new Error('Session not found or unauthorized');
      }
    } else {
      session = new ChatSession({ userId, messages: [] });
      session.messages.push({
        role: 'system',
        content: this.buildSystemPrompt(),
      });
    }

    session.messages.push({
      role: 'user',
      content: message,
    });

    const aiPrompt = session.messages.map((m: any) => `${m.role}: ${m.content}`).join('\n');
    let aiResponseText = '';

    try {
      aiResponseText = await this.aiProvider.generateText(aiPrompt);
    } catch (error) {
      logger.error('Failed to generate AI response:', error);
      throw new Error('Failed to generate response from AI');
    }

    session.messages.push({
      role: 'assistant',
      content: aiResponseText,
    });

    await session.save();

    const assistantMessage = session.messages[session.messages.length - 1];

    return {
      message: {
        id: assistantMessage._id.toString(),
        role: assistantMessage.role as any,
        content: assistantMessage.content,
        timestamp: assistantMessage.timestamp.toISOString(),
      },
      sessionId: session._id.toString(),
    };
  }
}
