export type ESGPillar = 'E' | 'S' | 'G';

export type ESGLevel = 'Starter' | 'Bronze' | 'Silver' | 'Gold' | 'Champion';

export type CommitmentStatus = 'Not Started' | 'In Progress' | 'Submitted' | 'Verified' | 'Needs Info';

export interface OnboardingData {
  companyName: string;
  industry: string;
  companySize: string;
  employeeCount: string;
  location: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  esgFamiliarity: string;
  esgObjectives: string[];
  completedAt?: string;
}

export interface VendorProfile {
  id: string;
  name: string;
  industry: string;
  companySize?: string;
  employeeCount: string;
  location: string;
  esgMaturityLevel: ESGLevel;
  esgScore: number; // 0 to 100
  joinedDate: string;
  logoUrl?: string;
  contactEmail: string;
  contactName: string;
  contactPhone?: string;
  isVerifiedVendor: boolean;
  sustainabilityGoal?: string;
  esgFamiliarity?: string;
  esgObjectives?: string[];
  hasCompletedOnboarding?: boolean;
  onboardingCompletedAt?: string;
}

export interface ESGAction {
  id: string;
  title: string;
  titleId?: string;
  description: string;
  descriptionId?: string;
  pillar: ESGPillar;
  category: string;
  categoryId?: string;
  difficulty: 'Starter' | 'Moderate' | 'Advanced';
  estimatedDays: number;
  impactMetricUnit: string;
  impactMetricUnitId?: string;
  impactMetricLabel: string;
  impactMetricLabelId?: string;
  defaultMetricName: keyof EcosystemImpactTotals;
  impactMultiplier: number; // e.g. 1 unit = 50 kwh or 1 tree
  iconName: string;
  imageUrl?: string;
  practicalTips: string[];
  practicalTipsId?: string[];
  requiredEvidenceType: 'photo' | 'document' | 'both';
  points: number;
  isActive?: boolean;
  source?: 'system' | 'partner_proposal' | 'excel_import';
  linkedModuleIds?: string[];
  linkedModuleId?: string;
  linkedModuleTitle?: string;
  relatedAssessmentQuestionIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type ProposalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Needs Revision';

export interface ProposedESGAction {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  titleId?: string;
  description: string;
  descriptionId?: string;
  pillar: ESGPillar;
  category: string;
  difficulty: 'Starter' | 'Moderate' | 'Advanced';
  estimatedDays: number;
  impactMetricUnit: string;
  impactMultiplier: number;
  suggestedPoints: number;
  rationale: string;
  proposedByEmail: string;
  proposedByName: string;
  suggestedEvidenceType: 'photo' | 'document' | 'both';
  imageUrl?: string;
  status: ProposalStatus;
  adminFeedback?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approvedActionId?: string;
}

export interface EvidenceFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'document';
  uploadedAt: string;
  aiNotes?: string;
  blob?: File;
}

export interface ESGCommitment {
  id: string;
  vendorId: string;
  actionId: string;
  status: CommitmentStatus;
  committedDate: string;
  completedDate?: string;
  quantityReported: number;
  notes?: string;
  evidenceFiles: EvidenceFile[];
  verificationFeedback?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  aiVerificationScore?: number;
}

export interface LessonQuiz {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  textContent: string;
  example: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  quiz: LessonQuiz;
}

export interface LearningModule {
  id: string;
  title: string;
  titleId?: string;
  pillar: ESGPillar;
  durationMinutes: number;
  points: number;
  description: string;
  descriptionId?: string;
  backgroundProblem?: string;
  esgBenefit?: string;
  badgeIcon: string;
  completed: boolean;
  levelRequired: number;
  coverImageUrl?: string;
  industrySector?: string;
  difficulty?: 'Starter' | 'Moderate' | 'Advanced';
  linkedActionId?: string;
  linkedActionTitle?: string;
  linkedActionIds?: string[];
  relatedAssessmentQuestionIds?: string[];
  author?: string;
  status?: 'published' | 'draft';
  tags?: string[];
  lessons: Lesson[];
  lessonCount?: number;
}

export interface EcosystemImpactTotals {
  treesPlanted: number;
  peopleBenefited: number;
  employeesTrained: number;
  wasteRecycledKg: number;
  plasticReducedKg: number;
  paperReducedKg: number;
  energySavedKwh: number;
  renewableGeneratedKwh: number;
  waterSavedLiters: number;
  communityBeneficiaries: number;
}

export interface EcosystemMetrics {
  id?: string;
  totalVendors: number;
  activeVendors: number;
  totalActionsCompleted: number;
  totalVerifiedCommitments: number;
  totals: EcosystemImpactTotals;
}

export interface AiLogEntry {
  id: string;
  timestamp: string;
  userSession: string;
  model: string;
  actionType: 'recommendation' | 'evidence_verification' | 'report_generation' | 'chat';
  tokensUsed: number;
  estimatedCost: number;
}

export type PrimaryTab = 'home' | 'assessment' | 'learn' | 'actions' | 'impact' | 'profile' | 'declaration';
