import React from 'react';
import { Modal } from '../../../core/ui/FeedbackStates';
import { Button } from '../../../core/ui/Button';
import { EsgReportSummary } from '../../../core/services/ai/AIService';
import { VendorProfile, EcosystemImpactTotals } from '../../../core/types';
import { Sparkles, Download, CheckCircle2, ShieldCheck, Award } from 'lucide-react';

interface EsgReportModalProps {
  summary: EsgReportSummary | null;
  vendor: VendorProfile | null;
  impacts: EcosystemImpactTotals | null;
  onClose: () => void;
  lang?: 'ID' | 'EN';
}

export const EsgReportModal: React.FC<EsgReportModalProps> = ({
  summary,
  vendor,
  impacts,
  onClose,
  lang = 'ID',
}) => {
  if (!summary || !vendor) return null;
  const isId = lang === 'ID';

  return (
    <Modal
      isOpen={!!summary}
      onClose={onClose}
      maxWidth="lg"
      title={isId ? 'Laporan Kinerja Eksekutif ESG Siloam' : 'Executive ESG Performance Report'}
    >
      <div className="space-y-5 text-left">
        {/* Certificate / Official Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl space-y-2 border border-emerald-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> {isId ? 'Sertifikat Rekanan Terverifikasi' : 'Verified Vendor Certificate'}
            </span>
            <span className="px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
              {isId ? 'Tingkat Kematangan:' : 'Level:'} {vendor.esgMaturityLevel}
            </span>
          </div>
          <h3 className="text-xl font-black">{vendor.name}</h3>
          <p className="text-xs text-emerald-100">
            {vendor.industry} • {isId ? 'Diterbitkan melalui Ekosistem Siloam Green Supply' : 'Issued via ESG Together Ecosystem'}
          </p>
        </div>

        {/* AI Generated Executive Summary */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" /> {isId ? 'Ringkasan Eksekutif AI' : 'AI Executive Summary'}
          </h4>
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {summary.summary}
          </p>
        </div>

        {/* Key Highlights */}
        <div className="space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {isId ? 'Pencapaian Utama ESG' : 'Top ESG Accomplishments'}
          </h5>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            {summary.keyHighlights.map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-2 p-2.5 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100/60 dark:border-emerald-900/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next Recommendation */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
          <strong className="block font-bold mb-0.5">
            {isId ? 'Rekomendasi Peningkatan Berikutnya:' : 'Recommended Growth Objective:'}
          </strong>
          <span>{summary.nextStepRecommendation}</span>
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex justify-between items-center">
          <span className="text-[11px] text-slate-400">
            {isId ? 'Siap dipresentasikan ke pemangku kepentingan & auditor pengadaan.' : 'Ready to present to internal stakeholders & buyers.'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" onClick={onClose}>
              {isId ? 'Tutup' : 'Close'}
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Download className="w-4 h-4" />}
              onClick={() => {
                window.print();
              }}
            >
              {isId ? 'Cetak / Unduh PDF' : 'Download Report PDF'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
