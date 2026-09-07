import { apiFetch } from '../api';

export interface ActionRecommendation {
  title: string;
  reason: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface EvidenceVerificationResult {
  status: 'Verified' | 'Needs Information' | 'Pending';
  confidenceScore: number;
  feedback: string;
  suggestedMetrics?: {
    estimatedUnit: string;
    estimatedValue: number;
  };
}

export interface EsgReportSummary {
  summary: string;
  keyHighlights: string[];
  nextStepRecommendation: string;
}

export class AIService {
  public async getRecommendedActions(
    vendorProfile: unknown,
    currentLevel: string
  ): Promise<ActionRecommendation[]> {
    const res = await apiFetch('/api/ai/recommend-actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorProfile, currentLevel }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.recommendations) ? data.recommendations : [];
  }

  public async verifyEvidence(
    actionTitle: string,
    notes: string
  ): Promise<EvidenceVerificationResult> {
    const res = await apiFetch('/api/ai/verify-evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionTitle, notes }),
    });
    if (!res.ok) {
      return { status: 'Pending', confidenceScore: 0, feedback: 'AI verification unavailable.' };
    }
    return res.json();
  }

  public async generateReportSummary(
    vendorName: string,
    level: string,
    impacts: unknown,
    completedActionsCount: number
  ): Promise<EsgReportSummary | null> {
    const res = await apiFetch('/api/ai/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorName, level, impacts, completedActionsCount }),
    });
    if (!res.ok) return null;
    return res.json();
  }
}

export const aiService = new AIService();
