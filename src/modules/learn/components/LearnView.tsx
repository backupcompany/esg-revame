import React, { useState } from 'react';
import { useLearnData } from '../hooks/useLearnData';
import { BaseCard } from '../../../core/ui/Cards';
import { Button } from '../../../core/ui/Button';
import { PillarBadge } from '../../../core/ui/Badges';
import { LessonPlayerModal } from './LessonPlayerModal';
import { EsgFrameworkGuideModal } from './EsgFrameworkGuideModal';
import { PrimaryTab } from '../../../core/types';
import { useLanguage } from '../../../core/context/LanguageContext';
import {
  BookOpen,
  Clock,
  Sparkles,
  CheckCircle2,
  Play,
  Compass,
  Search,
  Filter,
  Award,
  Layers,
  HelpCircle,
  TrendingUp,
  RotateCcw,
  Zap
} from 'lucide-react';

interface LearnViewProps {
  onNavigate?: (tab: PrimaryTab) => void;
}

export const LearnView: React.FC<LearnViewProps> = ({ onNavigate }) => {
  const { isId } = useLanguage();
  const {
    modules,
    activeModule,
    activeLessonIndex,
    selectedOption,
    isAnswerSubmitted,
    isCorrect,
    isLoading,
    completedCount,
    totalEarnedPoints,
    startModule,
    submitQuizAnswer,
    prevLesson,
    nextLessonOrComplete,
    refreshModules,
    closeModulePlayer,
  } = useLearnData();

  const [selectedPillar, setSelectedPillar] = useState<'ALL' | 'E' | 'S' | 'G'>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFrameworkModalOpen, setIsFrameworkModalOpen] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-500">{isId ? 'Memuat Siloam ESG Micro-Learning Hub...' : 'Loading Siloam ESG Micro-Learning Hub...'}</p>
      </div>
    );
  }

  // Extract distinct sectors
  const sectorList = ['ALL', ...Array.from(new Set(modules.map(m => m.industrySector).filter(Boolean)))];

  const filteredModules = modules.filter(mod => {
    const matchPillar = selectedPillar === 'ALL' || mod.pillar === selectedPillar;
    const matchSector = selectedSector === 'ALL' || mod.industrySector === selectedSector;
    const matchSearch =
      searchQuery.trim() === '' ||
      mod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mod.titleId && mod.titleId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      mod.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPillar && matchSector && matchSearch;
  });

  const completionPercentage = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-left">
      {/* Header Banner with Framework Guide Button */}
      <BaseCard
        padding="lg"
        className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-none shadow-md overflow-hidden relative"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-md text-[11px] font-extrabold uppercase tracking-wider text-emerald-200">
                ⚡ Siloam Micro-Learning Academy
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/30 rounded-md text-[11px] font-bold text-emerald-100">
                Bite-Sized (3-5 Menit)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              {isId ? 'ESG Micro-Learning Hub untuk Mitra Rekanan' : 'ESG Micro-Learning Hub for Vendor Partners'}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Materi ringkas bergaya <em>LinkedIn Learning + Reels/TikTok Story</em> yang dirancang khusus untuk operasional praktis. Dilengkapi kuis instan dan sertifikat kredit SG-PTS.
            </p>
          </div>

          {/* Action CTA: Open Framework Guide Modal */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="md"
              icon={<Compass className="w-4 h-4 text-emerald-600" />}
              onClick={() => setIsFrameworkModalOpen(true)}
              className="bg-white text-slate-900 hover:bg-emerald-50 font-extrabold shadow-sm"
            >
              {isId ? 'Panduan: Menerapkan ESG di Perusahaan Saya' : 'Guide: Applying ESG in My Company'}
            </Button>
            <span className="text-[11px] text-emerald-200 text-center">
              Framework P-L-A-N-S Praktis (5 Langkah)
            </span>
          </div>
        </div>
      </BaseCard>

      {/* Progress & Milestone Overview Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <BaseCard padding="md" className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {isId ? 'Modul Terselesaikan' : 'Modules Completed'}
            </span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {completedCount} / {modules.length} {isId ? 'Kursus' : 'Courses'}
            </span>
          </div>
        </BaseCard>

        <BaseCard padding="md" className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {isId ? 'Reward SG-PTS Terkumpul' : 'SG-PTS Earned'}
            </span>
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              +{totalEarnedPoints} PTS
            </span>
          </div>
        </BaseCard>

        <BaseCard padding="md" className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <span>{isId ? 'Kelulusan Kurikulum' : 'Curriculum Progress'}</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </BaseCard>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isId ? 'Cari topik pembelajaran mikro (contoh: logistik, katering, APD, listrik)...' : 'Search micro-learning topics (e.g. logistics, catering, PPE, electricity)...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Pillar Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 overflow-x-auto">
          {(['ALL', 'E', 'S', 'G'] as const).map(p => {
            const isActive = selectedPillar === p;
            return (
              <button
                key={p}
                onClick={() => setSelectedPillar(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {p === 'ALL' ? (isId ? 'Semua Pilar' : 'All Pillars') : (isId ? `Pilar ${p}` : `Pillar ${p}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sector Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> {isId ? 'Filter Sektor:' : 'Sector filter:'}
        </span>
        {sectorList.map(sec => {
          const isSelected = selectedSector === sec;
          const label =
            sec === 'ALL'
              ? (isId ? 'Semua Sektor' : 'All Sectors')
              : sec === 'Logistics & Fleet'
              ? (isId ? '🚚 Logistik & Armada' : '🚚 Logistics & Fleet')
              : sec === 'Food & Catering'
              ? (isId ? '🍽️ Katering & F&B' : '🍽️ Food & Catering')
              : sec === 'Facility & Cleaning'
              ? (isId ? '🧹 Jasa & Kebersihan' : '🧹 Facility & Cleaning')
              : sec === 'IT & Professional'
              ? (isId ? '💻 IT & Kantor' : '💻 IT & Professional')
              : sec;

          return (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec || 'ALL')}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Micro-Learning Courses Grid */}
      {filteredModules.length === 0 ? (
        <BaseCard padding="lg" className="text-center py-12 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Tidak Ada Modul yang Sesuai
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau pilih filter pilar/sektor yang berbeda.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedPillar('ALL');
              setSelectedSector('ALL');
              setSearchQuery('');
            }}
          >
            Reset Filter
          </Button>
        </BaseCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredModules.map(mod => {
            const isCompleted = mod.completed;
            return (
              <BaseCard
                key={mod.id}
                padding="none"
                className="overflow-hidden flex flex-col justify-between group hover:shadow-lg transition-all duration-300 border border-slate-200/90 dark:border-slate-800"
              >
                {/* Visual Thumbnail */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                  {mod.coverImageUrl ? (
                    <img
                      src={mod.coverImageUrl}
                      alt={mod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-800 to-slate-900 flex items-center justify-center text-white">
                      <BookOpen className="w-10 h-10 opacity-40" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <PillarBadge pillar={mod.pillar} />
                    <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-amber-300 font-black text-xs flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" /> +{mod.points} PTS
                    </span>
                  </div>

                  {/* Bottom Image Tag */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px] font-semibold">
                    <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md">
                      {mod.industrySector || 'Semua Sektor'}
                    </span>
                    <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" /> {mod.durationMinutes} Menit
                    </span>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                      {isId ? (mod.titleId || mod.title) : mod.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {isId ? (mod.descriptionId || mod.description) : mod.description}
                    </p>

                    {/* Benefit / Problem preview chip */}
                    {mod.esgBenefit && (
                      <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/50 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium line-clamp-2">
                        <span className="font-bold text-emerald-900 dark:text-emerald-200">{isId ? 'Manfaat: ' : 'Benefit: '}</span>
                        {mod.esgBenefit}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {(mod.lessonCount ?? mod.lessons.length)} Micro-Bites + Kuis
                    </span>

                    <Button
                      variant={isCompleted ? 'secondary' : 'primary'}
                      size="sm"
                      icon={isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Play className="w-4 h-4" />}
                      onClick={() => startModule(mod)}
                      className={isCompleted ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : ''}
                    >
                      {isCompleted ? (isId ? 'Review Ulang' : 'Review') : (isId ? 'Mulai Belajar' : 'Start Learning')}
                    </Button>
                  </div>
                </div>
              </BaseCard>
            );
          })}
        </div>
      )}

      {/* Interactive Micro-Bite Player Modal (Reels/Stories Style) */}
      <LessonPlayerModal
        module={activeModule}
        lessonIndex={activeLessonIndex}
        selectedOption={selectedOption}
        isAnswerSubmitted={isAnswerSubmitted}
        isCorrect={isCorrect}
        onSelectOption={submitQuizAnswer}
        onNext={nextLessonOrComplete}
        onPrev={prevLesson}
        onClose={closeModulePlayer}
        onModuleCompleted={refreshModules}
        onTakeAction={actionId => {
          if (onNavigate) {
            onNavigate('actions');
          }
        }}
      />

      {/* ESG Implementation Framework Guide Modal */}
      <EsgFrameworkGuideModal
        isOpen={isFrameworkModalOpen}
        onClose={() => setIsFrameworkModalOpen(false)}
        onExploreActions={() => {
          if (onNavigate) {
            onNavigate('actions');
          }
        }}
      />
    </div>
  );
};
