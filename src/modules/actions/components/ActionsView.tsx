import React, { useState, useEffect } from 'react';
import { useActionsData } from '../hooks/useActionsData';
import { learnService } from '../../../core/services/learnService';
import { BaseCard } from '../../../core/ui/Cards';
import { Button } from '../../../core/ui/Button';
import { Input } from '../../../core/ui/Form';
import { PillarBadge, StatusBadge } from '../../../core/ui/Badges';
import { ActionDetailModal } from './ActionDetailModal';
import { CorporateActionGrid } from './CorporateActionGrid';
import { ProposeActionModal } from './ProposeActionModal';
import { LessonPlayerModal } from '../../learn/components/LessonPlayerModal';
import { useLanguage } from '../../../core/context/LanguageContext';
import { PLACEHOLDER_IMAGE } from '../../../core/ui/assets';
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
}

export const ActionsView: React.FC<ActionsViewProps> = ({ onNavigate }) => {
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
    viewMode,
    setViewMode,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {isId ? 'Katalog Inisiatif Aksi ESG Siloam' : 'Siloam ESG Action Catalog'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isId
                  ? 'Eksplorasi inisiatif keberlanjutan praktis rantai pasok. Pilih aksi, buat komitmen, dan kumpulkan bukti audit!'
                  : 'Browse practical, high-impact ESG initiatives. Select an action, commit, and log verified evidence!'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Toolbar: View Mode + Propose Action */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setViewMode('cards')}
              title={isId ? 'Tampilan Kartu Visual' : 'Card View'}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title={isId ? 'Tampilan Tabel Korporat' : 'Corporate Grid View'}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Propose New Action Button */}
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
      <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl shadow-md border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {isId ? 'Status Komitmen & Laporan Vendor' : 'Vendor Commitment & Reporting Tracker'}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {isId ? 'Data tersinkronisasi langsung dengan Dompet Dampak (My Impact)' : 'Live data synchronized with My Impact Wallet'}
              </span>
            </div>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('impact')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer transition-colors"
            >
              <span>{isId ? 'Buka Dompet Dampak Saya' : 'Open My Impact Wallet'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 4-Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Stat 1: Total Dikomit */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{totalCommitted}</div>
              <div className="text-[11px] text-slate-300 font-medium leading-tight">
                {isId ? 'Aksi Sudah Dikomit' : 'Total Committed'}
              </div>
            </div>
          </div>

          {/* Stat 2: Belum Dilaporkan (Perlu Bukti) */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 bg-slate-500/20 text-slate-300 rounded-xl shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-amber-400">{pendingReportCount}</div>
              <div className="text-[11px] text-slate-300 font-medium leading-tight">
                {isId ? 'Belum Dilaporkan (Perlu Bukti)' : 'Pending Evidence'}
              </div>
            </div>
          </div>

          {/* Stat 3: Sudah Dilaporkan */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-blue-400">{reportedReviewCount}</div>
              <div className="text-[11px] text-slate-300 font-medium leading-tight">
                {isId ? 'Sudah Dilaporkan (Review)' : 'Submitted (In Review)'}
              </div>
            </div>
          </div>

          {/* Stat 4: Terverifikasi */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400">{verifiedCount}</div>
              <div className="text-[11px] text-slate-300 font-medium leading-tight">
                {isId ? 'Terverifikasi Selesai' : 'Verified & Completed'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SG-PTS Framework & Global Standard Transparency Banner */}
      <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 text-xs text-emerald-950 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {isId ? (
              <>
                <strong>Standar Terbuka & SG-PTS:</strong> Poin aksi adalah skor internal program ESG Siloam (bukan GRI/CSRD). Klaim prioritas tender bersifat aspirasional sampai ada kontrak data dengan procurement.
              </>
            ) : (
              <>
                <strong>Open Standards & SG-PTS:</strong> Action points are an internal Siloam ESG program score (not a GRI/CSRD certificate). Tender-preference claims are aspirational until procurement signs a data contract.
              </>
            )}
          </span>
        </div>
      </div>

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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
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
      ) : viewMode === 'grid' ? (
        /* Corporate Grid / Table View */
        <CorporateActionGrid
          actions={actions}
          commitments={commitments}
          onSelectAction={setSelectedAction}
          lang={lang}
        />
      ) : (
        /* Visual Cards View with Images and Distinct Status Icons */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {actions.map(act => {
            const existingCommitment = commitments.find(c => c.actionId === act.id);
            const isCommitted = !!existingCommitment;
            const status = existingCommitment?.status;
            const displayTitle = isId ? (act.titleId || act.title) : act.title;
            const displayDescription = isId ? (act.descriptionId || act.description) : act.description;
            const displayCategory = isId ? (act.categoryId || act.category) : act.category;
            const displayMetric = isId ? (act.impactMetricUnitId || act.impactMetricUnit) : act.impactMetricUnit;

            return (
              <div
                key={act.id}
                onClick={() => setSelectedAction(act)}
                className={`group bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer ${
                  status === 'Verified'
                    ? 'border-emerald-300 dark:border-emerald-700/80 shadow-xs hover:shadow-md'
                    : status === 'Submitted'
                    ? 'border-blue-300 dark:border-blue-700/80 shadow-xs hover:shadow-md'
                    : isCommitted
                    ? 'border-amber-300 dark:border-amber-700/80 shadow-xs hover:shadow-md'
                    : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-xs hover:shadow-md'
                }`}
              >
                <div>
                  {/* Card Image Banner with Overlay */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={act.imageUrl || PLACEHOLDER_IMAGE}
                      alt={displayTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                    
                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <PillarBadge pillar={act.pillar} />
                      <span className="px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white rounded-md text-[10px] font-semibold">
                        {displayCategory}
                      </span>
                    </div>

                    {/* Top Right Points */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-md text-xs font-black flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-3 h-3" /> +{act.points} PTS
                      </span>
                    </div>

                    {/* Prominent Overlay Status Badge (Icon + Label) */}
                    <div className="absolute bottom-10 left-2.5">
                      {status === 'Verified' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600/90 backdrop-blur-xs text-white rounded-lg text-[11px] font-bold shadow-xs">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{isId ? 'Terverifikasi Selesai' : 'Verified'}</span>
                        </span>
                      ) : status === 'Submitted' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600/90 backdrop-blur-xs text-white rounded-lg text-[11px] font-bold shadow-xs">
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>{isId ? 'Sudah Dilaporkan' : 'Submitted'}</span>
                        </span>
                      ) : isCommitted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/95 backdrop-blur-xs text-slate-950 rounded-lg text-[11px] font-extrabold shadow-xs">
                          <BookmarkCheck className="w-3.5 h-3.5" />
                          <span>{isId ? 'Sudah Dikomit (Belum Lapor)' : 'Committed (Pending Report)'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-xs text-slate-200 rounded-md text-[10px] font-medium">
                          <CircleDashed className="w-3 h-3" />
                          <span>{isId ? 'Belum Diambil' : 'Not Started'}</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom overlay info */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px]">
                      <span className="flex items-center gap-1 opacity-90 font-medium">
                        <Clock className="w-3 h-3" /> ~{act.estimatedDays} {isId ? 'Hari' : 'Days'}
                      </span>
                      <span className="capitalize opacity-90 px-2 py-0.5 rounded bg-white/20 font-semibold">
                        {act.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                      {displayTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {displayDescription}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500 truncate">
                    <span className="text-slate-400 block text-[10px]">{isId ? 'Target Dampak:' : 'Target Metric:'}</span>
                    <strong className="text-slate-700 dark:text-slate-300 font-semibold truncate block">
                      {displayMetric}
                    </strong>
                  </div>

                  {status === 'In Progress' || status === 'Not Started' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<FileCheck className="w-3.5 h-3.5" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigate) onNavigate('impact');
                        else setSelectedAction(act);
                      }}
                    >
                      {isId ? 'Laporkan Bukti' : 'Report Evidence'}
                    </Button>
                  ) : status === 'Submitted' || status === 'Verified' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAction(act);
                      }}
                    >
                      {isId ? 'Lihat Detail' : 'View Status'}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      {isId ? 'Pilih & Komit' : 'Select & Commit'}
                    </Button>
                  )}
                </div>
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

