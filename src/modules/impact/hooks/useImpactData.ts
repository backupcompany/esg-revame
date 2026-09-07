import { useState, useEffect } from 'react';
import { impactService } from '../../../core/services/impactService';
import { commitmentService } from '../../../core/services/commitmentService';
import { actionService } from '../../../core/services/actionService';
import { vendorService } from '../../../core/services/vendorService';
import { aiService, EsgReportSummary } from '../../../core/services/ai/AIService';
import { ESGCommitment, ESGAction, EcosystemImpactTotals, VendorProfile, EvidenceFile } from '../../../core/types';

export function useImpactData() {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [commitments, setCommitments] = useState<ESGCommitment[]>([]);
  const [actions, setActions] = useState<ESGAction[]>([]);
  const [vendorImpact, setVendorImpact] = useState<EcosystemImpactTotals | null>(null);
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportSummary, setReportSummary] = useState<EsgReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const v = await vendorService.getProfile();
      const cmts = await commitmentService.getVendorCommitments(v.id);
      const acts = await actionService.getActions('ALL');
      const vImp = await impactService.getVendorCumulativeImpact(v.id);

      setVendor(v);
      setCommitments(cmts);
      setActions(acts);
      setVendorImpact(vImp);
    } catch (e) {
      console.error('Error loading impact data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitEvidenceReport = async (
    commitmentId: string,
    notes: string,
    quantityReported: number,
    files: EvidenceFile[]
  ) => {
    await commitmentService.submitEvidence(commitmentId, notes, quantityReported, files);
    await loadData();
    setSelectedCommitmentId(null);
  };

  const generateReport = async () => {
    if (!vendor) return;
    setIsGeneratingReport(true);
    try {
      const verifiedCount = commitments.filter(c => c.status === 'Verified').length;
      const summary = await aiService.generateReportSummary(
        vendor.name,
        vendor.esgMaturityLevel,
        vendorImpact,
        verifiedCount
      );
      if (summary) setReportSummary(summary);
    } catch (e) {
      console.error('Error generating report:', e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return {
    vendor,
    commitments,
    actions,
    vendorImpact,
    selectedCommitmentId,
    setSelectedCommitmentId,
    submitEvidenceReport,
    isGeneratingReport,
    reportSummary,
    setReportSummary,
    generateReport,
    isLoading,
    reloadData: loadData,
  };
}
