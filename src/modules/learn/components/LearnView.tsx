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
  const [showFilters, setShowFilters] = useState(false);

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
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6 text-left">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{isId ? 'Belajar singkat' : 'Short lessons'}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {completedCount}/{modules.length} {isId ? 'selesai' : 'done'} · +{totalEarnedPoints} {isId ? 'poin' : 'points'} · {completionPercentage}%
        </p>
        <button type="button" onClick={() => setIsFrameworkModalOpen(true)} className="mt-3 text-sm text-slate-400 cursor-pointer">
          {isId ? 'Penjelasan 5 langkah ESG' : 'The 5 ESG steps'}
        </button>
      </header>

      {completedCount === 0 && (
        <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
          <li>1. {isId ? 'Klik Mulai dari sini pada pelajaran pertama. Sekitar 5 menit.' : 'Click Start here on the first lesson. About 5 minutes.'}</li>
          <li>2. {isId ? 'Baca tiap bagian, lalu jawab kuis di akhir.' : 'Read each part, then answer the quiz.'}</li>
          <li>3. {isId ? 'Poin masuk. Untuk praktik di perusahaan, buka menu Aksi.' : 'Points are added. For real work, open Actions.'}</li>
        </ol>
      )}

      <button type="button" onClick={() => setShowFilters(v => !v)} className="text-sm text-slate-400 cursor-pointer">
        {showFilters ? (isId ? 'Tutup saringan' : 'Hide filters') : (isId ? 'Saring daftar' : 'Filter the list')}
      </button>

      {showFilters && (
      <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isId ? 'Cari topik' : 'Search topics'}
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
      </div>
      )}

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
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {filteredModules.map(mod => {
            const firstOpen = modules.find(m => !m.completed)?.id === mod.id;
            const isCompleted = mod.completed;
            const title = isId ? (mod.titleId || mod.title) : mod.title;
            const description = isId ? (mod.descriptionId || mod.description) : mod.description;
            return (
              <div key={mod.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-4">
                  {mod.coverImageUrl ? (
                    <img src={mod.coverImageUrl} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg font-semibold text-slate-400 dark:bg-slate-800">{title.slice(0, 1)}</div>
                  )}
                  <div className="min-w-0">
                  <p className="text-xs text-slate-500">
                    {isCompleted ? (isId ? 'Selesai' : 'Done') : (isId ? 'Belum' : 'Not started')}
                    {' · '}+{mod.points}
                    {' · '}{mod.durationMinutes} {isId ? 'menit' : 'min'}
                    {mod.industrySector ? ` · ${mod.industrySector}` : ''}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm italic text-slate-600 dark:text-slate-300">{description}</p>
                  </div>
                </div>
                <button type="button" onClick={() => startModule(mod)} className="shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white cursor-pointer">
                  {isCompleted ? (isId ? 'Ulangi' : 'Review') : firstOpen ? (isId ? 'Mulai dari sini' : 'Start here') : (isId ? 'Mulai' : 'Start')}
                </button>
              </div>
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
