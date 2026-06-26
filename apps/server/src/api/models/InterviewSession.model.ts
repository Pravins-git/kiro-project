import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role: 'system' | 'ai' | 'user';
  content: string;
  timestamp: Date;
}

export interface IInterviewSession extends Document {
  userId: string;
  role: string;
  status: 'active' | 'completed';
  messages: IMessage[];
  feedback?: {
    starScore: number;
    strengths: string[];
    improvements: string[];
    overallFeedback: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema({
  role: { type: String, enum: ['system', 'ai', 'user'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const interviewSessionSchema = new Schema({
  userId: { type: String, required: true, index: true },
  role: { type: String, required: true },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  messages: [messageSchema],
  feedback: {
    starScore: Number,
    strengths: [String],
    improvements: [String],
    overallFeedback: String,
  }
}, { timestamps: true });

export const InterviewSession = mongoose.model<IInterviewSession>('InterviewSession', interviewSessionSchema);
