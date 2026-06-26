import mongoose from 'mongoose';

const roadmapWeekSchema = new mongoose.Schema(
  {
    weekNumber: { type: Number, required: true },
    focus: { type: String, required: true },
    activities: [{ type: String }],
    milestone: { type: String },
  },
  { _id: false }
);

const milestoneSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    weekNumber: { type: Number, required: true },
    criteria: [{ type: String }],
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const learningRoadmapSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetCareerId: { type: String, required: true },
    targetCareerTitle: { type: String, required: true },
    timeCommitmentHoursPerWeek: { type: Number, required: true },
    weeks: [roadmapWeekSchema],
    milestones: [milestoneSchema],
    estimatedCompletionDate: { type: String },
    progress: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const LearningRoadmap = mongoose.model('LearningRoadmap', learningRoadmapSchema);
