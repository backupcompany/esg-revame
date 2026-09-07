import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Modal } from '../../../core/ui/FeedbackStates';
import { Button } from '../../../core/ui/Button';
import { PillarBadge } from '../../../core/ui/Badges';
import { LearningModule, ESGAction } from '../../../core/types';
import { actionService } from '../../../core/services/actionService';
import { learnService } from '../../../core/services/learnService';
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Award,
  Compass,
  Check,
  Building2,
  TrendingUp,
  ListChecks,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

interface LessonPlayerModalProps {
  module: LearningModule | null;
  lessonIndex: number;
  selectedOption: number | null;
  isAnswerSubmitted: boolean;
  isCorrect: boolean;
  onSelectOption: (idx: number) => void;
  onNext: () => void;
  onPrev?: () => void;
  onClose: () => void;
  onTakeAction?: (actionId: string) => void;
  onModuleCompleted?: (moduleId: string) => void;
}

export const LessonPlayerModal: React.FC<LessonPlayerModalProps> = ({
  module,
  lessonIndex,
  selectedOption,
  isAnswerSubmitted,
  isCorrect,
  onSelectOption,
  onNext,
  onPrev,
  onClose,
  onTakeAction,
  onModuleCompleted
}) => {
  const [showCompletionState, setShowCompletionState] = useState(false);
  const [relevantActions, setRelevantActions] = useState<ESGAction[]>([]);
  const [isLoadingActions, setIsLoadingActions] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    setShowCompletionState(false);
    setIsFinishing(false);
  }, [module?.id]);

  // Load relevant actions for the final completion modal
  useEffect(() => {
    if (!module) return;

    let isMounted = true;
    setIsLoadingActions(true);

    actionService.getActions().then(allActions => {
      if (!isMounted) return;
      const activeActions = allActions.filter(a => a.isActive !== false);

      // 1. Direct linked actions
      const directMatches: ESGAction[] = [];
      if (module.linkedActionIds && module.linkedActionIds.length > 0) {
        module.linkedActionIds.forEach(id => {
          const found = activeActions.find(a => a.id === id);
          if (found && !directMatches.some(m => m.id === found.id)) {
            directMatches.push(found);
          }
        });
      }
      if (module.linkedActionId) {
        const found = activeActions.find(a => a.id === module.linkedActionId);
        if (found && !directMatches.some(m => m.id === found.id)) {
          directMatches.push(found);
        }
      }

      // 2. Keyword-based matching from title & topic
      const topicKeywords = `${module.title} ${module.titleId || ''} ${module.industrySector || ''}`
        .toLowerCase()
        .split(/[\s,./()_-]+/)
        .filter(w => w.length > 3 && !['untuk', 'pada', 'yang', 'dalam', 'dengan', 'siloam', 'rekanan', 'vendor', 'pilar'].includes(w));

      const keywordMatches = activeActions.filter(a => {
        if (directMatches.some(m => m.id === a.id)) return false;
        const textToSearch = `${a.titleId || a.title} ${a.descriptionId || a.description} ${a.category || ''}`.toLowerCase();
        return topicKeywords.some(kw => textToSearch.includes(kw));
      });

      // 3. Fallback matching by same pillar
      const samePillarMatches = activeActions.filter(a => {
        if (directMatches.some(m => m.id === a.id)) return false;
        if (keywordMatches.some(m => m.id === a.id)) return false;
        return a.pillar === module.pillar;
      });

      // Combine prioritizing direct matches -> keyword matches -> same pillar matches (top 3)
      const combined = [...directMatches, ...keywordMatches, ...samePillarMatches].slice(0, 3);
      setRelevantActions(combined);
    }).catch(err => {
      console.error('Error fetching actions for completion modal:', err);
    }).finally(() => {
      if (isMounted) setIsLoadingActions(false);
    });

    return () => {
      isMounted = false;
    };
  }, [module?.id]);

  if (!module) return null;

  const totalLessons = module.lessons.length;
  const currentLesson = module.lessons[lessonIndex];
  const isLastLesson = lessonIndex === totalLessons - 1;

  // Handle keyboard arrow navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showCompletionState) return;
    if (e.key === 'ArrowRight' && isAnswerSubmitted) {
      handleNextOrComplete();
    } else if (e.key === 'ArrowLeft' && lessonIndex > 0 && onPrev) {
      onPrev();
    }
  };

  const handleNextOrComplete = async () => {
    if (isLastLesson) {
      setIsFinishing(true);
      try {
        await learnService.completeModule(module.id);
        if (onModuleCompleted) {
          onModuleCompleted(module.id);
        }
      } catch (err) {
        console.error('Error completing module:', err);
      } finally {
        setIsFinishing(false);
        setShowCompletionState(true);
      }
    } else {
      onNext();
    }
  };

  return (
    <Modal
      isOpen={!!module}
      onClose={onClose}
      maxWidth="2xl"
      title={showCompletionState ? 'Modul Selesai & Penerapan Aksi Nyata' : (module.titleId || module.title)}
    >
      <div className="space-y-5 text-left select-none" onKeyDown={handleKeyDown} tabIndex={0}>
        {/* =========================================================================
            FINAL COMPLETION MODAL / SCREEN (Tampil Setelah Selesai)
           ========================================================================= */}
        {showCompletionState ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
            {/* Header Celebration Card */}
            <div className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white overflow-hidden shadow-md">
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/30 text-emerald-200 font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Modul Berhasil Dikuasai
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/40 text-slate-200 text-[11px] font-bold">
                      Pilar {module.pillar}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                    {module.titleId || module.title}
                  </h2>

                  <p className="text-xs text-emerald-100/90 leading-relaxed">
                    Selamat! Anda telah menyelesaikan seluruh {totalLessons} micro-bites pembelajaran dan post-test dengan baik.
                  </p>
                </div>

                {/* Points Earned Stamp */}
                <div className="shrink-0 bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md rounded-2xl p-3 text-center sm:min-w-[120px]">
                  <Award className="w-7 h-7 text-amber-300 mx-auto mb-1" />
                  <span className="text-lg font-black text-amber-300 block leading-tight">
                    +{module.points} PTS
                  </span>
                  <span className="text-[10px] text-emerald-100 uppercase tracking-wider font-semibold">
                    SG-PTS Terkumpul
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Recap of Key Takeaway / Benefit */}
            {(module.esgBenefit || module.backgroundProblem) && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  💡 Ringkasan Inti & Nilai Tambah
                </span>
                {module.esgBenefit && (
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                    <strong className="text-emerald-700 dark:text-emerald-400">Dampak Kepatuhan: </strong>
                    {module.esgBenefit}
                  </p>
                )}
              </div>
            )}

            {/* =========================================================================
                PILIHAN PENERAPAN DI LINGKUNGAN PERUSAHAAN (RELEVAN TERHADAP MATERI)
               ========================================================================= */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      Pilihan Penerapan di Lingkungan Perusahaan
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Inisiatif aksi nyata di Katalog Siloam yang relevan untuk diterapkan langsung di tempat kerja Anda:
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Cards List */}
              {isLoadingActions ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Memuat inisiatif aksi relevan...
                </div>
              ) : relevantActions.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                  <p>Inisiatif umum tersedia di Katalog Aksi Siloam.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {relevantActions.map(act => (
                    <div
                      key={act.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-sm transition-all duration-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <PillarBadge pillar={act.pillar} />
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                            {act.category || 'Operasional'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold">
                            +{act.points} PTS
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            • Tingkat {act.difficulty}
                          </span>
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {act.titleId || act.title}
                        </h4>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {act.descriptionId || act.description}
                        </p>

                        {/* Practical Tips Checklist preview if available */}
                        {(act.practicalTipsId || act.practicalTips) && (
                          <div className="pt-1 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            <ListChecks className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>
                              Langkah utama: {(act.practicalTipsId || act.practicalTips)![0]}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Direct Apply CTA */}
                      {onTakeAction && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            onClose();
                            onTakeAction(act.id);
                          }}
                          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1"
                        >
                          <span>Terapkan Inisiatif Ini</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Controls / Footer */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="md"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Selesai & Tutup
              </Button>

              {onTakeAction && (
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Compass className="w-4 h-4 text-indigo-600" />}
                  onClick={() => {
                    onClose();
                    onTakeAction('');
                  }}
                  className="w-full sm:w-auto font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 border-indigo-200/80 dark:border-indigo-800"
                >
                  Jelajahi Semua Inisiatif di Katalog Aksi
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* =========================================================================
              ACTIVE BITE LEARNING VIEW (Bite 1..N) - Bersih Tanpa Banner Aksi
             ========================================================================= */
          <>
            {/* Top Story/Reels Segmented Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 w-full">
                {module.lessons.map((_, idx) => {
                  let barStyle = 'bg-slate-200 dark:bg-slate-800';
                  if (idx < lessonIndex) {
                    barStyle = 'bg-emerald-500';
                  } else if (idx === lessonIndex) {
                    barStyle = isAnswerSubmitted ? 'bg-emerald-500' : 'bg-emerald-400 animate-pulse';
                  }
                  return (
                    <div
                      key={idx}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${barStyle}`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                    Bite {lessonIndex + 1} of {totalLessons}
                  </span>
                  <span>{module.industrySector || 'Semua Sektor'}</span>
                </span>

                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> +{module.points} SG-PTS
                </span>
              </div>
            </div>

            {/* Lesson Body: Punchy Media + Takeaway Text */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs space-y-0">
              {/* Visual Header Banner */}
              {(currentLesson?.mediaUrl || module.coverImageUrl) && (
                <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-950">
                  <img
                    src={currentLesson?.mediaUrl || module.coverImageUrl}
                    alt={currentLesson?.title}
                    className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                  {/* Pillar & Difficulty Tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-extrabold uppercase tracking-wider">
                      Pilar {module.pillar}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-slate-200 text-[11px] font-medium">
                      {module.durationMinutes} Menit Micro-Bite
                    </span>
                  </div>

                  {/* Lesson Title Overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-base sm:text-lg font-black text-white drop-shadow-md leading-tight">
                      {currentLesson?.title}
                    </h3>
                  </div>
                </div>
              )}

              {/* Micro Takeaway Text & Practical Field Example */}
              <div className="p-4 sm:p-5 space-y-3.5">
                {/* Show Problem & ESG Benefit highlight on the first bite (or as context) */}
                {lessonIndex === 0 && (module.backgroundProblem || module.esgBenefit) && (
                  <div className="grid grid-cols-1 gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
                    {module.backgroundProblem && (
                      <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[10px] uppercase shrink-0 mt-0.5">
                          Masalah Nyata
                        </span>
                        <p className="leading-relaxed">{module.backgroundProblem}</p>
                      </div>
                    )}
                    {module.esgBenefit && (
                      <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-700/50 pt-2">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] uppercase shrink-0 mt-0.5">
                          Dampak Benefit
                        </span>
                        <p className="leading-relaxed font-medium text-emerald-900 dark:text-emerald-200">{module.esgBenefit}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-sm sm:text-base text-slate-800 dark:text-slate-100 font-normal leading-relaxed space-y-3 prose prose-slate dark:prose-invert max-w-none [&_strong]:font-bold [&_strong]:text-slate-900 [&_strong]:dark:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_li]:leading-relaxed [&_p]:leading-relaxed [&_h4]:font-bold [&_h4]:text-emerald-800 [&_h4]:dark:text-emerald-300">
                  <Markdown>{currentLesson?.textContent || ''}</Markdown>
                </div>

                {currentLesson?.example && (
                  <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-900 dark:text-emerald-300 font-bold block mb-0.5">
                        💡 Contoh Kasus Lapangan:
                      </strong>
                      <span>{currentLesson.example}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Small-Bite Interactive Post-Test Quiz */}
            {currentLesson?.quiz && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Post-Test Kuis Singkat (Small Bite)
                  </span>
                  <span className="text-[11px] text-slate-400">Pilih 1 jawaban</span>
                </div>

                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {currentLesson.quiz.question}
                </p>

                <div className="space-y-2">
                  {currentLesson.quiz.options.map((optionText, idx) => {
                    const isSelected = selectedOption === idx;
                    let borderStyle = 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/30';
                    let bgStyle = 'bg-white dark:bg-slate-900';

                    if (isAnswerSubmitted) {
                      if (idx === currentLesson.quiz.correctAnswerIndex) {
                        borderStyle = 'border-emerald-500 ring-2 ring-emerald-500/20';
                        bgStyle = 'bg-emerald-50 dark:bg-emerald-950/70 font-semibold';
                      } else if (isSelected && !isCorrect) {
                        borderStyle = 'border-rose-500 ring-1 ring-rose-500/20';
                        bgStyle = 'bg-rose-50 dark:bg-rose-950/70';
                      }
                    } else if (isSelected) {
                      borderStyle = 'border-emerald-500 ring-2 ring-emerald-500/20';
                      bgStyle = 'bg-emerald-50/50 dark:bg-emerald-950/40';
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswerSubmitted}
                        onClick={() => onSelectOption(idx)}
                        className={`w-full text-left p-3 rounded-xl border transition-all duration-200 text-xs sm:text-sm flex items-center justify-between cursor-pointer ${borderStyle} ${bgStyle}`}
                      >
                        <span className="text-slate-800 dark:text-slate-200">{optionText}</span>
                        {isAnswerSubmitted && idx === currentLesson.quiz.correctAnswerIndex && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                        )}
                        {isAnswerSubmitted && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Instant Feedback Banner */}
                {isAnswerSubmitted && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-medium transition-all duration-300 animate-in fade-in ${
                      isCorrect
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Luar Biasa! Jawaban Anda Tepat</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>Belum Tepat, Pelajari Penjelasannya:</span>
                        </>
                      )}
                    </div>
                    <p className="leading-relaxed">{currentLesson.quiz.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {lessonIndex > 0 && onPrev && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ArrowLeft className="w-4 h-4" />}
                    onClick={onPrev}
                  >
                    Bite Sebelumnya
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  disabled={!isAnswerSubmitted || isFinishing}
                  onClick={handleNextOrComplete}
                  icon={isLastLesson ? <Award className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                >
                  {isFinishing
                    ? 'Menyimpan Progres...'
                    : isLastLesson
                    ? `Selesaikan Modul (+${module.points} PTS)`
                    : 'Lanjut ke Bite Berikutnya'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

