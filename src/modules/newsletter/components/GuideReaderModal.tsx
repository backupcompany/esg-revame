import React from 'react';
import { PublicLearningGuide } from '../types';
import {
  X,
  Clock,
  BookOpen,
  CheckCircle2,
  Share2,
  Zap,
  Recycle,
  Heart,
  Scale,
  Sparkles
} from 'lucide-react';
import { Button } from '../../../core/ui/Button';

interface GuideReaderModalProps {
  guide: PublicLearningGuide | null;
  onClose: () => void;
  onNavigateToLearnPortal?: () => void;
}

export const GuideReaderModal: React.FC<GuideReaderModalProps> = ({
  guide,
  onClose,
  onNavigateToLearnPortal
}) => {
  if (!guide) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-6 h-6 text-amber-500" />;
      case 'Recycle':
        return <Recycle className="w-6 h-6 text-blue-500" />;
      case 'Heart':
        return <Heart className="w-6 h-6 text-rose-500" />;
      case 'Scale':
        return <Scale className="w-6 h-6 text-indigo-500" />;
      default:
        return <BookOpen className="w-6 h-6 text-emerald-500" />;
    }
  };

  const getPillarBadge = (pillar: string) => {
    switch (pillar) {
      case 'E':
        return { label: 'Environmental', bg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' };
      case 'S':
        return { label: 'Social', bg: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300' };
      case 'G':
        return { label: 'Governance', bg: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' };
      default:
        return { label: 'General ESG', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200' };
    }
  };

  const badge = getPillarBadge(guide.pillar);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col my-auto text-left">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-extrabold rounded-md ${badge.bg}`}>
              Pilar {guide.pillar} • {badge.label}
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">{guide.category}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0 shadow-inner">
              {renderIcon(guide.iconName)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {guide.readTimeMinutes} menit baca
                </span>
                <span>•</span>
                <span>{guide.targetAudience}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {guide.title}
              </h2>
            </div>
          </div>

          {guide.summary && (
            <p className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700">
              {guide.summary}
            </p>
          )}

          {/* Main Content */}
          <div className="text-sm sm:text-base text-slate-800 dark:text-slate-200 space-y-4 whitespace-pre-line leading-relaxed">
            {guide.content}
          </div>

          {/* Key Takeaways */}
          {guide.keyTakeaways && guide.keyTakeaways.length > 0 && (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Poin Penting untuk Diterapkan
              </h4>
              <ul className="space-y-2">
                {guide.keyTakeaways.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">Public Micro-Learning • Siloam ESG Academy</span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Selesai Membaca
          </Button>
        </div>
      </div>
    </div>
  );
};
