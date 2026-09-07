import React, { useState } from 'react';
import { SILOAM_PTS_METRIC_INFO, findMasterCategory } from '../utils/catalogDictionary';
import { useMasterCategories } from '../hooks/useMasterCategories';
import { ShieldCheck, Info, Globe, FileCheck, CheckCircle2, Award, ExternalLink } from 'lucide-react';
import { Modal } from '../../../core/ui/FeedbackStates';

interface EsgFrameworkBadgeProps {
  categoryName?: string;
  points?: number;
  sdgs?: number[];
  griStandards?: string[];
  pojkCategory?: string;
  showModalTrigger?: boolean;
  lang?: 'ID' | 'EN';
  size?: 'sm' | 'md';
}

export const EsgFrameworkBadge: React.FC<EsgFrameworkBadgeProps> = ({
  categoryName,
  points,
  sdgs,
  griStandards,
  pojkCategory,
  showModalTrigger = true,
  lang = 'ID',
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isId = lang === 'ID';
  useMasterCategories();

  const masterCat = categoryName ? findMasterCategory(categoryName) : undefined;
  const activeSdgs = sdgs || masterCat?.sdgs || [12, 13];
  const activeGri = griStandards || masterCat?.griStandards || ['GRI Standards Aligned'];
  const activePojk = pojkCategory || masterCat?.pojkCategory || 'POJK 51/POJK.03/2017';

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* SG-PTS Tag */}
        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-md text-[11px] font-bold">
          <Award className="w-3 h-3 text-emerald-600" />
          <span>SG-PTS {points ? `+${points}` : ''}</span>
        </div>

        {/* SDG Badges */}
        <div className="inline-flex items-center gap-1">
          {activeSdgs.slice(0, 3).map(num => (
            <span
              key={num}
              title={`UN SDG Goal ${num}`}
              className="px-1.5 py-0.5 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 rounded text-[10px] font-bold"
            >
              SDG {num}
            </span>
          ))}
        </div>

        {/* POJK / GRI Tag */}
        <span className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-medium">
          GRI & POJK 51
        </span>

        {/* Transparency Trigger Button */}
        {showModalTrigger && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-0.5"
            title={isId ? 'Penjelasan Sistem Poin & Transparansi Standar' : 'About Point Scoring & Open Standards'}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Transparency & Framework Explanation Modal */}
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          maxWidth="lg"
          title={isId ? 'Metodologi Poin (SG-PTS) & Penyelarasan Standar Terbuka' : 'SG-PTS Methodology & Open Standards Alignment'}
        >
          <div className="space-y-4 text-left text-xs">
            {/* Header Box */}
            <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-600 text-white font-black rounded-md text-[11px]">
                  SG-PTS
                </span>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {isId ? SILOAM_PTS_METRIC_INFO.fullNameId : SILOAM_PTS_METRIC_INFO.fullNameEn}
                </h4>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {isId ? SILOAM_PTS_METRIC_INFO.taglineId : SILOAM_PTS_METRIC_INFO.taglineEn}
              </p>
            </div>

            {/* Official Clarification & Disclaimer */}
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-1">
              <h5 className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                {isId ? 'Transparansi & Pernyataan Resmi Siloam Hospitals' : 'Transparency & Official Siloam Disclosure'}
              </h5>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11.5px]">
                {isId ? SILOAM_PTS_METRIC_INFO.disclaimerId : SILOAM_PTS_METRIC_INFO.disclaimerEn}
              </p>
            </div>

            {/* Framework References Grid */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-600" />
                {isId ? 'Diselaraskan dengan Standar Terbuka Internasional & Regulasi RI:' : 'Referenced Against Global Standards & Indonesian Regulations:'}
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SILOAM_PTS_METRIC_INFO.frameworkReferences.map((ref, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <strong className="text-slate-900 dark:text-slate-100 text-[11.5px]">
                        {ref.name}
                      </strong>
                      <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded text-[9.5px] font-bold">
                        {ref.badge}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      {ref.scope}
                    </p>
                    <div className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      Ref: {ref.code}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Specific Action Alignment if category provided */}
            {masterCat && (
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-1.5">
                <strong className="text-indigo-950 dark:text-indigo-200 block text-[11.5px]">
                  {isId ? `Penyelarasan Khusus Kategori: "${masterCat.nameId}"` : `Alignment for Category: "${masterCat.nameEn}"`}
                </strong>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">GRI Standards:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{activeGri.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Regulasi OJK:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{activePojk}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Standar Manajemen:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{masterCat.isoReference || 'ISO Aligned'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};
