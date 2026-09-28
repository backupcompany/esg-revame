import React from 'react';
import { Modal } from '../../../core/ui/FeedbackStates';
import { ESGAction, ESGCommitment, LearningModule } from '../../../core/types';
import { PLACEHOLDER_IMAGE, catalogImage } from '../../../core/ui/assets';
import { findMasterCategory } from '../utils/catalogDictionary';

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
  const standards = findMasterCategory(action.category || action.categoryId || '');
  const pillarName = action.pillar === 'E' ? (isId ? 'Lingkungan' : 'Environment') : action.pillar === 'S' ? (isId ? 'Sosial' : 'Social') : (isId ? 'Tata kelola' : 'Governance');
  const evidence = action.requiredEvidenceType === 'both'
    ? (isId ? 'Foto dan dokumen' : 'Photo and document')
    : action.requiredEvidenceType === 'photo'
      ? (isId ? 'Foto' : 'Photo')
      : (isId ? 'Dokumen' : 'Document');

  return (
    <Modal isOpen={!!action} onClose={onClose} maxWidth="5xl" title={displayTitle}>
      <div className="text-left text-slate-900 dark:text-white lg:grid lg:grid-cols-[320px_1fr] lg:gap-10">
        {action.imageUrl && (
          <img
            src={catalogImage(action.imageUrl, 1600)}
            alt=""
            className="h-52 w-full rounded-lg object-cover lg:h-full lg:max-h-80"
            referrerPolicy="no-referrer"
            onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
          />
        )}
        <div className="mt-5 space-y-5 lg:mt-0">
          <p className="text-sm text-slate-400">
            {pillarName} · {displayCategory}
            {' · '}
            <span className="font-semibold text-emerald-500">~{action.estimatedDays} {isId ? 'hari' : 'days'}</span>
            {' · '}
            <span className="font-semibold text-emerald-500">+{action.points} {isId ? 'poin' : 'points'}</span>
            {' · '}{action.difficulty}
          </p>
          <p className="text-lg italic leading-relaxed text-slate-800 dark:text-slate-100">{displayDescription}</p>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <p><span className="block text-slate-400">SG-PTS</span><span className="font-semibold text-emerald-600 dark:text-emerald-400">+{action.points}</span></p>
            <p><span className="block text-slate-400">SDG</span><span>{(standards?.sdgs || [12, 13]).map(n => `SDG ${n}`).join(' · ')}</span></p>
            <p><span className="block text-slate-400">GRI & POJK</span><span>{standards?.pojkCategory || 'POJK 51'}</span></p>
            <p><span className="block text-slate-400">{isId ? 'Yang dihitung' : 'What counts'}</span><span className="font-semibold text-emerald-600 dark:text-emerald-400">{displayMetric}</span><span className="block text-slate-600 dark:text-slate-300">{displayLabel}</span></p>
            <p><span className="block text-slate-400">{isId ? 'Bukti' : 'Proof'}</span><span>{evidence}</span></p>
          </div>
          {displayTips.length > 0 && (
            <ol className="space-y-2 text-sm">
              {displayTips.map((tip, idx) => (
                <li key={idx}>{idx + 1}. {tip}</li>
              ))}
            </ol>
          )}
          {linkedModules.length > 0 && onOpenCourse && (
            <button type="button" onClick={() => onOpenCourse(linkedModules[0])} className="text-sm text-emerald-400 cursor-pointer">
              {isId ? 'Baca pelajarannya dulu' : 'Read the lesson first'}
            </button>
          )}
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-full bg-slate-800 px-4 py-2 text-sm text-white cursor-pointer">
              {isId ? 'Tutup' : 'Close'}
            </button>
            {isAlreadyCommitted ? (
              <span className="text-sm text-emerald-700 dark:text-emerald-300">{isId ? 'Sudah dipilih' : 'Already chosen'}</span>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onCommit(action.id)}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 cursor-pointer"
              >
                {isSubmitting ? (isId ? 'Menyimpan…' : 'Saving…') : (isId ? 'Ambil aksi ini' : 'Take this action')}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

