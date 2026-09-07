import React from 'react';
import { NewsletterArticle } from '../types';
import {
  X,
  Clock,
  Calendar,
  User,
  Heart,
  Share2,
  Bookmark,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Leaf,
  Users,
  Scale
} from 'lucide-react';
import { Button } from '../../../core/ui/Button';

interface ArticleReaderModalProps {
  article: NewsletterArticle | null;
  onClose: () => void;
  onLike: (id: string) => void;
  onNavigateToPortal?: () => void;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  article,
  onClose,
  onLike,
  onNavigateToPortal
}) => {
  if (!article) return null;

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case 'Environmental':
        return <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Social':
        return <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'Governance':
        return <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'Vendor Spotlight':
        return <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Tautan artikel berhasil disalin ke clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col my-auto text-left">
        {/* Modal Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-md text-slate-800 dark:text-slate-200 shadow-xs">
              {renderCategoryIcon(article.category)}
              {article.category}
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">•</span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">{article.edition}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Bagikan Artikel"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Article Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {article.publishedDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.readTimeMinutes} menit baca
              </span>
              {article.vendorName && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Mitra: {article.vendorName}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                {article.subtitle}
              </p>
            )}
          </div>

          {/* Author Byline */}
          <div className="flex items-center justify-between py-3 border-y border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{article.author}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{article.authorRole}</p>
              </div>
            </div>

            <button
              onClick={() => onLike(article.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500" />
              <span>{article.likesCount || 0} Apresiasi</span>
            </button>
          </div>

          {/* Impact Highlight Box (if available) */}
          {article.impactHighlight && (
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-l-4 border-emerald-600 dark:border-emerald-400 p-4 rounded-r-lg">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-0.5">
                Capaian Dampak Terverifikasi
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {article.impactHighlight.metricValue}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {article.impactHighlight.metricLabel}
                </span>
              </div>
            </div>
          )}

          {/* Article Main Text */}
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line font-normal">
            {article.content}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Topik Terkait:</span>
              {article.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Call to Action Box in Article */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Tertarik Mengikuti Gerakan ESG Siloam?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daftarkan perusahaan Anda secara mandiri dalam &lt;5 menit untuk memulai langkah praktis.
              </p>
            </div>
            {onNavigateToPortal && (
              <Button
                variant="primary"
                size="sm"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => {
                  onClose();
                  onNavigateToPortal();
                }}
                className="shrink-0"
              >
                Mulai Sebagai Mitra
              </Button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">Siloam ESG Horizon Bulletin • Open to Public</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup Bacaan
          </Button>
        </div>
      </div>
    </div>
  );
};
