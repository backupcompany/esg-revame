import React from 'react';
import { PublicLearningGuide } from '../types';
import { X } from 'lucide-react';

export const GuideReaderModal: React.FC<{
  guide: PublicLearningGuide | null;
  onClose: () => void;
  onNavigateToLearnPortal?: () => void;
}> = ({ guide, onClose }) => {
  if (!guide) return null;
  const body = guide.content.replace(/\*\*/g, '').replace(/ (\d+\. )/g, '\n$1');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 sm:items-center sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {guide.pillar} · {guide.readTimeMinutes} mnt
          </p>
          <button type="button" onClick={onClose} className="cursor-pointer" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-8">
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">{guide.title}</h2>
          {guide.summary && <p className="mt-3 text-lg italic text-slate-600 dark:text-slate-300">{guide.summary}</p>}
          <div className="mt-6 whitespace-pre-line text-base leading-relaxed">{body}</div>
          {guide.keyTakeaways.length > 0 && (
            <div className="mt-8 space-y-2">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Poin</p>
              {guide.keyTakeaways.map((point) => (
                <p key={point} className="text-base">{point.replace(/\*\*/g, '')}</p>
              ))}
            </div>
          )}
          <button type="button" onClick={onClose} className="mt-8 cursor-pointer text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
