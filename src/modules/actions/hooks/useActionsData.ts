import { useState, useEffect } from 'react';
import { actionService } from '../../../core/services/actionService';
import { commitmentService } from '../../../core/services/commitmentService';
import { vendorService } from '../../../core/services/vendorService';
import { ESGAction, ESGPillar, ESGCommitment, ProposedESGAction, VendorProfile } from '../../../core/types';

export function useActionsData() {
  const [actions, setActions] = useState<ESGAction[]>([]);
  const [commitments, setCommitments] = useState<ESGCommitment[]>([]);
  const [vendorProposals, setVendorProposals] = useState<ProposedESGAction[]>([]);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [pillarFilter, setPillarFilter] = useState<ESGPillar | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<ESGAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');
  const [lang, setLang] = useState<'ID' | 'EN'>('ID');
  const [isProposeModalOpen, setIsProposeModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const acts = await actionService.getActions(pillarFilter, searchQuery, true);
      const profile = await vendorService.getProfile();
      const cmts = await commitmentService.getVendorCommitments(profile.id);
      const proposals = await actionService.getProposedActionsByVendor(profile.id);
      
      setActions(acts);
      setCommitments(cmts);
      setVendorProfile(profile);
      setVendorProposals(proposals);
    } catch (e) {
      console.error('Error loading actions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pillarFilter, searchQuery]);

  const commitToAction = async (actionId: string) => {
    setIsSubmitting(true);
    try {
      await commitmentService.createCommitment(actionId, vendorProfile?.id);
      await loadData();
      setSelectedAction(null);
    } catch (e) {
      console.error('Error committing to action:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitProposal = async (proposalData: Omit<ProposedESGAction, 'id' | 'status' | 'submittedAt'>) => {
    await actionService.submitProposal(proposalData);
    await loadData();
  };

  return {
    actions,
    commitments,
    vendorProposals,
    vendorProfile,
    pillarFilter,
    setPillarFilter,
    searchQuery,
    setSearchQuery,
    selectedAction,
    setSelectedAction,
    commitToAction,
    submitProposal,
    isSubmitting,
    isLoading,
    viewMode,
    setViewMode,
    lang,
    setLang,
    isProposeModalOpen,
    setIsProposeModalOpen,
    refreshData: loadData,
  };
}

