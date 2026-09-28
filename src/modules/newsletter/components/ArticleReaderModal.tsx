import React, { useState } from 'react';
import { NewsletterArticle } from '../types';

interface ArticleReaderModalProps {
  article: NewsletterArticle | null;
  onClose: () => void;
  onLike: (id: string) => void;
  onNavigateToPortal?: () => void;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  article,
  onClose,
}) => {
  const [beam, setBeam] = useState(0);
  if (!article) return null;

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    setBeam(max > 0 ? el.scrollTop / max : 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100">
      <div className="mx-auto flex h-full max-w-3xl flex-col px-6">
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-emerald-400">{article.category}{article.edition ? ` · ${article.edition}` : ''}</p>
          <button type="button" onClick={onClose} className="cursor-pointer text-sm font-semibold">Tutup</button>
        </div>
        <div onScroll={onScroll} className="relative flex-1 overflow-y-auto pb-16 pl-8">
          <div className="absolute bottom-0 left-2 top-0 w-px bg-slate-800">
            <div className="w-px bg-emerald-400" style={{ height: `${Math.max(8, beam * 100)}%` }} />
          </div>
          {article.coverImageUrl && (
            <img src={article.coverImageUrl} alt="" className="mb-6 max-h-80 w-full rounded-lg object-cover" />
          )}
          <h1 className="text-3xl font-semibold tracking-tight">{article.title}</h1>
          {article.subtitle && <p className="mt-3 text-lg italic text-slate-300">{article.subtitle}</p>}
          {article.impactHighlight && (
            <p className="mt-6 text-2xl font-semibold text-emerald-400">
              {article.impactHighlight.metricValue}
              <span className="ml-2 text-sm font-normal text-emerald-400/80">{article.impactHighlight.metricLabel}</span>
            </p>
          )}
          <div className="mt-8 whitespace-pre-line text-base leading-relaxed text-slate-200">
            {article.content.replace(/\*\*/g, '')}
          </div>
        </div>
      </div>
    </div>
  );
};
