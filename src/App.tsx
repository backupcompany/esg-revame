/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

const PLACE_KEY = 'esg_portal_place';
const VIEWS = ['public', 'vendor', 'admin', 'onboarding'] as const;
const TABS: PrimaryTab[] = ['home', 'assessment', 'learn', 'actions', 'impact', 'profile', 'declaration'];

function readPlace(): { view: (typeof VIEWS)[number]; tab: PrimaryTab } {
  try {
    const raw = sessionStorage.getItem(PLACE_KEY);
    if (!raw) return { view: 'public', tab: 'home' };
    const p = JSON.parse(raw) as { view?: string; tab?: string };
    const view = VIEWS.find(v => v === p.view) ?? 'public';
    const tab = TABS.find(t => t === p.tab) ?? 'home';
    return { view, tab };
  } catch {
    return { view: 'public', tab: 'home' };
  }
}

function AuthGateOverlay({ kind }: { kind: 'in' | 'out' }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] grid h-dvh w-dvw place-items-center bg-black/30 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div
        className={`h-10 w-10 rounded-full animate-spin border-[3px] border-t-transparent ${
          kind === 'out' ? 'border-blue-500' : 'border-emerald-500'
        }`}
      />
    </div>,
    document.body,
  );
}

export default function App() {
  const { dbUser, vendor, loading: authLoading, authGate, refreshAuth } = useAuth();
  const canAccessAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';
  const isOperator = canAccessAdmin;
  const needsOnboarding = Boolean(dbUser && vendor && !vendor.onboardingCompleted && !isOperator);

  // Main view router: 'public' (newsletter landing) | 'vendor' (vendor portal) | 'admin' (admin operations & CMS) | 'onboarding'
  const [currentView, setCurrentView] = useState<(typeof VIEWS)[number]>(() => readPlace().view);
  const [activeTab, setActiveTab] = useState<PrimaryTab>(() => readPlace().tab);
  const [theme, setThemeState] = useState<'light' | 'dark'>(getInitialTheme);
  const [reportModalCommitmentId, setReportModalCommitmentId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [enterAfterLogin, setEnterAfterLogin] = useState(false);

  useEffect(() => {
    if (currentView === 'admin' && !canAccessAdmin) {
      setCurrentView('vendor');
    }
  }, [canAccessAdmin, currentView]);

  useEffect(() => {
    sessionStorage.setItem(PLACE_KEY, JSON.stringify({ view: currentView, tab: activeTab }));
  }, [currentView, activeTab]);

  useEffect(() => {
    if (authLoading) return;
    if (!dbUser && currentView !== 'public') setCurrentView('public');
  }, [authLoading, dbUser, currentView]);

  useEffect(() => {
    if (!enterAfterLogin || authLoading || !dbUser) return;
    setEnterAfterLogin(false);
    setCurrentView(needsOnboarding ? 'onboarding' : 'vendor');
  }, [enterAfterLogin, authLoading, dbUser, needsOnboarding]);

  useEffect(() => {
    if (authLoading || !needsOnboarding || currentView === 'public') return;
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

  const gate = authGate ? <AuthGateOverlay kind={authGate} /> : null;

  // 1. Onboarding View
  if (currentView === 'onboarding') {
    return (
      <>
        <OnboardingFlow onComplete={handleFinishOnboarding} />
        {gate}
      </>
    );
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
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSignedIn={() => setEnterAfterLogin(true)} />
        {gate}
      </>
    );
  }

  // 3. Authenticated Vendor Portal or Admin Operations
  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans pb-20 md:pb-8 flex flex-col">
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

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSignedIn={() => setEnterAfterLogin(true)} />

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
            {activeTab === 'actions' && (
              <ActionsView onNavigate={setActiveTab} onOpenReportModal={handleOpenReportModal} />
            )}
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
      {gate}
    </div>
  );
}
