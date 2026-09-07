import {
  AssessmentAnswerOption,
  AssessmentQuestion,
  AssessmentResult,
  MaturityLevelName,
  RecommendedActionItem,
  RecommendedModuleItem,
  AssessmentPillarResult,
  AssessmentHistoryItem
} from '../types';
import { ESGPillar } from '../../../core/types';
import { apiGet, apiPost } from '../../../core/services/api';

function emptyPillar(pillar: ESGPillar, title: string): AssessmentPillarResult {
  return { pillar, title, earnedPoints: 0, maxPoints: 0, percentage: 0, answeredCount: 0 };
}

function asAssessmentResult(raw: Partial<AssessmentResult> & Record<string, unknown>): AssessmentResult {
  const pillars = (raw.pillarResults || {}) as Record<string, AssessmentPillarResult>;
  const E = pillars.E || emptyPillar('E', 'Environmental');
  const S = pillars.S || emptyPillar('S', 'Social');
  const G = pillars.G || emptyPillar('G', 'Governance');
  const earned = Number(raw.totalEarnedPoints ?? E.earnedPoints + S.earnedPoints + G.earnedPoints) || 0;
  const max = Number(raw.totalMaxPoints ?? E.maxPoints + S.maxPoints + G.maxPoints) || 0;
  const prev = raw.previousResult as Partial<AssessmentHistoryItem> | null | undefined;
  return {
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : new Date().toISOString(),
    totalEarnedPoints: earned,
    totalMaxPoints: max,
    overallPercentage: Number(raw.overallPercentage) || 0,
    maturityLevel: (raw.maturityLevel as MaturityLevelName) || 'Starter',
    pillarResults: { E, S, G },
    answers: (raw.answers as AssessmentResult['answers']) || {},
    recommendedActions: Array.isArray(raw.recommendedActions) ? raw.recommendedActions : [],
    recommendedModules: Array.isArray(raw.recommendedModules) ? raw.recommendedModules : [],
    previousResult: prev && typeof prev === 'object' ? asHistoryItem(prev) : null,
    assessmentCount: Number(raw.assessmentCount) || 1,
  };
}

function asHistoryItem(raw: Partial<AssessmentHistoryItem> & Record<string, unknown>): AssessmentHistoryItem {
  return {
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : '',
    overallPercentage: Number(raw.overallPercentage) || 0,
    maturityLevel: (raw.maturityLevel as MaturityLevelName) || 'Starter',
    totalEarnedPoints: Number(raw.totalEarnedPoints) || 0,
  };
}

export class AssessmentService {
  async loadBank(): Promise<AssessmentQuestion[]> {
    const data = await apiGet<{ questions: AssessmentQuestion[] }>('/api/assessment/questions?limit=30');
    return data?.questions ?? [];
  }

  async saveResult(answers: Record<string, AssessmentAnswerOption>): Promise<AssessmentResult | null> {
    const remote = await apiPost<{
      success?: boolean;
      assessment?: Partial<AssessmentResult> & Record<string, unknown>;
    }>('/api/assessments', { answers });
    return remote?.assessment ? asAssessmentResult(remote.assessment) : null;
  }

  async getSavedResult(): Promise<AssessmentResult | null> {
    const remote = await apiGet<{ assessment: (Partial<AssessmentResult> & Record<string, unknown>) | null }>(
      '/api/assessments/latest'
    );
    return remote?.assessment ? asAssessmentResult(remote.assessment) : null;
  }

  async getAssessmentHistory(): Promise<AssessmentHistoryItem[]> {
    const remote = await apiGet<{ assessments: Array<Partial<AssessmentHistoryItem> & Record<string, unknown>> }>(
      '/api/assessments?limit=10'
    );
    return (remote?.assessments ?? []).map(asHistoryItem);
  }
}

export const assessmentService = new AssessmentService();
