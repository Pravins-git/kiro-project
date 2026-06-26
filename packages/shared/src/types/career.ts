export interface CareerFitScore {
  total: number;
  technicalFit: number;
  interestFit: number;
  personalityFit: number;
  marketFit: number;
}

export type EvidenceStrength = 'Strong' | 'Moderate' | 'Suggestive';

export interface EvidencePoint {
  evidenceId: string;
  type: EvidenceStrength;
  source: 'resume' | 'assessment' | 'github' | 'linkedin' | 'portfolio';
  description: string;
  rawReference: string;
  weight: number;
}

export interface SalaryRange {
  min: number;
  max: number;
  median: number;
  currency: string;
  location?: string;
}

export interface MarketDemandScore {
  score: number;
  trend: 'rising' | 'stable' | 'declining';
  openPositions: number;
}

export interface CareerRecommendation {
  careerId: string;
  title: string;
  fitScore: CareerFitScore;
  confidenceScore: number;
  evidence: EvidencePoint[];
  salaryRange: SalaryRange;
  marketDemand: MarketDemandScore;
  readinessScore: number;
  category: 'Strong Match' | 'Emerging Match';
}

export interface RecommendationResponse {
  top5: CareerRecommendation[];
  alternatives: CareerRecommendation[];
  generatedAt: string;
  evidenceSources: string[];
}

export type SkillGapCategory = 'Critical' | 'Proficiency' | 'Optional';
export type Difficulty = 'Easy' | 'Moderate' | 'Challenging' | 'Expert-level';

export interface SkillGap {
  skillId: string;
  skillName: string;
  category: SkillGapCategory;
  currentLevel: string | null;
  requiredLevel: string;
  severity: number;
  difficulty: Difficulty;
  estimatedTime: string;
  prerequisites: string[];
}

export interface RoadmapWeek {
  weekNumber: number;
  focus: string;
  activities: string[];
  milestone?: string;
}

export interface Milestone {
  id: string;
  title: string;
  weekNumber: number;
  criteria: string[];
  completed: boolean;
}

export interface LearningRoadmap {
  roadmapId: string;
  userId: string;
  targetCareerId: string;
  timeCommitmentHoursPerWeek: number;
  weeks: RoadmapWeek[];
  milestones: Milestone[];
  estimatedCompletionDate: string;
  progress: number;
}
