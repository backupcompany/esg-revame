import React from 'react';
import { useHomeData } from '../hooks/useHomeData';
import { BaseCard, MetricCard } from '../../../core/ui/Cards';
import { Button } from '../../../core/ui/Button';
import { LevelBadge, StatusBadge, PillarBadge } from '../../../core/ui/Badges';
import { DuolingoMilestonePath, ProgressBar } from '../../../core/ui/Progress';
import { PrimaryTab } from '../../../core/types';
import {
  Sparkles,
  ArrowRight,
  Zap,
  CheckCircle2,
  Clock,
  Compass,
  Trees,
  Recycle,
  Users,
  ShieldCheck,
  Award,
  TrendingUp,
  FileCheck,
  ClipboardCheck
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (tab: PrimaryTab) => void;
  onOpenReportModal: (commitmentId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenReportModal }) => {
  const {
    vendor,
    commitments,
    actions,
    collectiveMetrics,
    vendorImpact,
    aiRecommendations,
    latestDeclaration,
    isLoading,
  } = useHomeData();

  if (isLoading || !vendor) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-500">Loading ESG Command Center...</p>
      </div>
    );
  }

  // Active commitments
  const activeCommitments = commitments.filter(c => c.status === 'In Progress' || c.status === 'Submitted');
  const completedCount = commitments.filter(c => c.status === 'Verified').length;

  const isCodeOfEthicsSigned = Boolean(latestDeclaration && latestDeclaration.signatureConfirmed);
  const badgeRank: Record<string, number> = {
    Starter: 1, Bronze: 2, Silver: 3, Gold: 4, Champion: 5,
  };
  const levelRank = badgeRank[vendor.esgMaturityLevel] || 1;

  const milestones = [
    {
      id: 'm0',
      title: 'Stage 0: Code of Ethics Passcode',
      subtitle: isCodeOfEthicsSigned ? 'Signed & Verified' : 'Required: Sign Code of Conduct',
      status: (isCodeOfEthicsSigned ? 'completed' : 'active') as any,
      icon: <FileCheck className="w-6 h-6" />,
      levelNumber: 0,
      onClick: () => onNavigate('declaration'),
    },
    {
      id: 'm1',
      title: 'Starter: Small Wins',
      subtitle: 'Complete 1 basic ESG action',
      status: (!isCodeOfEthicsSigned ? 'locked' : (completedCount >= 1 || levelRank > 1 ? 'completed' : 'active')) as any,
      icon: <Sparkles className="w-6 h-6" />,
      levelNumber: 1,
      onClick: () => {
        if (!isCodeOfEthicsSigned) {
          alert('Mohon tandatangani Surat Pernyataan Kode Etik Pemasok (Stage 0) terlebih dahulu sebagai syarat pembuka ESG Journey.');
          onNavigate('declaration');
          return;
        }
        onNavigate('learn');
      },
    },
    {
      id: 'm2',
      title: 'Bronze: Active Participant',
      subtitle: 'Diagnostic Contributor (36%+) → Bronze badge',
      status: (!isCodeOfEthicsSigned ? 'locked' : (levelRank >= 2 ? (levelRank >= 3 ? 'completed' : 'active') : 'locked')) as any,
      icon: <Award className="w-6 h-6" />,
      levelNumber: 2,
      onClick: () => {
        if (!isCodeOfEthicsSigned) {
          onNavigate('declaration');
          return;
        }
        onNavigate('actions');
      },
    },
    {
      id: 'm3',
      title: 'Silver: Sustainable Partner',
      subtitle: 'Diagnostic Practitioner (61%+) → Silver badge',
      status: (!isCodeOfEthicsSigned ? 'locked' : (levelRank >= 3 ? (levelRank >= 4 ? 'completed' : 'active') : 'locked')) as any,
      icon: <ShieldCheck className="w-6 h-6" />,
      levelNumber: 3,
      onClick: () => {
        if (!isCodeOfEthicsSigned) {
          onNavigate('declaration');
          return;
        }
        onNavigate('impact');
      },
    },
    {
      id: 'm4',
      title: 'Gold: Ecosystem Champion',
      subtitle: 'Diagnostic Leader (86%+) → Gold badge',
      status: (!isCodeOfEthicsSigned ? 'locked' : (levelRank >= 4 ? 'completed' : 'locked')) as any,
      icon: <TrendingUp className="w-6 h-6" />,
      levelNumber: 4,
      onClick: () => {
        if (!isCodeOfEthicsSigned) {
          onNavigate('declaration');
          return;
        }
        onNavigate('actions');
      },
    },
  ];

  const nextActionRecommendation = aiRecommendations.length > 0 ? aiRecommendations[0] : {
    title: 'Switch to LED Lighting Retrofit',
    reason: 'Quick win with immediate 20% energy bill reduction.',
    priority: 'High',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 text-left">
      {/* Welcome Command Header */}
      <BaseCard padding="lg" className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white relative overflow-hidden border-none shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-emerald-100">
                Vendor Command Center
              </span>
              <LevelBadge level={vendor.esgMaturityLevel} size="md" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {vendor.name}!
            </h1>
            <p className="text-sm text-emerald-100 max-w-xl">
              Diagnostic maturity score from the last assessment: <strong className="text-white">{vendor.esgScore}/100</strong>.
              {' '}{completedCount} verified action{completedCount === 1 ? '' : 's'} count toward impact totals.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 min-w-[220px]">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-200 mb-1">
              Assessment score
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black">{vendor.esgScore}</span>
              <span className="text-xs text-emerald-200">/ 100 PTS</span>
            </div>
            <ProgressBar value={vendor.esgScore} showLabel={false} color="amber" size="sm" />
          </div>
        </div>
      </BaseCard>

      {/* ESG Starter Assessment Diagnostic Banner */}
      <BaseCard padding="md" className="border border-emerald-300 dark:border-emerald-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-[#0f5238] text-white rounded-2xl shadow-sm shrink-0">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wide text-[#0f5238] dark:text-emerald-300">
                  Diagnostic Tool
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-[#0f5238] dark:bg-emerald-950 dark:text-emerald-300 rounded-full text-[10px] font-bold">
                  15 Diagnostic Questions
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                ESG Starter Assessment
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                A simple diagnostic tool to help identify practical ESG opportunities across Environmental, Social, and Governance pillars.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="md"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => onNavigate('assessment')}
            className="self-start sm:self-center shrink-0 border-[#0f5238] text-[#0f5238] dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-50"
          >
            Take Assessment
          </Button>
        </div>
      </BaseCard>

      {/* Next Recommended Action Banner (Duolingo Style Prominent) */}
      <BaseCard padding="md" className="border-2 border-emerald-500/80 bg-emerald-50/60 dark:bg-emerald-950/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm">
              <Zap className="w-6 h-6 fill-current animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Recommended Next Action
                </span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[10px] font-bold">
                  High Impact
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {nextActionRecommendation.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {nextActionRecommendation.reason}
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => onNavigate('actions')}
            className="self-start sm:self-center shrink-0"
          >
            Start Action
          </Button>
        </div>
      </BaseCard>

      {/* Two Column Layout: Journey Progress Path vs Active Commitments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Duolingo Milestone Journey */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" /> Your ESG Journey
            </h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('learn')}>
              Learn Modules
            </Button>
          </div>

          <BaseCard padding="md" className="bg-slate-50/50 dark:bg-slate-900/50">
            <DuolingoMilestonePath milestones={milestones} currentScore={vendor.esgScore} />
          </BaseCard>
        </div>

        {/* Right Column: Active Commitments & Recent Activity */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Commitments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> Active Commitments ({activeCommitments.length})
              </h2>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('actions')}>
                Discover More
              </Button>
            </div>

            {activeCommitments.length === 0 ? (
              <BaseCard padding="md" className="text-center py-8">
                <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No active commitments yet</p>
                <p className="text-xs text-slate-500 mb-4">Pick a quick ESG action to start building your score.</p>
                <Button variant="primary" size="sm" onClick={() => onNavigate('actions')}>
                  Browse ESG Actions
                </Button>
              </BaseCard>
            ) : (
              <div className="space-y-3">
                {activeCommitments.map(cmt => {
                  const action = actions.find(a => a.id === cmt.actionId);
                  if (!action) return null;

                  return (
                    <BaseCard key={cmt.id} padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <PillarBadge pillar={action.pillar} />
                          <StatusBadge status={cmt.status} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {action.title}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Committed on {cmt.committedDate} • Target: {action.impactMetricLabel}
                        </p>
                      </div>

                      <Button
                        variant={cmt.status === 'Submitted' ? 'outline' : 'primary'}
                        size="sm"
                        icon={<FileCheck className="w-4 h-4" />}
                        onClick={() => onOpenReportModal(cmt.id)}
                        className="shrink-0 self-start sm:self-center"
                      >
                        {cmt.status === 'Submitted' ? 'Update Evidence' : 'Report & Upload Evidence'}
                      </Button>
                    </BaseCard>
                  );
                })}
              </div>
            )}
          </div>

          {/* Collective Ecosystem Impact Snapshot */}
          {collectiveMetrics && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" /> Ecosystem Collective Impact
                </h2>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('impact')}>
                  Full Report
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                  title="Trees Planted"
                  value={collectiveMetrics.totals.treesPlanted}
                  unit="trees"
                  icon={<Trees className="w-4 h-4" />}
                  colorTheme="emerald"
                />
                <MetricCard
                  title="Energy Saved"
                  value={collectiveMetrics.totals.energySavedKwh}
                  unit="kWh"
                  icon={<Zap className="w-4 h-4" />}
                  colorTheme="amber"
                />
                <MetricCard
                  title="Waste Recycled"
                  value={collectiveMetrics.totals.wasteRecycledKg}
                  unit="kg"
                  icon={<Recycle className="w-4 h-4" />}
                  colorTheme="blue"
                />
                <MetricCard
                  title="People Benefited"
                  value={collectiveMetrics.totals.peopleBenefited}
                  unit="people"
                  icon={<Users className="w-4 h-4" />}
                  colorTheme="indigo"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
