import { IAIProvider } from '@ai-career/shared';

import { config } from '../../config/index.js';
import { logger } from '../../shared/logger.js';
import { BedrockAdapter } from './ai/BedrockAdapter.js';
import { MockAIAdapter } from './ai/MockAIAdapter.js';
import { OpenAIAdapter } from './ai/OpenAIAdapter.js';

export interface AssessmentQuestion {
  questionId: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
}

export interface AssessmentEvaluation {
  score: number;
  correctnessFeedback: string;
  efficiencyFeedback: string;
  overallFeedback: string;
}

export class AssessmentService {
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

  async generateQuestion(role: string, difficulty: string): Promise<AssessmentQuestion> {
    const prompt = `
Generate a mock technical assessment question for a ${difficulty} ${role}.
It should be a coding or system design question.
Return exactly this JSON schema:
{
  "questionId": "a random uuid string",
  "title": "Short title",
  "description": "Detailed prompt",
  "timeLimitMinutes": 30
}
`;
    try {
      return await this.aiProvider.generateJSON<AssessmentQuestion>(prompt);
    } catch (error) {
      logger.error('Failed to generate assessment question:', error);
      throw new Error('AI Engine failed to generate assessment question.');
    }
  }

  async evaluateAnswer(questionTitle: string, questionDescription: string, answer: string): Promise<AssessmentEvaluation> {
    const prompt = `
You are a senior principal engineer evaluating a candidate's answer to a technical assessment.
Question Title: ${questionTitle}
Question Description: ${questionDescription}

Candidate's Answer:
${answer}

Evaluate the candidate's answer based on correctness, efficiency, and clarity.
Return exactly this JSON schema:
{
  "score": number between 0 and 100,
  "correctnessFeedback": "Feedback on correctness",
  "efficiencyFeedback": "Feedback on efficiency/optimization",
  "overallFeedback": "Overall feedback"
}
`;
    try {
      return await this.aiProvider.generateJSON<AssessmentEvaluation>(prompt);
    } catch (error) {
      logger.error('Failed to evaluate assessment answer:', error);
      throw new Error('AI Engine failed to evaluate assessment answer.');
    }
  }
}
