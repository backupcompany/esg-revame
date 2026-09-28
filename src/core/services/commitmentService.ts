import { ESGCommitment, CommitmentStatus, EvidenceFile } from '../types';
import { apiGet, apiPost, apiPostForm } from './api';

function asCommitment(row: Record<string, unknown>): ESGCommitment {
  return {
    id: String(row.id),
    vendorId: String(row.vendorId ?? ''),
    actionId: String(row.actionId ?? ''),
    status: (row.status as CommitmentStatus) || 'In Progress',
    committedDate: String(row.committedDate || row.submittedAt || '').slice(0, 10),
    completedDate: row.verifiedAt ? String(row.verifiedAt).slice(0, 10) : undefined,
    quantityReported: Number(row.quantityReported || 1),
    notes: typeof row.notes === 'string' ? row.notes : undefined,
    evidenceFiles: Array.isArray(row.evidenceFiles) ? (row.evidenceFiles as EvidenceFile[]) : [],
    verificationFeedback: typeof row.verificationFeedback === 'string' ? row.verificationFeedback : undefined,
    verifiedAt: row.verifiedAt ? String(row.verifiedAt).slice(0, 10) : undefined,
    verifiedBy: typeof row.verifiedBy === 'string' ? row.verifiedBy : undefined,
    aiVerificationScore: typeof row.aiVerificationScore === 'number' ? row.aiVerificationScore : undefined,
  };
}

export class CommitmentService {
  public async getVendorCommitments(_vendorId?: string): Promise<ESGCommitment[]> {
    const data = await apiGet<{ actions: Record<string, unknown>[] }>('/api/actions?limit=100&offset=0');
    return (data?.actions ?? []).map(asCommitment);
  }

  public async createCommitment(actionId: string, _vendorId?: string): Promise<ESGCommitment> {
    const saved = await apiPost<{ success: boolean; commitment: Record<string, unknown> }>(
      '/api/actions/commit',
      { actionId }
    );
    if (!saved?.commitment) throw new Error('commit failed');
    return asCommitment(saved.commitment);
  }

  public async submitEvidence(
    commitmentId: string,
    notes: string,
    quantityReported: number,
    evidenceFiles: EvidenceFile[]
  ): Promise<ESGCommitment> {
    const form = new FormData();
    form.append('notes', notes);
    form.append('quantityReported', String(Math.max(1, quantityReported)));
    for (const f of evidenceFiles) {
      if (f.blob) form.append('files', f.blob, f.fileName);
    }
    const saved = await apiPostForm<{ success: boolean }>(`/api/actions/${encodeURIComponent(commitmentId)}/evidence`, form);
    if (!saved?.success) throw new Error('evidence upload failed');
    const list = await this.getVendorCommitments();
    const found = list.find(c => c.id === commitmentId);
    if (!found) throw new Error('commitment not found');
    return found;
  }

  public async updateStatus(
    commitmentId: string,
    status: CommitmentStatus,
    feedback?: string,
    _verifiedBy: string = 'Procurement ESG Auditor'
  ): Promise<ESGCommitment> {
    if (status !== 'Verified' && status !== 'Needs Info') {
      throw new Error('status must be Verified or Needs Info');
    }
    const saved = await apiPost<{ success: boolean }>(`/api/admin/audit/${encodeURIComponent(commitmentId)}`, {
      status,
      feedback,
    });
    if (!saved?.success) throw new Error('audit update failed');
    const list = await this.getVendorCommitments();
    const found = list.find(c => c.id === commitmentId);
    if (found) return found;
    return {
      id: commitmentId,
      vendorId: '',
      actionId: '',
      status,
      committedDate: '',
      quantityReported: 1,
      evidenceFiles: [],
      verificationFeedback: feedback,
    };
  }
}

export const commitmentService = new CommitmentService();
