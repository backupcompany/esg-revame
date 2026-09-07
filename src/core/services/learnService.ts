import { LearningModule, ESGPillar } from '../types';
import { apiDelete, apiGet, apiPost, apiFetch } from './api';

export class LearnService {
  public async getAllModules(): Promise<LearningModule[]> {
    const data = await apiGet<{ modules: LearningModule[] }>('/api/learn/modules?limit=50&offset=0');
    return (data?.modules ?? []).map(m => ({
      ...m,
      lessons: Array.isArray(m.lessons) ? m.lessons : [],
      lessonCount: typeof m.lessonCount === 'number' ? m.lessonCount : (Array.isArray(m.lessons) ? m.lessons.length : 0),
      completed: !!m.completed,
      levelRequired: m.levelRequired || 0,
      badgeIcon: m.badgeIcon || 'BookOpen',
    }));
  }

  public async getModuleById(id: string): Promise<LearningModule | undefined> {
    const data = await apiGet<{ module: LearningModule }>(`/api/learn/modules/${encodeURIComponent(id)}`);
    if (!data?.module) return undefined;
    return {
      ...data.module,
      lessons: Array.isArray(data.module.lessons) ? data.module.lessons : [],
      lessonCount: Array.isArray(data.module.lessons) ? data.module.lessons.length : 0,
      completed: !!data.module.completed,
      levelRequired: data.module.levelRequired || 0,
      badgeIcon: data.module.badgeIcon || 'BookOpen',
    };
  }

  public async saveModule(module: LearningModule): Promise<LearningModule> {
    const saved = await apiPost<{ success: boolean }>('/api/admin/learn/modules', module);
    if (!saved?.success) throw new Error('module save failed');
    return module;
  }

  public async deleteModule(id: string): Promise<void> {
    const ok = await apiDelete(`/api/admin/learn/modules/${encodeURIComponent(id)}`);
    if (!ok) throw new Error('module delete failed');
  }

  public async completeModule(moduleId: string): Promise<LearningModule> {
    await apiPost('/api/learning', { moduleId, completed: true });
    const full = await this.getModuleById(moduleId);
    if (!full) throw new Error('Module not found');
    return { ...full, completed: true };
  }

  public async generateCourseWithAI(params: {
    topic: string;
    industry: string;
    pillar: ESGPillar;
    bitesCount?: number;
    linkedActionTitle?: string;
    linkedActionDescription?: string;
  }): Promise<Partial<LearningModule>> {
    const res = await apiFetch('/api/ai/generate-course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('course generate failed');
    const data = await res.json();
    if (data.fallback) throw new Error('AI unavailable');
    return data;
  }

  public async matchOrCreateActionsWithAI(params: {
    topic: string;
    pillar: ESGPillar;
    industry: string;
    courseTitle?: string;
    courseDescription?: string;
    existingActions?: any[];
  }): Promise<{
    matchedExistingActionIds: string[];
    matchReasoning: string;
    suggestedNewActions: any[];
  }> {
    const res = await apiFetch('/api/ai/match-or-create-actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      return { matchedExistingActionIds: [], matchReasoning: '', suggestedNewActions: [] };
    }
    const data = await res.json();
    return {
      matchedExistingActionIds: data.matchedExistingActionIds || [],
      matchReasoning: data.matchReasoning || '',
      suggestedNewActions: data.suggestedNewActions || [],
    };
  }
}

export const learnService = new LearnService();
