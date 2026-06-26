import mongoose, { Schema, Document } from 'mongoose';

export interface INegotiationMessage {
  role: 'system' | 'ai' | 'user';
  content: string;
  timestamp: Date;
}

export interface INegotiationSession extends Document {
  userId: string;
  targetRole: string;
  initialOffer: number;
  currentOffer: number;
  status: 'active' | 'completed';
  messages: INegotiationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema({
  role: { type: String, enum: ['system', 'ai', 'user'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const negotiationSessionSchema = new Schema({
  userId: { type: String, required: true, index: true },
  targetRole: { type: String, required: true },
  initialOffer: { type: Number, required: true },
  currentOffer: { type: Number, required: true },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  messages: [messageSchema],
}, { timestamps: true });

export const NegotiationSession = mongoose.model<INegotiationSession>('NegotiationSession', negotiationSessionSchema);
