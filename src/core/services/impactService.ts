import { EcosystemMetrics, EcosystemImpactTotals } from '../types';
import { apiGet, publicGet } from './api';

const emptyTotals = (): EcosystemImpactTotals => ({
  treesPlanted: 0,
  peopleBenefited: 0,
  employeesTrained: 0,
  wasteRecycledKg: 0,
  plasticReducedKg: 0,
  paperReducedKg: 0,
  energySavedKwh: 0,
  renewableGeneratedKwh: 0,
  waterSavedLiters: 0,
  communityBeneficiaries: 0,
});

export class ImpactService {
  public async getVendorCumulativeImpact(_vendorId?: string): Promise<EcosystemImpactTotals> {
    const data = await apiGet<{ totals: EcosystemImpactTotals }>('/api/impacts/summary');
    return data?.totals ?? emptyTotals();
  }

  public async getCollectiveImpact(): Promise<EcosystemMetrics> {
    const pub = await publicGet<{ metrics: EcosystemMetrics }>('/api/public/metrics');
    if (pub?.metrics) return pub.metrics;
    const overview = await apiGet<{ metrics: EcosystemMetrics }>('/api/admin/overview');
    if (overview?.metrics) return overview.metrics;
    return {
      totalVendors: 0,
      activeVendors: 0,
      totalActionsCompleted: 0,
      totalVerifiedCommitments: 0,
      totals: emptyTotals(),
    };
  }
}

export const impactService = new ImpactService();
