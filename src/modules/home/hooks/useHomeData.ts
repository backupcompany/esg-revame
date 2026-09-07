import { useState, useEffect } from 'react';
import { vendorService } from '../../../core/services/vendorService';
import { commitmentService } from '../../../core/services/commitmentService';
import { actionService } from '../../../core/services/actionService';
import { impactService } from '../../../core/services/impactService';
import { aiService } from '../../../core/services/ai/AIService';
import { codeOfConductService } from '../../../modules/declaration/services/codeOfConductService';
import { CodeOfConductDeclaration } from '../../../modules/declaration/types';
import { VendorProfile, ESGCommitment, ESGAction, EcosystemMetrics, EcosystemImpactTotals } from '../../../core/types';

export function useHomeData() {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [commitments, setCommitments] = useState<ESGCommitment[]>([]);
  const [actions, setActions] = useState<ESGAction[]>([]);
  const [collectiveMetrics, setCollectiveMetrics] = useState<EcosystemMetrics | null>(null);
  const [vendorImpact, setVendorImpact] = useState<EcosystemImpactTotals | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<{ title: string; reason: string; priority: string }[]>([]);
  const [latestDeclaration, setLatestDeclaration] = useState<CodeOfConductDeclaration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reloadData = async () => {
    setIsLoading(true);
    try {
      const v = await vendorService.getProfile();
      const cmts = await commitmentService.getVendorCommitments(v.id);
      const acts = await actionService.getActions('ALL');
      const coll = await impactService.getCollectiveImpact();
      const vImp = await impactService.getVendorCumulativeImpact(v.id);
      const decl = await codeOfConductService.getLatestDeclarationForVendor(String(v.id));

      setVendor(v);
      setCommitments(cmts);
      setActions(acts);
      setCollectiveMetrics(coll);
      setVendorImpact(vImp);
      setLatestDeclaration(decl);

      // Load AI recommendations in background
      aiService.getRecommendedActions(v, v.esgMaturityLevel).then(recs => {
        setAiRecommendations(recs);
      });
    } catch (e) {
      console.error('Failed loading home data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  return {
    vendor,
    commitments,
    actions,
    collectiveMetrics,
    vendorImpact,
    aiRecommendations,
    latestDeclaration,
    isLoading,
    reloadData,
  };
}
