import React, { useState, useEffect } from 'react';
import { useActionsData } from '../hooks/useActionsData';
import { learnService } from '../../../core/services/learnService';
import { BaseCard } from '../../../core/ui/Cards';
import { Button } from '../../../core/ui/Button';
import { Input } from '../../../core/ui/Form';
import { PillarBadge, StatusBadge } from '../../../core/ui/Badges';
import { ActionDetailModal } from './ActionDetailModal';
import { ProposeActionModal } from './ProposeActionModal';
import { LessonPlayerModal } from '../../learn/components/LessonPlayerModal';
import { useLanguage } from '../../../core/context/LanguageContext';
import { PLACEHOLDER_IMAGE, catalogImage } from '../../../core/ui/assets';
import {
  Compass,
  Search,
  Sparkles,
  Clock,
  CheckCircle2,
  Zap,
  ArrowRight,
  LayoutGrid,
  Table as TableIcon,
  Globe,
  PlusCircle,
  FileSpreadsheet,
  Layers,
  Send,
  AlertCircle,
  Eye,
  BookOpen,
  BookmarkCheck,
  FileCheck,
  ShieldCheck,
  Award,
  ChevronRight,
  CircleDashed,
  ExternalLink
} from 'lucide-react';
import { ESGPillar, LearningModule, PrimaryTab } from '../../../core/types';

interface ActionsViewProps {
  onNavigate?: (tab: PrimaryTab) => void;
  onOpenReportModal?: (commitmentId: string) => void;
}

