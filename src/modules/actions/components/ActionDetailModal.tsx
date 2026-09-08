import React from 'react';
import { Modal } from '../../../core/ui/FeedbackStates';
import { Button } from '../../../core/ui/Button';
import { PillarBadge } from '../../../core/ui/Badges';
import { ESGAction, ESGCommitment, LearningModule } from '../../../core/types';
import { PLACEHOLDER_IMAGE, catalogImage } from '../../../core/ui/assets';
import { EsgFrameworkBadge } from './EsgFrameworkBadge';
import { Sparkles, Clock, CheckCircle2, Lightbulb, FileText, Camera, ShieldAlert, Calendar, Tag, Award, Globe, BookOpen, ArrowRight, Play } from 'lucide-react';

interface ActionDetailModalProps {
  action: ESGAction | null;
  existingCommitment?: ESGCommitment;
  isSubmitting: boolean;
  onCommit: (actionId: string) => void;
  onClose: () => void;
  lang?: 'ID' | 'EN';
  linkedModules?: LearningModule[];
  onOpenCourse?: (module: LearningModule) => void;
}

export const ActionDetailModal: React.FC<ActionDetailModalProps> = ({
  action,
  existingCommitment,
  isSubmitting,
  onCommit,
  onClose,
  lang = 'ID',
  linkedModules = [],
  onOpenCourse
}) => {
  if (!action) return null;

  const isId = lang === 'ID';
  const isAlreadyCommitted = !!existingCommitment;
  const displayTitle = isId ? (action.titleId || action.title) : action.title;
  const displayDescription = isId ? (action.descriptionId || action.description) : action.description;
  const displayCategory = isId ? (action.categoryId || action.category) : action.category;
  const displayTips = (isId && action.practicalTipsId && action.practicalTipsId.length > 0) ? action.practicalTipsId : action.practicalTips;
  const displayMetric = isId ? (action.impactMetricUnitId || action.impactMetricUnit) : action.impactMetricUnit;
  const displayLabel = isId ? (action.impactMetricLabelId || action.impactMetricLabel) : action.impactMetricLabel;

  return (
    <Modal isOpen={!!action} onClose={onClose} maxWidth="md" title={displayTitle}>
      <div className="space-y-4 text-left">
        {/* Top Image Banner with Gradient Overlay */}
        {action.imageUrl && (
          <div className="relative h-44 w-full rounded-xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800">
            <img
              src={catalogImage(action.imageUrl, 1600)}
              alt={displayTitle}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent" />
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <PillarBadge pillar={action.pillar} />
              <span className="px-2.5 py-0.5 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 rounded-md text-[11px] font-semibold backdrop-blur-xs">
                {displayCategory}
              </span>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
              <span className="text-xs font-semibold flex items-center gap-1 opacity-90">
                <Clock className="w-3.5 h-3.5" /> ~{action.estimatedDays} {isId ? 'Hari Pengerjaan' : 'Days Target'}
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/90 text-white rounded-md text-xs font-black flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" /> +{action.points} PTS
              </span>
            </div>
          </div>
        )}

        {/* Framework & Standards Alignment Badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 rounded-md font-semibold text-[11px]">
              {isId ? 'Kesulitan:' : 'Difficulty:'} <strong className="text-slate-900 dark:text-slate-100">{action.difficulty}</strong>
            </span>
            <span className="text-slate-400 font-mono text-[10px]">ID: {action.id}</span>
          </div>

          <EsgFrameworkBadge
            categoryName={action.category || action.categoryId}
            points={action.points}
            size="sm"
          />
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          {displayDescription}
        </p>

        {/* Connected Micro-Learning / Background Knowledge Box */}
        {linkedModules && linkedModules.length > 0 && (
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                {isId ? 'Materi Pelatihan & Latar Belakang Terkait (P-L-A-N-S)' : 'Related Training Material & Background'}
              </h5>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 rounded">
                {linkedModules.length} {isId ? 'Modul' : 'Module'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              {isId
                ? 'Pelajari teori dasar, formula perhitungan, dan metode audit sebelum atau selama menjalankan aksi ini:'
                : 'Study foundational concepts, calculation metrics, and audit prep before or during this action:'}
            </p>
            <div className="space-y-2 pt-1">
              {linkedModules.map(mod => (
                <div
                  key={mod.id}
                  className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 flex items-center justify-between gap-2 shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
                      <span className="shrink-0 px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px]">
                        {mod.pillar}
                      </span>
                      <span className="truncate">{mod.titleId || mod.title}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>⏱️ {mod.durationMinutes} min</span>
                      <span>•</span>
                      <span>✨ +{mod.points} PTS</span>
                      {mod.completed && (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> {isId ? 'Selesai' : 'Completed'}
                        </span>
                      )}
                    </div>
                  </div>
                  {onOpenCourse && (
                    <button
                      onClick={() => onOpenCourse(mod)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Play className="w-3 h-3" /> {isId ? 'Buka Materi' : 'Open Course'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practical Implementation Tips */}
        <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-600" /> {isId ? 'Panduan Langkah Praktis & Tips Implementasi' : 'Practical Steps & Implementation Tips'}
          </h5>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
            {displayTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>

        {/* Evidence & Metrics Requirements */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">{isId ? 'Target Metrik Dampak' : 'Target Impact Metric'}</span>
            <strong className="text-slate-900 dark:text-slate-100 block">{displayMetric}</strong>
            <span className="text-[11px] text-slate-500">{displayLabel}</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">{isId ? 'Bukti Audit Diperlukan' : 'Evidence Needed'}</span>
            <strong className="text-slate-900 dark:text-slate-100 capitalize flex items-center gap-1">
              {action.requiredEvidenceType === 'photo' && <Camera className="w-3.5 h-3.5 text-emerald-600" />}
              {action.requiredEvidenceType === 'document' && <FileText className="w-3.5 h-3.5 text-indigo-600" />}
              {action.requiredEvidenceType === 'both' && <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />}
              {action.requiredEvidenceType === 'both'
                ? (isId ? 'Foto & Dokumen' : 'Photo & Document')
                : action.requiredEvidenceType === 'photo'
                ? (isId ? 'Foto Lapangan' : 'Photo Evidence')
                : (isId ? 'Dokumen / Laporan' : 'Official Document')}
            </strong>
            <span className="text-[11px] text-slate-500">{isId ? 'Diverifikasi auditor ESG Siloam' : 'Verified by ESG auditor'}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="md" onClick={onClose}>
            {isId ? 'Tutup' : 'Close'}
          </Button>
          {isAlreadyCommitted ? (
            <Button variant="secondary" size="md" disabled icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}>
              {isId ? `Sudah Dikomit (${existingCommitment.status})` : `Already Committed (${existingCommitment.status})`}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={() => onCommit(action.id)}
            >
              {isId ? 'Komit Ambil Aksi Ini' : 'Commit to Action'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

