import { vendorService } from '../../../core/services/vendorService';
import { VendorProfile, OnboardingData, ESGLevel } from '../../../core/types';
import { OnboardingFormState } from '../types';

export class OnboardingService {
  public async getInitialFormData(): Promise<OnboardingFormState> {
    const profile = await vendorService.getProfile();
    return {
      companyName: profile.name || '',
      industry: profile.industry || '',
      companySize: profile.companySize || 'Small (10-49 employees)',
      employeeCount: profile.employeeCount || '',
      location: profile.location || '',
      contactName: profile.contactName || '',
      contactEmail: profile.contactEmail || '',
      contactPhone: profile.contactPhone || '',
      esgFamiliarity: profile.esgFamiliarity || 'getting_started',
      esgObjectives: profile.esgObjectives || ['env_impact', 'employee_wellbeing']
    };
  }

  public async saveOnboardingData(data: OnboardingFormState): Promise<VendorProfile> {
    const now = new Date().toISOString();
    
    // Map familiarity ID to maturity level if appropriate
    let maturityLevel: ESGLevel = 'Starter';
    if (data.esgFamiliarity === 'several_activities') maturityLevel = 'Bronze';
    if (data.esgFamiliarity === 'structured_programs') maturityLevel = 'Silver';
    if (data.esgFamiliarity === 'publish_reports') maturityLevel = 'Gold';

    const updates: Partial<VendorProfile> = {
      name: data.companyName,
      industry: data.industry,
      companySize: data.companySize,
      employeeCount: data.employeeCount || data.companySize,
      location: data.location,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      esgFamiliarity: data.esgFamiliarity,
      esgObjectives: data.esgObjectives,
      hasCompletedOnboarding: true,
      onboardingCompletedAt: now,
      esgMaturityLevel: maturityLevel
    };

    return vendorService.updateProfile(updates);
  }

  public async hasCompletedOnboarding(): Promise<boolean> {
    const profile = await vendorService.getProfile();
    return !!profile.hasCompletedOnboarding;
  }

  public async resetOnboarding(): Promise<void> {
    await vendorService.updateProfile({
      hasCompletedOnboarding: false
    });
  }
}

export const onboardingService = new OnboardingService();
