import { useState, useEffect } from 'react';
import { adminService } from '../../../core/services/adminService';
import { ESGCommitment, EcosystemMetrics } from '../../../core/types';

export function useAdminData() {
  const [queue, setQueue] = useState<{ commitment: ESGCommitment; vendorName: string; actionTitle: string }[]>([]);
  const [metrics, setMetrics] = useState<EcosystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const q = await adminService.getVerificationQueue();
      const overview = await adminService.getEcosystemOverview();

      setQueue(q);
      setMetrics(overview.metrics);
    } catch (e) {
      console.error('Error loading admin queue:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const verifyCommitment = async (commitmentId: string, feedback?: string) => {
    await adminService.verifyCommitment(commitmentId, feedback);
    await loadData();
  };

  const requestInformation = async (commitmentId: string, feedback: string) => {
    await adminService.requestInformation(commitmentId, feedback);
    await loadData();
  };

  return {
    queue,
    metrics,
    verifyCommitment,
    requestInformation,
    isLoading,
    reloadQueue: loadData,
  };
}
