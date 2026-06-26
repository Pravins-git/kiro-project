import { IAIProvider, ResumeAnalysis } from '@ai-career/shared';
import { PDFParse } from 'pdf-parse';

import { config } from '../../config/index.js';
import { logger } from '../../shared/logger.js';
import { Resume } from '../models/Resume.model.js';

import { BedrockAdapter } from './ai/BedrockAdapter.js';
import { MockAIAdapter } from './ai/MockAIAdapter.js';
import { OpenAIAdapter } from './ai/OpenAIAdapter.js';
import { cloudWatchService } from './aws/CloudWatch.service.js';
import { comprehendService } from './aws/Comprehend.service.js';
import { sqsService } from './aws/SQS.service.js';
import { textractService } from './aws/Textract.service.js';

export class ResumeParserService {
  private aiProvider: IAIProvider;

  constructor() {
    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      logger.info('Using BedrockAdapter for AI inference.');
      this.aiProvider = new BedrockAdapter();
    } else if (config.nodeEnv === 'production' || process.env.USE_REAL_AI === 'true') {
      logger.info('Using OpenAIAdapter for AI inference.');
      this.aiProvider = new OpenAIAdapter(config.openaiApiKey);
    } else {
      logger.warn('Falling back to MockAIAdapter for parsing.');
      this.aiProvider = new MockAIAdapter();
    }
  }

  /**
   * Extract text from a document using AWS Textract (for S3-stored docs).
   * Falls back to returning empty result if Textract fails.
   */
  async extractWithTextract(s3Key: string): Promise<{ text: string; fields: any[]; tables: any[] }> {
    try {
      const result = await textractService.startDocumentAnalysis(config.aws.s3BucketName, s3Key);
      logger.info({ jobId: result.jobId, s3Key }, 'Textract async analysis started for resume');

      // For async jobs, we return the job info — processing will be handled via SQS/Step Functions
      // For now, return empty and let the caller handle async flow
      return { text: '', fields: [], tables: [] };
    } catch (error: any) {
      logger.error({ error, s3Key }, 'Textract extraction failed');
      return { text: '', fields: [], tables: [] };
    }
  }

  async processResume(resumeId: string, fileBuffer: Buffer): Promise<void> {
    const startTime = Date.now();
    try {
      await Resume.findByIdAndUpdate(resumeId, { status: 'processing' });

      // 1. Extract text from PDF
      let rawText = '';
      const useTextract = config.textract.endpoint || config.nodeEnv === 'production';

      if (useTextract) {
        // Try Textract first for better structured extraction
        try {
          const textractResult = await textractService.detectDocumentText(new Uint8Array(fileBuffer));
          rawText = textractResult.text;
          logger.info({ resumeId, charCount: rawText.length }, 'Text extracted via Textract');
        } catch (textractError: any) {
          logger.warn({ resumeId, error: textractError.message }, 'Textract failed, falling back to pdf-parse');
          // Fallback to pdf-parse
          const pdf = new PDFParse({ data: fileBuffer });
          const textResult = await pdf.getText();
          rawText = textResult.text;
        }
      } else {
        // Use pdf-parse as default for local development
        const pdf = new PDFParse({ data: fileBuffer });
        const textResult = await pdf.getText();
        rawText = textResult.text;
      }

      await Resume.findByIdAndUpdate(resumeId, { textContent: rawText });

      // 1b. Run Comprehend NLP analysis (if configured)
      let comprehendAnalysis: any = null;
      if (config.comprehend.endpoint || config.nodeEnv === 'production') {
        try {
          comprehendAnalysis = await comprehendService.analyzeResumeQuality(rawText);
          logger.info({ resumeId }, 'Comprehend analysis completed');
        } catch (comprehendError: any) {
          logger.warn({ resumeId, error: comprehendError.message }, 'Comprehend analysis failed (non-blocking)');
        }
      }

      // 2. Build prompt for AI
      const prompt = `
# AI Resume Intelligence Prompt – Core Strengths, Interests & Work Style Analysis

## System Role
You are an expert AI Career Intelligence Advisor, Career Coach, HR Specialist, Technical Recruiter, Organizational Psychologist, and Workforce Analyst. Your goal is to analyze a student's resume holistically—not just from a technical perspective, but also from the perspective of personality, motivation, communication style, leadership potential, preferred work environment, and long-term career fit.

Many Computer Science students are encouraged to pursue Software Development Engineer (SDE) roles by default. Your responsibility is to identify whether the resume genuinely supports this path or whether the candidate may be better suited for alternative technology careers.

Base every conclusion only on the information explicitly available in the resume. If evidence is insufficient, state that clearly instead of making assumptions.

---
## Resume Analysis Tasks

### 1. Resume Overview
Provide a concise summary of the candidate's profile, education, technical background, achievements, and overall career readiness.

### 2. Hard Skills Extraction
Identify and categorize all technical competencies found in the resume.
For each skill include: Skill Name, Category, Proficiency Level (Beginner, Intermediate, Advanced), Evidence from Resume, Confidence Score (0–100)

### 3. Project Analysis
Extract every project and identify: Project Name, Technologies Used, Domain, Complexity, Candidate's Contribution, Technical Skills Demonstrated, Soft Skills Demonstrated, Business Value, Innovation Level, Leadership Evidence, Teamwork Evidence, Communication Evidence, and an overall quality assessment.

### 4. Interest & Passion Detection
Analyze the resume for activities, wording, achievements, responsibilities, and accomplishments that reveal genuine interests rather than assumed preferences.
For every inferred interest include: Interest, Evidence, Why it indicates genuine interest, Confidence Score.

### 5. Work Style Signals
Infer preferred work style using only observable evidence (e.g. Individual vs Team, Coding vs Comm).
For every work style signal provide: Observation, Resume Evidence, Confidence Score.

### 6. Leadership Analysis
Identify leadership indicators.
Provide: Indicator, Evidence, Confidence Score.

### 7. Communication Analysis
Analyze communication ability.
Provide: Communication Strengths, Supporting Evidence, Confidence Score.

### 8. Personality Indicators (Evidence-Based)
Estimate personality characteristics using only resume evidence (e.g. Curiosity, Persistence).
For each: Trait, Resume Evidence, Confidence Score.

### 9. Potential Misalignment with Pure Software Development Roles
Determine whether the resume provides strong evidence for a traditional Software Development Engineer career. If not, explain objectively.
Distinguish between Evidence-Based Findings and Assumptions to Avoid. Is it misaligned? Provide explanation.

### 10. Overall Core Strengths
Summarize the strongest qualities in: Technical Ability, Problem Solving, Leadership, Communication, Collaboration, Innovation, Learning Ability, Professional Readiness.

---
Resume Text:
"""
${rawText}
"""

Return ONLY valid JSON matching the exact TypeScript interface "ResumeAnalysis". Do not include markdown formatting.
      `;

      // 3. Parse with AI
      const analysisData = await this.aiProvider.generateJSON<Partial<ResumeAnalysis>>(prompt);

      // 4. Update Database — include Comprehend results alongside AI analysis
      const updateData: any = {
        status: 'complete',
        analysis: analysisData,
      };
      if (comprehendAnalysis) {
        updateData.comprehendAnalysis = comprehendAnalysis;
      }

      await Resume.findByIdAndUpdate(resumeId, updateData);

      const durationMs = Date.now() - startTime;

      // 5. Publish CloudWatch metrics for processing success
      cloudWatchService.recordResumeProcessing('success', durationMs).catch((err) => {
        logger.warn({ error: err.message }, 'CloudWatch metric publish failed (non-blocking)');
      });

      // 6. Send SQS message to embedding-generation queue (if configured)
      if (config.sqs.embeddingQueueUrl) {
        sqsService.sendMessage('embedding-generation', {
          type: 'resume-embedding-update',
          resumeId,
          timestamp: new Date().toISOString(),
        }).catch((err) => {
          logger.warn({ error: err.message }, 'SQS embedding queue message failed (non-blocking)');
        });
      }

      logger.info(`Resume processing complete for ID: ${resumeId}`);
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      logger.error(`Resume processing failed for ID ${resumeId}:`, error);
      await Resume.findByIdAndUpdate(resumeId, {
        status: 'failed',
        error: error.message,
      });

      // Publish CloudWatch metrics for processing failure
      cloudWatchService.recordResumeProcessing('failure', durationMs).catch((err) => {
        logger.warn({ error: err.message }, 'CloudWatch metric publish failed (non-blocking)');
      });
    }
  }
}
