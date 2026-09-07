/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PrimaryTab } from './core/types';
import { getInitialTheme, setTheme } from './core/ui/theme';
import { DesktopHeader, MobileBottomNav } from './core/ui/Navigation';
import { CelebrationModal } from './core/ui/FeedbackStates';
import { HomeView } from './modules/home/components/HomeView';
import { AssessmentView } from './modules/assessment/components/AssessmentView';
import { LearnView } from './modules/learn/components/LearnView';
import { ActionsView } from './modules/actions/components/ActionsView';
import { ImpactView } from './modules/impact/components/ImpactView';
import { ProfileView } from './modules/profile/components/ProfileView';
import { AdminView } from './modules/admin/components/AdminView';
import { CodeOfConductView } from './modules/declaration/components/CodeOfConductView';
import { OnboardingFlow } from './modules/onboarding/components/OnboardingFlow';
import { NewsletterLandingView } from './modules/newsletter/components/NewsletterLandingView';
import { AuthModal } from './core/ui/AuthModal';
import { useAuth } from './core/context/AuthContext';

export default function App() {
  const { dbUser, vendor, loading: authLoading, refreshAuth } = useAuth();
  const canAccessAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';
  const isOperator = canAccessAdmin;
  const needsOnboarding = Boolean(dbUser && vendor && !vendor.onboardingCompleted && !isOperator);

  // Main view router: 'public' (newsletter landing) | 'vendor' (vendor portal) | 'admin' (admin operations & CMS) | 'onboarding'
  const [currentView, setCurrentView] = useState<'public' | 'vendor' | 'admin' | 'onboarding'>('public');
  const [activeTab, setActiveTab] = useState<PrimaryTab>('home');
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [reportModalCommitmentId, setReportModalCommitmentId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (currentView === 'admin' && !canAccessAdmin) {
      setCurrentView('vendor');
    }
  }, [canAccessAdmin, currentView]);

  useEffect(() => {
    if (authLoading) return;
    if (!dbUser && (currentView === 'vendor' || currentView === 'admin' || currentView === 'onboarding')) {
      setCurrentView('public');
    }
  }, [authLoading, dbUser, currentView]);

  useEffect(() => {
    if (authLoading || !needsOnboarding) return;
    if (currentView !== 'onboarding') setCurrentView('onboarding');
  }, [authLoading, needsOnboarding, currentView]);

  // Celebration modal state
  const [celebration, setCelebration] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    badgeText?: string;
    pointsEarned?: number;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  useEffect(() => {
    const init = getInitialTheme();
    setThemeState(init);
    setTheme(init);
  }, []);

  const handleToggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    setTheme(next);
  };

  const handleOpenReportModal = (commitmentId: string) => {
    setReportModalCommitmentId(commitmentId);
    setActiveTab('impact');
    setCurrentView('vendor');
  };

  const handleFinishOnboarding = (targetTab?: PrimaryTab) => {
    void refreshAuth().then(() => {
      setCurrentView('vendor');
      if (targetTab) setActiveTab(targetTab);
    });
  };

  const handleNavigateToVendor = (tab: PrimaryTab = 'home') => {
    if (!dbUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!vendor && !isOperator) {
      setIsAuthModalOpen(true);
      return;
    }
    if (needsOnboarding) {
      setCurrentView('onboarding');
      return;
    }
    setActiveTab(tab);
    setCurrentView('vendor');
  };

  // 1. Onboarding View
  if (currentView === 'onboarding') {
    return <OnboardingFlow onComplete={handleFinishOnboarding} />;
  }

  // 2. Public Newsletter Landing View (Default for general public & unauthenticated visitors)
  if (currentView === 'public') {
    return (
      <>
        <NewsletterLandingView
          onNavigateToVendor={handleNavigateToVendor}
          onNavigateToAdmin={() => {
            if (canAccessAdmin) setCurrentView('admin');
            else setIsAuthModalOpen(true);
          }}
          onStartOnboarding={() => setIsAuthModalOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </>
    );
  }

  // 3. Authenticated Vendor Portal or Admin Operations
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans pb-20 md:pb-8 flex flex-col">
      {/* Primary Header */}
      <DesktopHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAdminMode={currentView === 'admin'}
        onToggleAdminMode={() => {
          if (canAccessAdmin) {
            setCurrentView(currentView === 'admin' ? 'vendor' : 'admin');
          } else {
            setIsAuthModalOpen(true);
          }
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        vendorLevel={vendor?.esgMaturityLevel || 'Starter'}
        onNavigateToPublic={() => setCurrentView('public')}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        canAccessAdmin={canAccessAdmin}
      />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Primary View Router */}
      <main className="flex-1 w-full">
        {currentView === 'admin' ? (
          <AdminView />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                onNavigate={setActiveTab}
                onOpenReportModal={handleOpenReportModal}
              />
            )}
            {activeTab === 'assessment' && <AssessmentView onNavigate={setActiveTab} />}
            {activeTab === 'learn' && <LearnView onNavigate={setActiveTab} />}
            {activeTab === 'actions' && <ActionsView />}
            {activeTab === 'impact' && (
              <ImpactView
                initialReportCommitmentId={reportModalCommitmentId}
                onNavigate={setActiveTab}
              />
            )}
            {activeTab === 'declaration' && <CodeOfConductView />}
            {activeTab === 'profile' && (
              <ProfileView
                theme={theme}
                onToggleTheme={handleToggleTheme}
                onStartOnboarding={() => setCurrentView('onboarding')}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation for Vendor */}
      {currentView === 'vendor' && (
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isAdminMode={false}
          onToggleAdminMode={() => {}}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onNavigateToPublic={() => setCurrentView('public')}
        />
      )}

      {/* Global Celebration Modal */}
      <CelebrationModal
        isOpen={celebration.isOpen}
        onClose={() => setCelebration({ ...celebration, isOpen: false })}
        title={celebration.title}
        description={celebration.description}
        badgeText={celebration.badgeText}
        pointsEarned={celebration.pointsEarned}
      />
    </div>
  );
}
