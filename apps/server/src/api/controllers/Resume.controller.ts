import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

import { config } from '../../config/index.js';
import { logger } from '../../shared/logger.js';
import { Resume } from '../models/Resume.model.js';
import { ResumeParserService } from '../services/ResumeParser.service.js';
import { cloudWatchService } from '../services/aws/CloudWatch.service.js';
import { sqsService } from '../services/aws/SQS.service.js';
import { s3Service } from '../services/aws/S3.service.js';

// Setup multer for memory storage before streaming to S3
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'));
    }
  },
});

const parserService = new ResumeParserService();

export const uploadResume = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    // Ensure user is attached via auth middleware
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    let fileUrl = '';
    try {
      // 1. Upload to S3
      fileUrl = await s3Service.uploadFile(userId, file.originalname, file.buffer, file.mimetype);
    } catch (s3Error) {
      console.error('Failed to upload to S3, falling back to in-memory processing only.', s3Error);
    }

    // 2. Create a new Resume entry in DB
    const resume = new Resume({
      userId,
      originalFileName: file.originalname,
      fileUrl,
      status: 'uploaded',
    });
    await resume.save();

    // 3. Record upload CloudWatch metric
    cloudWatchService.putMetricData({
      metricName: 'ResumeUploadCount',
      value: 1,
      unit: 'Count' as any,
      dimensions: { UserId: userId },
    }).catch((err) => {
      logger.warn({ error: err.message }, 'CloudWatch upload metric failed (non-blocking)');
    });

    // 4. Trigger processing — via SQS queue if configured, else direct call
    if (config.sqs.resumeQueueUrl) {
      // Send to SQS for async processing
      sqsService.sendMessage('resume-processing', {
        type: 'resume-process',
        resumeId: resume._id.toString(),
        userId,
        fileUrl,
        originalFileName: file.originalname,
        timestamp: new Date().toISOString(),
      }).catch((err) => {
        logger.error({ error: err.message, resumeId: resume._id }, 'SQS resume queue send failed, falling back to direct processing');
        // Fallback to direct processing if SQS fails
        parserService.processResume(resume._id.toString(), file.buffer).catch((parseErr) => {
          console.error('Background parsing failed:', parseErr);
        });
      });
    } else {
      // Fire and forget parsing so we don't block the request
      parserService.processResume(resume._id.toString(), file.buffer).catch((err) => {
        console.error('Background parsing failed:', err);
      });
    }

    // 5. Return immediate response
    res.status(201).json({
      message: 'Resume uploaded successfully. Processing started.',
      data: {
        resumeId: resume._id,
        status: resume.status,
      },
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const getResumeAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);

    if (!resume) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }

    if (resume.userId.toString() !== req.user?.userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.status(200).json({ data: resume });
    return;
  } catch (error) {
    next(error);
  }
};
