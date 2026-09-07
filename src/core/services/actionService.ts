import { ESGAction, ESGPillar, ProposedESGAction, ProposalStatus } from '../types';
import { apiDelete, apiGet, apiPost } from './api';
import { PLACEHOLDER_IMAGE } from '../ui/assets';

export class ActionService {
  public async getActions(pillarFilter?: ESGPillar | 'ALL', searchQuery?: string, activeOnly: boolean = false): Promise<ESGAction[]> {
    const params = new URLSearchParams({ limit: '100', offset: '0' });
    if (pillarFilter && pillarFilter !== 'ALL') params.set('pillar', pillarFilter);
    if (searchQuery?.trim()) params.set('q', searchQuery.trim().slice(0, 80));
    if (!activeOnly) params.set('includeInactive', '1');
    const data = await apiGet<{ actions: ESGAction[] }>(`/api/catalog/actions?${params}`);
    return (data?.actions ?? []).map(normalizeAction);
  }

  public async getActionById(id: string): Promise<ESGAction | undefined> {
    const data = await apiGet<{ action: ESGAction }>(`/api/catalog/actions/${encodeURIComponent(id)}`);
    return data?.action ? normalizeAction(data.action) : undefined;
  }

  public async createOrUpdateAction(actionData: Partial<ESGAction>): Promise<ESGAction> {
    const id = actionData.id || `act_${crypto.randomUUID()}`;
    const fullAction: ESGAction = {
      id,
      title: actionData.title || 'Untitled Action',
      titleId: actionData.titleId || actionData.title || 'Inisiatif Aksi ESG',
      description: actionData.description || '',
      descriptionId: actionData.descriptionId || actionData.description || '',
      pillar: actionData.pillar || 'E',
      category: actionData.category || 'General Sustainability',
      categoryId: actionData.categoryId || 'Keberlanjutan Umum',
      difficulty: actionData.difficulty || 'Starter',
      estimatedDays: actionData.estimatedDays || 7,
      impactMetricUnit: actionData.impactMetricUnit || 'Units',
      impactMetricUnitId: actionData.impactMetricUnitId || actionData.impactMetricUnit || 'Unit',
      impactMetricLabel: actionData.impactMetricLabel || 'Impact Generated',
      impactMetricLabelId: actionData.impactMetricLabelId || 'Dampak Dihasilkan',
      defaultMetricName: actionData.defaultMetricName || 'energySavedKwh',
      impactMultiplier: actionData.impactMultiplier || 10,
      iconName: actionData.iconName || 'Zap',
      imageUrl: actionData.imageUrl || PLACEHOLDER_IMAGE,
      practicalTips: actionData.practicalTips || ['Implement step-by-step', 'Collect photographic evidence'],
      practicalTipsId: actionData.practicalTipsId || ['Terapkan secara bertahap', 'Kumpulkan dokumentasi bukti audit'],
      requiredEvidenceType: actionData.requiredEvidenceType || 'both',
      points: actionData.points || 100,
      isActive: actionData.isActive !== false,
      source: actionData.source || 'system',
      createdAt: actionData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await apiPost<{ success: boolean; id: string }>('/api/admin/catalog/actions', fullAction);
    if (!saved?.success) throw new Error('catalog save failed');
    return fullAction;
  }

  public async deleteAction(id: string): Promise<void> {
    const ok = await apiDelete(`/api/admin/catalog/actions/${encodeURIComponent(id)}`);
    if (!ok) throw new Error('catalog delete failed');
  }

  public async toggleActionStatus(id: string): Promise<ESGAction | undefined> {
    const action = await this.getActionById(id);
    if (!action) return undefined;
    action.isActive = !(action.isActive !== false);
    return this.createOrUpdateAction(action);
  }

  public async importActionsFromExcel(actions: Partial<ESGAction>[]): Promise<{ importedCount: number; errors: string[] }> {
    const errors: string[] = [];
    const validActions: ESGAction[] = [];

    for (let i = 0; i < actions.length; i++) {
      const row = actions[i];
      if (!row.title && !row.titleId) {
        errors.push(`Baris ${i + 1}: Judul Aksi (title/titleId) tidak boleh kosong`);
        continue;
      }

      const id = row.id && row.id.trim().length > 0 
        ? row.id.trim().toLowerCase().replace(/\s+/g, '_')
        : `act_xl_${Date.now()}_${i}`;

      const pillar: ESGPillar = (row.pillar === 'E' || row.pillar === 'S' || row.pillar === 'G') 
        ? row.pillar 
        : 'E';

      const validAction: ESGAction = {
        id,
        title: row.title || row.titleId || 'Untitled Action',
        titleId: row.titleId || row.title || 'Inisiatif Aksi ESG',
        description: row.description || row.descriptionId || '',
        descriptionId: row.descriptionId || row.description || '',
        pillar,
        category: row.category || 'General',
        categoryId: row.categoryId || row.category || 'Umum',
        difficulty: (row.difficulty === 'Starter' || row.difficulty === 'Moderate' || row.difficulty === 'Advanced') 
          ? row.difficulty 
          : 'Starter',
        estimatedDays: Number(row.estimatedDays) || 7,
        impactMetricUnit: row.impactMetricUnit || 'Units',
        impactMetricUnitId: row.impactMetricUnitId || row.impactMetricUnit || 'Unit',
        impactMetricLabel: row.impactMetricLabel || 'Impact',
        impactMetricLabelId: row.impactMetricLabelId || 'Dampak',
        defaultMetricName: (row.defaultMetricName as any) || 'energySavedKwh',
        impactMultiplier: Number(row.impactMultiplier) || 50,
        iconName: row.iconName || 'Zap',
        imageUrl: row.imageUrl || PLACEHOLDER_IMAGE,
        practicalTips: Array.isArray(row.practicalTips) ? row.practicalTips : (typeof row.practicalTips === 'string' ? (row.practicalTips as string).split(';').map(s => s.trim()) : ['Follow procedure']),
        practicalTipsId: Array.isArray(row.practicalTipsId) ? row.practicalTipsId : (typeof row.practicalTipsId === 'string' ? (row.practicalTipsId as string).split(';').map(s => s.trim()) : ['Ikuti prosedur standar']),
        requiredEvidenceType: (row.requiredEvidenceType === 'photo' || row.requiredEvidenceType === 'document' || row.requiredEvidenceType === 'both') 
          ? row.requiredEvidenceType 
          : 'both',
        points: Number(row.points) || 100,
        isActive: true,
        source: 'excel_import',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      validActions.push(validAction);
    }

    if (validActions.length > 100) {
      errors.push('Max 100 actions per import');
      validActions.length = 100;
    }

    let importedCount = 0;
    for (const act of validActions) {
      const saved = await this.createOrUpdateAction(act);
      if (saved) importedCount++;
    }
    return { importedCount, errors };
  }

  public async getProposedActions(statusFilter?: ProposalStatus | 'ALL'): Promise<ProposedESGAction[]> {
    const params = new URLSearchParams({ limit: '50', offset: '0' });
    if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter);
    const data = await apiGet<{ proposals: ProposedESGAction[] }>(`/api/proposals?${params}`);
    return data?.proposals ?? [];
  }

  public async getProposedActionsByVendor(_vendorId: string): Promise<ProposedESGAction[]> {
    const data = await apiGet<{ proposals: ProposedESGAction[] }>('/api/proposals?limit=50&offset=0');
    return (data?.proposals ?? []).filter(p => p.vendorId === _vendorId);
  }

  public async submitProposal(proposalData: Omit<ProposedESGAction, 'id' | 'status' | 'submittedAt'>): Promise<ProposedESGAction> {
    const saved = await apiPost<{ success: boolean; id: string }>('/api/proposals', proposalData);
    if (!saved?.success) throw new Error('proposal save failed');
    return {
      ...proposalData,
      id: saved.id,
      status: 'Pending',
      submittedAt: new Date().toISOString().split('T')[0],
    };
  }

  public async approveProposal(proposalId: string, _overrides?: Partial<ESGAction>): Promise<{ approvedAction: ESGAction; proposal: ProposedESGAction }> {
    const reviewed = await apiPost<{ success: boolean; approvedActionId?: string }>(
      `/api/admin/proposals/${encodeURIComponent(proposalId)}/review`,
      { status: 'Approved', feedback: 'Approved' }
    );
    if (reviewed?.success) {
      const action = reviewed.approvedActionId
        ? await this.getActionById(reviewed.approvedActionId)
        : undefined;
      const proposals = await this.getProposedActions('ALL');
      const proposal = proposals.find(p => p.id === proposalId);
      if (action && proposal) return { approvedAction: action, proposal };
    }
    throw new Error('Proposal not found');
  }

  public async reviewProposal(proposalId: string, status: ProposalStatus, feedback: string): Promise<ProposedESGAction> {
    const reviewed = await apiPost<{ success: boolean }>(
      `/api/admin/proposals/${encodeURIComponent(proposalId)}/review`,
      { status, feedback }
    );
    if (reviewed?.success) {
      const list = await this.getProposedActions('ALL');
      const found = list.find(p => p.id === proposalId);
      if (found) return found;
    }
    throw new Error('Proposal not found');
  }
}

function normalizeAction(a: ESGAction): ESGAction {
  return {
    ...a,
    practicalTips: Array.isArray(a.practicalTips) ? a.practicalTips : [],
    practicalTipsId: Array.isArray(a.practicalTipsId) ? a.practicalTipsId : [],
    isActive: a.isActive !== false,
  };
}

export const actionService = new ActionService();
