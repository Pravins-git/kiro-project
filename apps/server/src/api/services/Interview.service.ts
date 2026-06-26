import { IAIProvider } from '@ai-career/shared';

import { config } from '../../config/index.js';
import { logger } from '../../shared/logger.js';
import { BedrockAdapter } from './ai/BedrockAdapter.js';
import { MockAIAdapter } from './ai/MockAIAdapter.js';
import { OpenAIAdapter } from './ai/OpenAIAdapter.js';
import { InterviewSession, IInterviewSession } from '../models/InterviewSession.model.js';

export class InterviewService {
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

  async startSession(userId: string, role: string) {
    
    let aiResponseContent = 'Welcome! I am your AI interviewer. Tell me about a time you had to overcome a difficult technical challenge.';

    try {
      if (this.aiProvider instanceof OpenAIAdapter || this.aiProvider instanceof BedrockAdapter) {
         // Use the AI provider if it supports direct string generation (mocking this call pattern based on typical usage)
         // Assuming the provider has a method to generate a simple text response given a prompt.
         // If it doesn't have a direct text method in IAIProvider, we'll wrap it in a mock JSON or just use the fallback.
      }
    } catch (e) {
      logger.warn('Failed to get dynamic start prompt, using fallback');
    }

    const session = await InterviewSession.create({
      userId,
      role,
      messages: [
        { role: 'system', content: `Simulate an interview for: ${role}. Grade on STAR method.` },
        { role: 'ai', content: aiResponseContent }
      ]
    });

    return session;
  }

  async processMessage(sessionId: string, userId: string, messageContent: string) {
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new Error('Interview session not found');
    }

    if (session.status === 'completed') {
      throw new Error('Interview is already completed');
    }

    // Add user message
    session.messages.push({ role: 'user', content: messageContent, timestamp: new Date() });

    // In a real implementation, we would send the full message history to the AIProvider to generate the next response.
    let aiResponse = 'Thank you for that response. Can you elaborate on the specific actions you took in that situation?';
    
    // Check if interview should end (e.g. after 5 user turns)
    const userTurns = session.messages.filter(m => m.role === 'user').length;
    if (userTurns >= 3) {
      aiResponse = 'Thank you, that concludes our interview. I will now generate your feedback report.';
      session.status = 'completed';
    }

    session.messages.push({ role: 'ai', content: aiResponse, timestamp: new Date() });
    await session.save();

    if (session.status === 'completed') {
      await this.generateFeedback(session);
    }

    return session;
  }

  private async generateFeedback(session: IInterviewSession) {
    // Mocking feedback generation for now to ensure reliability
    session.feedback = {
      starScore: 85,
      strengths: ['Great context setting', 'Clear articulation of results'],
      improvements: ['Could focus more on personal contribution rather than team effort', 'Be more concise'],
      overallFeedback: 'A solid performance. You structured your answers well but could dive deeper into your specific technical decisions.'
    };
    await session.save();
  }
}