export const ActionsView: React.FC<ActionsViewProps> = ({ onNavigate, onOpenReportModal }) => {
  const { lang, isId } = useLanguage();

  const {
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
    isProposeModalOpen,
    setIsProposeModalOpen,
  } = useActionsData();

  const [modules, setModules] = useState<LearningModule[]>([]);
  const [activeCoursePlayer, setActiveCoursePlayer] = useState<LearningModule | null>(null);
  const [courseLessonIndex, setCourseLessonIndex] = useState<number>(0);
  const [courseSelectedOption, setCourseSelectedOption] = useState<number | null>(null);
  const [courseIsAnswerSubmitted, setCourseIsAnswerSubmitted] = useState<boolean>(false);
  const [courseIsCorrect, setCourseIsCorrect] = useState<boolean>(false);

  useEffect(() => {
    learnService.getAllModules().then(mods => {
      setModules(mods);
    }).catch(err => console.error('Error fetching learn modules in ActionsView:', err));
  }, []);

  // Stats calculation synced directly with commitments (matching My Impact)
  const totalCommitted = commitments.length;
  const pendingReportCount = commitments.filter(c => c.status === 'In Progress' || c.status === 'Not Started').length;
  const reportedReviewCount = commitments.filter(c => c.status === 'Submitted').length;
  const verifiedCount = commitments.filter(c => c.status === 'Verified').length;
  const totalReportedAndVerified = reportedReviewCount + verifiedCount;

  const pillarChips: { id: ESGPillar | 'ALL'; labelId: string; labelEn: string }[] = [
    { id: 'ALL', labelId: 'Semua Inisiatif', labelEn: 'All Initiatives' },
    { id: 'E', labelId: 'Lingkungan (E)', labelEn: 'Environmental (E)' },
    { id: 'S', labelId: 'Sosial & K3 (S)', labelEn: 'Social (S)' },
    { id: 'G', labelId: 'Tata Kelola (G)', labelEn: 'Governance (G)' },
  ];

  // Helper to find linked learning modules for an action
  const getLinkedModulesForAction = (act: typeof selectedAction) => {
    if (!act) return [];
    return modules.filter(m => {
      if (m.linkedActionId === act.id) return true;
      if (m.linkedActionIds && m.linkedActionIds.includes(act.id)) return true;
      if (act.linkedModuleId === m.id) return true;
      if (act.linkedModuleIds && act.linkedModuleIds.includes(m.id)) return true;
      // Fallback matching by pillar and keyword relevance
      if (m.pillar === act.pillar) {
        const actTitle = (act.titleId || act.title).toLowerCase();
        const modTitle = (m.titleId || m.title).toLowerCase();
        const keywords = ['limbah', 'makan', 'katering', 'sampah', 'k3', 'apd', 'suap', 'integritas', 'sop', 'audit', 'pdp', 'energi', 'solar', 'emisi'];
        for (const kw of keywords) {
          if (actTitle.includes(kw) && modTitle.includes(kw)) {
            return true;
          }
        }
      }
      return false;
    });
  };

  const handleStartCourse = async (mod: LearningModule) => {
    const full = await learnService.getModuleById(mod.id);
    setActiveCoursePlayer(full || mod);
    setCourseLessonIndex(0);
    setCourseSelectedOption(null);
    setCourseIsAnswerSubmitted(false);
    setCourseIsCorrect(false);
  };

  const handleCourseSelectOption = (idx: number) => {
    if (!activeCoursePlayer) return;
    const cur = activeCoursePlayer.lessons[courseLessonIndex];
    setCourseSelectedOption(idx);
    setCourseIsCorrect(idx === cur.quiz.correctAnswerIndex);
    setCourseIsAnswerSubmitted(true);
  };

  const handleCourseNext = async () => {
    if (!activeCoursePlayer) return;
    if (courseLessonIndex < activeCoursePlayer.lessons.length - 1) {
      setCourseLessonIndex(prev => prev + 1);
      setCourseSelectedOption(null);
      setCourseIsAnswerSubmitted(false);
      setCourseIsCorrect(false);
    } else {
      await learnService.completeModule(activeCoursePlayer.id);
      const mods = await learnService.getAllModules();
      setModules(mods);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {isId ? 'Pilih satu aksi' : 'Pick one action'}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {isId
              ? 'Klik Pilih pada satu baris. Kerjakan, lalu unggah bukti. Poin ini skor program, bukan sertifikasi.'
              : 'Click Choose on one row. Do the work, then upload proof. Points are program scores, not a certification.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsProposeModalOpen(true)}
            icon={<PlusCircle className="w-4 h-4" />}
          >
            {isId ? 'Ajukan Inisiatif Baru' : 'Propose Action'}
          </Button>
        </div>
      </div>

      {/* SYNCHRONIZED STATS COUNTER BAR: Synced with My Impact */}
      <div className="text-sm text-slate-600 dark:text-slate-300">
        {totalCommitted} {isId ? 'dipilih' : 'picked'} · {pendingReportCount} {isId ? 'perlu bukti' : 'need proof'} · {reportedReviewCount} {isId ? 'ditinjau' : 'in review'} · {verifiedCount} {isId ? 'selesai' : 'done'}
        {onNavigate && (
          <button type="button" onClick={() => onNavigate('impact')} className="ml-3 font-medium text-emerald-700 dark:text-emerald-300 cursor-pointer">
            {isId ? 'Lihat dampak' : 'See impact'}
          </button>
        )}
      </div>

      {/* SG-PTS Framework & Global Standard Transparency Banner */}

      {/* Partner Proposals Status Notice Banner if vendor has proposals */}
      {vendorProposals.length > 0 && (
        <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/80 dark:border-indigo-900/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-indigo-950 dark:text-indigo-200">
              {isId
                ? `Anda memiliki ${vendorProposals.length} pengajuan inisiatif aksi (${vendorProposals.filter(p => p.status === 'Approved').length} Disetujui, ${vendorProposals.filter(p => p.status === 'Pending').length} Menunggu Review).`
                : `You have submitted ${vendorProposals.length} action proposals (${vendorProposals.filter(p => p.status === 'Approved').length} Approved, ${vendorProposals.filter(p => p.status === 'Pending').length} In Review).`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {vendorProposals.slice(0, 2).map(prop => (
              <span
                key={prop.id}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  prop.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : prop.status === 'Rejected'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {prop.titleId || prop.title}: {prop.status}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Pillar Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {pillarChips.map(chip => {
            const isActive = pillarFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setPillarFilter(chip.id)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {isId ? chip.labelId : chip.labelEn}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72">
          <Input
            placeholder={isId ? 'Cari judul, kategori, dampak...' : 'Search initiatives...'}
            icon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content Rendering: Cards vs Corporate Grid */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">
            {isId ? 'Memuat katalog inisiatif ESG...' : 'Loading action catalog...'}
          </p>
        </div>
      ) : actions.length === 0 ? (
        <BaseCard padding="lg" className="text-center py-16">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {isId ? 'Tidak ada aksi yang ditemukan' : 'No actions found'}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isId ? 'Coba ganti kata kunci pencarian atau ubah filter pilar.' : 'Try adjusting keywords or selecting another pillar.'}
          </p>
        </BaseCard>
      ) : (
        /* Visual Cards View with Images and Distinct Status Icons */
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {actions.map(act => {
            const existingCommitment = commitments.find(c => c.actionId === act.id);
            const status = existingCommitment?.status;
            const displayTitle = isId ? (act.titleId || act.title) : act.title;
            const displayDescription = isId ? (act.descriptionId || act.description) : act.description;
            const displayMetric = isId ? (act.impactMetricUnitId || act.impactMetricUnit) : act.impactMetricUnit;
            const stateLabel = status === 'Verified'
              ? (isId ? 'Selesai' : 'Done')
              : status === 'Submitted'
                ? (isId ? 'Menunggu tinjauan' : 'In review')
                : status === 'In Progress' || status === 'Not Started'
                  ? (isId ? 'Perlu bukti' : 'Needs proof')
                  : (isId ? 'Belum dipilih' : 'Not picked');

            return (
              <div key={act.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => setSelectedAction(act)} className="flex min-w-0 gap-4 text-left cursor-pointer">
                  {act.imageUrl ? (
                    <img src={act.imageUrl} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg font-semibold text-slate-400 dark:bg-slate-800">{displayTitle.slice(0, 1)}</div>
                  )}
                  <div className="min-w-0">
                  <p className="text-xs text-slate-600 dark:text-slate-300">{stateLabel} · +{act.points} · ~{act.estimatedDays} {isId ? 'hari' : 'days'} · {displayMetric}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{displayTitle}</h3>
                  <p className="mt-1 line-clamp-2 text-sm italic text-slate-600 dark:text-slate-300">{displayDescription}</p>
                  </div>
                </button>
                {status === 'In Progress' || status === 'Not Started' ? (
                  <button type="button" onClick={() => existingCommitment && onOpenReportModal ? onOpenReportModal(existingCommitment.id) : onNavigate?.('impact')} className="shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white cursor-pointer">
                    {isId ? 'Unggah bukti' : 'Upload proof'}
                  </button>
                ) : (
                  <button type="button" onClick={() => status === 'Submitted' || status === 'Verified' ? onNavigate?.('impact') : commitToAction(act.id)} className="shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white cursor-pointer">
                    {status === 'Submitted' || status === 'Verified' ? (isId ? 'Lihat' : 'View') : (isId ? 'Pilih' : 'Choose')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Propose Action Modal for Vendor */}
      <ProposeActionModal
        isOpen={isProposeModalOpen}
        onClose={() => setIsProposeModalOpen(false)}
        onSubmit={submitProposal}
        vendorProfile={vendorProfile}
        lang={lang}
      />

      {/* Action Detail & Commitment Modal */}
      <ActionDetailModal
        action={selectedAction}
        existingCommitment={commitments.find(c => selectedAction && c.actionId === selectedAction.id)}
        isSubmitting={isSubmitting}
        onCommit={commitToAction}
        onClose={() => setSelectedAction(null)}
        lang={lang}
        linkedModules={getLinkedModulesForAction(selectedAction)}
        onOpenCourse={(mod) => {
          setSelectedAction(null);
          handleStartCourse(mod);
        }}
      />

      {/* Interactive Micro-Bite Player Modal from Action View */}
      <LessonPlayerModal
        module={activeCoursePlayer}
        lessonIndex={courseLessonIndex}
        selectedOption={courseSelectedOption}
        isAnswerSubmitted={courseIsAnswerSubmitted}
        isCorrect={courseIsCorrect}
        onSelectOption={handleCourseSelectOption}
        onNext={handleCourseNext}
        onPrev={() => setCourseLessonIndex(prev => Math.max(0, prev - 1))}
        onClose={() => setActiveCoursePlayer(null)}
        onTakeAction={actionId => {
          setActiveCoursePlayer(null);
          const act = actions.find(a => a.id === actionId);
          if (act) {
            setSelectedAction(act);
          }
        }}
      />
    </div>
  );
};

