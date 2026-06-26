import {
  ComprehendClient,
  DetectSentimentCommand,
  DetectKeyPhrasesCommand,
  DetectEntitiesCommand,
  DetectDominantLanguageCommand,
  SentimentType,
  LanguageCode,
} from '@aws-sdk/client-comprehend';

import { config } from '../../../config/index.js';
import { AppError } from '../../../shared/errors.js';
import { logger } from '../../../shared/logger.js';

export interface SentimentResult {
  sentiment: string;
  scores: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
}

export interface KeyPhraseResult {
  text: string;
  score: number;
  beginOffset: number;
  endOffset: number;
}

export interface EntityResult {
  text: string;
  type: string;
  score: number;
  beginOffset: number;
  endOffset: number;
}

export interface DominantLanguageResult {
  languageCode: string;
  score: number;
}

export class ComprehendService {
  private client: ComprehendClient;

  constructor() {
    const clientConfig: Record<string, unknown> = {
      region: config.aws.region,
    };

    if (config.comprehend.endpoint) {
      clientConfig.endpoint = config.comprehend.endpoint;
    }

    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      };
    }

    this.client = new ComprehendClient(clientConfig);
    logger.info('ComprehendService initialized');
  }

  /**
   * Detect the overall sentiment of a text (POSITIVE, NEGATIVE, NEUTRAL, MIXED).
   */
  async detectSentiment(text: string, languageCode: LanguageCode = LanguageCode.EN): Promise<SentimentResult> {
    try {
      const command = new DetectSentimentCommand({
        Text: text,
        LanguageCode: languageCode,
      });

      const response = await this.client.send(command);

      const result: SentimentResult = {
        sentiment: response.Sentiment || SentimentType.NEUTRAL,
        scores: {
          positive: response.SentimentScore?.Positive || 0,
          negative: response.SentimentScore?.Negative || 0,
          neutral: response.SentimentScore?.Neutral || 0,
          mixed: response.SentimentScore?.Mixed || 0,
        },
      };

      logger.info({ sentiment: result.sentiment }, 'Comprehend detectSentiment completed');
      return result;
    } catch (error: any) {
      logger.error({ error }, 'Comprehend detectSentiment failed');
      if (error.name === 'TextSizeLimitExceededException') {
        throw AppError.badRequest('Text exceeds maximum size for sentiment analysis');
      }
      throw AppError.internal(`Comprehend sentiment detection failed: ${error.message}`);
    }
  }

  /**
   * Detect key phrases in the text.
   */
  async detectKeyPhrases(text: string, languageCode: LanguageCode = LanguageCode.EN): Promise<KeyPhraseResult[]> {
    try {
      const command = new DetectKeyPhrasesCommand({
        Text: text,
        LanguageCode: languageCode,
      });

      const response = await this.client.send(command);
      const phrases = (response.KeyPhrases || []).map((kp) => ({
        text: kp.Text || '',
        score: kp.Score || 0,
        beginOffset: kp.BeginOffset || 0,
        endOffset: kp.EndOffset || 0,
      }));

      logger.info({ phraseCount: phrases.length }, 'Comprehend detectKeyPhrases completed');
      return phrases;
    } catch (error: any) {
      logger.error({ error }, 'Comprehend detectKeyPhrases failed');
      if (error.name === 'TextSizeLimitExceededException') {
        throw AppError.badRequest('Text exceeds maximum size for key phrase detection');
      }
      throw AppError.internal(`Comprehend key phrase detection failed: ${error.message}`);
    }
  }

  /**
   * Detect named entities (people, organizations, locations, dates, etc.).
   */
  async detectEntities(text: string, languageCode: LanguageCode = LanguageCode.EN): Promise<EntityResult[]> {
    try {
      const command = new DetectEntitiesCommand({
        Text: text,
        LanguageCode: languageCode,
      });

      const response = await this.client.send(command);
      const entities = (response.Entities || []).map((e) => ({
        text: e.Text || '',
        type: e.Type || 'OTHER',
        score: e.Score || 0,
        beginOffset: e.BeginOffset || 0,
        endOffset: e.EndOffset || 0,
      }));

      logger.info({ entityCount: entities.length }, 'Comprehend detectEntities completed');
      return entities;
    } catch (error: any) {
      logger.error({ error }, 'Comprehend detectEntities failed');
      if (error.name === 'TextSizeLimitExceededException') {
        throw AppError.badRequest('Text exceeds maximum size for entity detection');
      }
      throw AppError.internal(`Comprehend entity detection failed: ${error.message}`);
    }
  }

  /**
   * Detect the dominant language of the provided text.
   */
  async detectDominantLanguage(text: string): Promise<DominantLanguageResult[]> {
    try {
      const command = new DetectDominantLanguageCommand({
        Text: text,
      });

      const response = await this.client.send(command);
      const languages = (response.Languages || []).map((lang) => ({
        languageCode: lang.LanguageCode || 'en',
        score: lang.Score || 0,
      }));

      logger.info({ languages: languages.map((l) => l.languageCode) }, 'Comprehend detectDominantLanguage completed');
      return languages;
    } catch (error: any) {
      logger.error({ error }, 'Comprehend detectDominantLanguage failed');
      throw AppError.internal(`Comprehend language detection failed: ${error.message}`);
    }
  }

  /**
   * Helper: Analyze resume text quality using sentiment + key phrases + entities.
   * Returns a composite quality enhancement score.
   */
  async analyzeResumeQuality(resumeText: string): Promise<{
    sentiment: SentimentResult;
    topKeyPhrases: KeyPhraseResult[];
    entities: EntityResult[];
    qualitySignals: { actionVerbDensity: number; specificityScore: number };
  }> {
    const [sentiment, keyPhrases, entities] = await Promise.all([
      this.detectSentiment(resumeText),
      this.detectKeyPhrases(resumeText),
      this.detectEntities(resumeText),
    ]);

    // Sort key phrases by score and take top 20
    const topKeyPhrases = keyPhrases
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    // Calculate quality signals
    const words = resumeText.split(/\s+/).length;
    const actionVerbDensity = keyPhrases.length / Math.max(words, 1);
    const specificityScore = entities.filter((e) => e.score > 0.8).length / Math.max(entities.length, 1);

    return {
      sentiment,
      topKeyPhrases,
      entities,
      qualitySignals: {
        actionVerbDensity: Math.min(actionVerbDensity * 100, 100),
        specificityScore: specificityScore * 100,
      },
    };
  }
}

export const comprehendService = new ComprehendService();
