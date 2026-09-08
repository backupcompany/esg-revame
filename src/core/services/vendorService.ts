import { auth } from '../../lib/firebase';
import { VendorProfile, ESGLevel } from '../types';
import { apiFetch } from './api';

function asLevel(v: unknown): ESGLevel {
  if (v === 'Bronze' || v === 'Silver' || v === 'Gold' || v === 'Champion' || v === 'Starter') return v;
  if (v === 'Contributor') return 'Bronze';
  if (v === 'Practitioner') return 'Silver';
  if (v === 'Leader') return 'Gold';
  return 'Starter';
}

export class VendorService {
  public async getProfile(): Promise<VendorProfile> {
    let email = auth.currentUser?.email || '';
    let displayName = auth.currentUser?.displayName || '';
    try {
      const resMe = await apiFetch('/api/auth/me');
      const dataMe = resMe.ok ? await resMe.json() : null;
      if (!dataMe?.user) {
        return {
          id: '',
          name: '',
          industry: '',
          employeeCount: '',
          location: '',
          esgMaturityLevel: 'Starter' as ESGLevel,
          esgScore: 0,
          joinedDate: '',
          contactEmail: email,
          contactName: displayName,
          contactPhone: '',
          isVerifiedVendor: false,
          hasCompletedOnboarding: false,
        };
      }
      let serverVendor: Record<string, unknown> | null = dataMe.vendor ?? null;
      email = dataMe.user?.email || email;
      displayName = dataMe.user?.name || displayName;

      if (!serverVendor) {
        const res = await apiFetch('/api/vendors');
        if (res.ok) {
          const data = await res.json();
          serverVendor = data.vendor ?? null;
        }
      }

      if (serverVendor) {
        const objectives = Array.isArray(serverVendor.esgObjectives)
          ? (serverVendor.esgObjectives as string[])
          : [];
        const contactEmail = String(serverVendor.contactEmail || email);
        return {
          id: String(serverVendor.id),
          name: String(serverVendor.companyName || ''),
          industry: String(serverVendor.industry || ''),
          companySize: serverVendor.companySize ? String(serverVendor.companySize) : undefined,
          employeeCount: String(serverVendor.employeeCount || ''),
          location: String(serverVendor.address || ''),
          esgMaturityLevel: asLevel(serverVendor.esgMaturityLevel),
          esgScore: typeof serverVendor.esgScore === 'number' ? serverVendor.esgScore : 0,
          joinedDate: serverVendor.createdAt ? String(serverVendor.createdAt).substring(0, 10) : '',
          contactEmail,
          contactName: String(serverVendor.contactPerson || displayName || ''),
          contactPhone: String(serverVendor.phone || ''),
          isVerifiedVendor: serverVendor.verificationStatus === 'Verified',
          esgFamiliarity: serverVendor.esgFamiliarity ? String(serverVendor.esgFamiliarity) : undefined,
          esgObjectives: objectives,
          hasCompletedOnboarding: !!serverVendor.onboardingCompleted,
          onboardingCompletedAt: serverVendor.onboardingCompletedAt
            ? String(serverVendor.onboardingCompletedAt)
            : undefined,
        };
      }
    } catch (e) {
      console.warn("Failed to fetch vendor from server:", e);
    }
    return {
      id: '',
      name: '',
      industry: '',
      employeeCount: '',
      location: '',
      esgMaturityLevel: 'Starter',
      esgScore: 0,
      joinedDate: '',
      contactEmail: email,
      contactName: displayName,
      contactPhone: '',
      isVerifiedVendor: false,
      hasCompletedOnboarding: false,
    };
  }

  public async updateProfile(updates: Partial<VendorProfile>): Promise<VendorProfile> {
    const current = await this.getProfile();
    const updated = { ...current, ...updates };

    try {
      const res = await apiFetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: updated.name,
          industry: updated.industry,
          employeeCount: updated.employeeCount,
          contactPerson: updated.contactName,
          phone: updated.contactPhone,
          address: updated.location,
          companySize: updated.companySize,
          contactEmail: updated.contactEmail,
          esgFamiliarity: updated.esgFamiliarity,
          esgObjectives: updated.esgObjectives || [],
          onboardingCompleted: updated.hasCompletedOnboarding,
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'vendor update failed');
      }
    } catch (e) {
      console.warn("Failed to sync vendor update to server:", e);
      throw e;
    }

    return this.getProfile();
  }

  public calculateLevel(score: number): ESGLevel {
    if (score >= 86) return 'Gold';
    if (score >= 61) return 'Silver';
    if (score >= 36) return 'Bronze';
    return 'Starter';
  }

  public async addPointsAndRecalculate(_points: number): Promise<VendorProfile> {
    return this.getProfile();
  }
}

export const vendorService = new VendorService();
