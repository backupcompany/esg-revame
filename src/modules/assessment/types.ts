import { ESGPillar } from '../../core/types';

export type AssessmentAnswerOption = 'yes' | 'partially' | 'not_yet' | 'na';

export interface AssessmentQuestion {
  id: string;
  pillar: ESGPillar;
  questionNumber: number;
  questionText: string;
  questionTextId?: string;
  whyWeAsk: string;
  whyWeAskId?: string;
  category: string;
  categoryId?: string;
  linkedActionIds?: string[];
  linkedModuleIds?: string[];
  recommendedAction?: RecommendedActionItem;
  recommendedModule?: RecommendedModuleItem;
}

export interface AssessmentPillarResult {
  pillar: ESGPillar;
  title: string;
  titleId?: string;
  earnedPoints: number;
  maxPoints: number;
  percentage: number;
  answeredCount: number;
}

export type MaturityLevelName = 'Starter' | 'Contributor' | 'Practitioner' | 'Leader';

export interface AssessmentHistoryItem {
  completedAt: string;
  overallPercentage: number;
  maturityLevel: MaturityLevelName;
  totalEarnedPoints: number;
}

export interface RecommendedActionItem {
  id: string;
  actionId?: string;
  pillar: ESGPillar;
  title: string;
  titleId?: string;
  description: string;
  descriptionId?: string;
  iconName: string;
  category: string;
  categoryId?: string;
  ctaText: string;
  ctaTextId?: string;
  priority: 'High' | 'Medium';
  points?: number;
  impactLabel?: string;
  impactLabelId?: string;
  triggeredByQuestionId?: string;
}

export interface RecommendedModuleItem {
  id: string;
  moduleId: string;
  pillar: ESGPillar;
  title: string;
  titleId?: string;
  description: string;
  descriptionId?: string;
  durationMinutes: number;
  points: number;
  badgeIcon: string;
  coverImageUrl?: string;
  reason: string;
  reasonId?: string;
  triggeredByQuestionId?: string;
}

export interface AssessmentResult {
  completedAt: string;
  totalEarnedPoints: number;
  totalMaxPoints: number;
  overallPercentage: number;
  maturityLevel: MaturityLevelName;
  pillarResults: Record<ESGPillar, AssessmentPillarResult>;
  answers: Record<string, AssessmentAnswerOption>;
  recommendedActions: RecommendedActionItem[];
  recommendedModules?: RecommendedModuleItem[];
  previousResult?: AssessmentHistoryItem | null;
  assessmentCount?: number;
}

