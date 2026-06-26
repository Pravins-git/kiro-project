import { FileType } from './resume';

export interface ResumeQueueMessage {
  messageType: 'RESUME_PROCESS';
  userId: string;
  resumeId: string;
  s3Key: string;
  fileType: FileType;
  uploadedAt: string;
  retryCount: number;
}

export interface CareerQueueMessage {
  messageType: 'CAREER_GENERATE';
  userId: string;
  triggers: ('resume_complete' | 'assessment_complete' | 'profile_updated')[];
  priority: 'high' | 'normal';
}

export interface EmbeddingQueueMessage {
  messageType: 'EMBEDDING_GENERATE';
  entityType: 'student_profile' | 'career_path' | 'skill';
  entityId: string;
  text: string;
  metadata: Record<string, unknown>;
}

export type QueueMessage = ResumeQueueMessage | CareerQueueMessage | EmbeddingQueueMessage;
