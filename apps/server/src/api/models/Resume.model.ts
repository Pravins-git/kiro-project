import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
  breakdown: { type: Map, of: Number, default: {} },
}, { _id: false });

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalFileName: { type: String, required: true },
  fileUrl: { type: String },
  textContent: { type: String }, // Raw extracted text
  status: { 
    type: String, 
    enum: ['uploaded', 'processing', 'complete', 'failed'], 
    default: 'uploaded' 
  },
  analysis: {
    qualityScore: scoreSchema,
    atsScore: scoreSchema,
    skills: [mongoose.Schema.Types.Mixed],
    projects: [mongoose.Schema.Types.Mixed],
    experience: [mongoose.Schema.Types.Mixed],
    education: [mongoose.Schema.Types.Mixed],
    certifications: [mongoose.Schema.Types.Mixed],
    improvements: [mongoose.Schema.Types.Mixed],
    confidenceScore: { type: Number },
  },
  error: { type: String },
  version: { type: Number, default: 1 },
}, { timestamps: true });

export const Resume = mongoose.model('Resume', resumeSchema);
