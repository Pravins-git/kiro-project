export type FileType = 'pdf' | 'docx' | 'png' | 'jpg' | 'jpeg';

export interface HardSkill {
  skillName: string;
  category: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  evidenceFromResume: string;
  confidenceScore: number;
}

export interface ProjectAnalysis {
  projectName: string;
  technologiesUsed: string[];
  domain: string;
  complexity: string;
  candidateContribution: string;
  technicalSkillsDemonstrated: string[];
  softSkillsDemonstrated: string[];
  businessValue: string;
  innovationLevel: string;
  leadershipEvidence: string;
  teamworkEvidence: string;
  communicationEvidence: string;
  overallQualityAssessment: string;
}

export interface InferredInterest {
  interest: string;
  evidence: string;
  whyItIndicatesGenuineInterest: string;
  confidenceScore: number;
}

export interface WorkStyleSignal {
  observation: string;
  resumeEvidence: string;
  confidenceScore: number;
}

export interface LeadershipAnalysis {
  indicator: string;
  evidence: string;
  confidenceScore: number;
}

export interface CommunicationAnalysis {
  communicationStrengths: string;
  supportingEvidence: string;
  confidenceScore: number;
}

export interface PersonalityIndicator {
  trait: string;
  resumeEvidence: string;
  confidenceScore: number;
}

export interface SdeMisalignment {
  evidenceBasedFindings: string;
  assumptionsToAvoid: string;
  isMisaligned: boolean;
  explanation: string;
}

export interface CoreStrengths {
  technicalAbility: string;
  problemSolving: string;
  leadership: string;
  communication: string;
  collaboration: string;
  innovation: string;
  learningAbility: string;
  professionalReadiness: string;
}

export interface ResumeAnalysis {
  resumeId?: string;
  status?: 'complete' | 'processing' | 'failed';
  resumeOverview: string;
  coreStrengths: CoreStrengths;
  hardSkills: HardSkill[];
  projectAnalysis: ProjectAnalysis[];
  inferredInterestsAndPassions: InferredInterest[];
  workStyleSignals: WorkStyleSignal[];
  leadershipAnalysis: LeadershipAnalysis[];
  communicationAnalysis: CommunicationAnalysis;
  personalityIndicators: PersonalityIndicator[];
  potentialMisalignmentWithPureSdeRoles: SdeMisalignment;
  evidenceSummary: string;
  overallConfidenceScore: number;
}

export interface ResumeUploadResponse {
  resumeId: string;
  version: number;
  status: 'processing' | 'queued';
  estimatedCompletionSeconds: number;
}
