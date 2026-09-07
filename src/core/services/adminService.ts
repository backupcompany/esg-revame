import { commitmentService } from './commitmentService';
import { impactService } from './impactService';
import { ESGCommitment, EcosystemMetrics } from '../types';
import { apiGet } from './api';

export class AdminService {
  public async getVerificationQueue(): Promise<{ commitment: ESGCommitment; vendorName: string; actionTitle: string }[]> {
    const data = await apiGet<{
      items: { commitment: ESGCommitment; vendorName: string; actionTitle: string }[];
    }>('/api/admin/audit-queue?status=Submitted&limit=50&offset=0');
    return data?.items ?? [];
  }

  public async verifyCommitment(commitmentId: string, feedback: string = 'Approved by Orchestrator'): Promise<ESGCommitment> {
    return commitmentService.updateStatus(commitmentId, 'Verified', feedback, 'Ecosystem ESG Lead');
  }

  public async requestInformation(commitmentId: string, feedback: string): Promise<ESGCommitment> {
    return commitmentService.updateStatus(commitmentId, 'Needs Info', feedback, 'Ecosystem ESG Lead');
  }

  public async getEcosystemOverview(): Promise<{ metrics: EcosystemMetrics; vendorCount: number }> {
    const data = await apiGet<{ metrics: EcosystemMetrics; vendorCount: number }>('/api/admin/overview');
    if (data?.metrics) {
      return { metrics: data.metrics, vendorCount: data.vendorCount };
    }
    const metrics = await impactService.getCollectiveImpact();
    return { metrics, vendorCount: metrics.totalVendors };
  }
}

export const adminService = new AdminService();
