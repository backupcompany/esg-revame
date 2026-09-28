import React, { useState } from 'react';
import { useImpactData } from '../hooks/useImpactData';
import { BaseCard, MetricCard } from '../../../core/ui/Cards';
import { Button } from '../../../core/ui/Button';
import { StatusBadge, PillarBadge } from '../../../core/ui/Badges';
import { EvidenceReportModal } from './EvidenceReportModal';
import { EsgReportModal } from './EsgReportModal';
import { useLanguage } from '../../../core/context/LanguageContext';
import {
  Award,
  Trees,
  Zap,
  Recycle,
  Users,
  FileCheck,
  Sparkles,
  Download,
  PlusCircle,
  FileText,
  Clock,
  Droplets,
  BookmarkCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { apiDownload } from '../../../core/services/api';
import { PrimaryTab } from '../../../core/types';

interface ImpactViewProps {
  initialReportCommitmentId?: string | null;
  onNavigate?: (tab: PrimaryTab) => void;
}

type CommitmentTab = 'pending_report' | 'submitted' | 'verified' | 'all';

export const ImpactView: React.FC<ImpactViewProps> = ({
  initialReportCommitmentId,
  onNavigate,
}) => {
  const { lang, isId } = useLanguage();

  const {
    vendor,
    commitments,
    actions,
    vendorImpact,
    selectedCommitmentId,
    setSelectedCommitmentId,
    submitEvidenceReport,
    isGeneratingReport,
    reportSummary,
    setReportSummary,
    generateReport,
    isLoading,
  } = useImpactData();

  const [activeTab, setActiveTab] = useState<CommitmentTab>('pending_report');

  React.useEffect(() => {
    if (initialReportCommitmentId) {
      setSelectedCommitmentId(initialReportCommitmentId);
    }
  }, [initialReportCommitmentId, setSelectedCommitmentId]);

  if (isLoading || !vendor) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">
          {isId ? 'Memuat Metrik Dampak & Dompet ESG...' : 'Loading Impact Metrics...'}
        </p>
      </div>
    );
  }

  const selectedCommitment = commitments.find(c => c.id === selectedCommitmentId) || null;
  const selectedAction = selectedCommitment ? actions.find(a => a.id === selectedCommitment.actionId) || null : null;

  // Filter groups
  const pendingReportCommitments = commitments.filter(
    c => c.status === 'In Progress' || c.status === 'Not Started'
  );
  const submittedCommitments = commitments.filter(c => c.status === 'Submitted');
  const verifiedCommitments = commitments.filter(c => c.status === 'Verified');

  const displayedCommitments = (() => {
    switch (activeTab) {
      case 'pending_report':
        return pendingReportCommitments;
      case 'submitted':
        return submittedCommitments;
      case 'verified':
        return verifiedCommitments;
      case 'all':
      default:
        return commitments;
    }
  })();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{isId ? 'Dampak kamu' : 'Your impact'}</h1>
          <p className="mt-1 text-sm italic text-slate-600 dark:text-slate-300">{isId ? 'Angka hijau adalah hasil yang sudah terukur.' : 'Green numbers are what has been measured.'}</p>
        </div>

        {/* Generate Report Button */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="md"
            icon={<Download className="w-4 h-4" />}
            onClick={() => void apiDownload('/api/reports/commitments.csv', 'esg-commitments.csv')}
          >
            CSV
          </Button>
          <Button
            variant="primary"
            size="md"
            isLoading={isGeneratingReport}
            icon={<Sparkles className="w-4 h-4" />}
            onClick={generateReport}
          >
            {isId ? 'Buat laporan' : 'Make a report'}
          </Button>
        </div>
      </div>

      {/* Wallet Metric Cards Grid */}
      {vendorImpact && (
        <div className="grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          {[
            [isId ? 'Pohon' : 'Trees', vendorImpact.treesPlanted, isId ? 'pohon' : 'trees'],
            [isId ? 'Energi' : 'Energy', vendorImpact.energySavedKwh, 'kWh'],
            [isId ? 'Kertas' : 'Paper', vendorImpact.paperReducedKg, 'kg'],
            [isId ? 'Limbah' : 'Waste', vendorImpact.wasteRecycledKg, 'kg'],
            [isId ? 'Air' : 'Water', vendorImpact.waterSavedLiters, 'L'],
            [isId ? 'Orang' : 'People', vendorImpact.peopleBenefited, isId ? 'orang' : 'people'],
          ].map(([label, value, unit]) => (
            <p key={String(label)}>
              <span className="block text-sm text-slate-400">{label}</span>
              <span className="text-3xl font-semibold text-emerald-500">{value}</span>
              <span className="ml-1 text-sm text-emerald-500/80">{unit}</span>
            </p>
          ))}
        </div>
      )}

      {/* COMMITMENT & EVIDENCE SECTION WITH TAB SEPARATION */}
      <div className="space-y-4 pt-2">
        {/* Section Header */}
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">{isId ? 'Bukti aksi' : 'Action proof'}</h2>
          {onNavigate && (
            <button type="button" onClick={() => onNavigate('actions')} className="text-sm text-emerald-400 cursor-pointer">
              {isId ? 'Pilih aksi lain' : 'Pick another action'}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 rounded-xl bg-slate-300 px-2 py-2 text-sm dark:bg-slate-800">
          {([
            ['pending_report', isId ? 'Perlu bukti' : 'Need proof', pendingReportCommitments.length],
            ['submitted', isId ? 'Menunggu' : 'In review', submittedCommitments.length],
            ['verified', isId ? 'Selesai' : 'Done', verifiedCommitments.length],
            ['all', isId ? 'Semua' : 'All', commitments.length],
          ] as const).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`rounded-full px-3 py-1.5 cursor-pointer ${activeTab === id ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
            >
              {label} {count}
            </button>
          ))}
        </div>

        {/* TAB CONTENT LIST */}
        {displayedCommitments.length === 0 ? (
          <BaseCard padding="lg" className="text-center py-12 space-y-3">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
              {activeTab === 'pending_report' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              ) : activeTab === 'submitted' ? (
                <FileCheck className="w-6 h-6 text-blue-500" />
              ) : (
                <BookmarkCheck className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {activeTab === 'pending_report'
                  ? isId
                    ? 'Luar biasa! Tidak ada aksi yang menunggak pelaporan bukti.'
                    : 'Great job! No commitments are currently pending evidence submission.'
                  : activeTab === 'submitted'
                  ? isId
                    ? 'Tidak ada laporan yang sedang dalam antrean verifikasi auditor.'
                    : 'No evidence reports currently under audit review.'
                  : activeTab === 'verified'
                  ? isId
                    ? 'Belum ada aksi yang selesai diverifikasi oleh Procurement Siloam.'
                    : 'No commitments have completed verification yet.'
                  : isId
                  ? 'Belum ada aksi komitmen yang diambil.'
                  : 'No ESG commitments recorded yet.'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {activeTab === 'pending_report'
                  ? isId
                    ? 'Semua aksi yang Anda ambil telah dilaporkan atau belum ada aksi baru. Buka katalog aksi untuk mengambil komitmen berikutnya!'
                    : 'All your committed actions have been reported. Explore the catalog to commit to more initiatives.'
                  : isId
                  ? 'Ambil aksi dari katalog ESG untuk memulai komitmen keberlanjutan rantai pasok.'
                  : 'Commit to new ESG initiatives from the catalog to build your sustainability profile.'}
              </p>
            </div>

            {onNavigate && (
              <div className="pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('actions')}
                  icon={<PlusCircle className="w-4 h-4" />}
                >
                  {isId ? 'Buka Katalog Inisiatif Aksi' : 'Browse Action Catalog'}
                </Button>
              </div>
            )}
          </BaseCard>
        ) : (
          <div className="space-y-3">
            {displayedCommitments.map(cmt => {
              const action = actions.find(a => a.id === cmt.actionId);
              if (!action) return null;

              const isPending = cmt.status === 'In Progress' || cmt.status === 'Not Started';
              const isSubmitted = cmt.status === 'Submitted';
              const isVerified = cmt.status === 'Verified';

              const displayTitle = isId ? (action.titleId || action.title) : action.title;
              const displayDescription = isId ? (action.descriptionId || action.description) : action.description;
              const displayCategory = isId ? (action.categoryId || action.category) : action.category;
              const displayMetric = isId ? (action.impactMetricUnitId || action.impactMetricUnit) : action.impactMetricUnit;

              return (
                <div
                  key={cmt.id}
                  className={`py-4 space-y-3.5 border-b border-slate-200 dark:border-slate-800 ${
                    isPending
                      ? 'border-amber-300 dark:border-amber-800/80 hover:border-amber-400'
                      : isSubmitted
                      ? 'border-blue-300 dark:border-blue-800/80 hover:border-blue-400'
                      : 'border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-400">
                        {isPending ? (isId ? 'Perlu bukti' : 'Need proof') : isSubmitted ? (isId ? 'Menunggu' : 'In review') : (isId ? 'Selesai' : 'Done')}
                        {' · '}
                        <span className="font-semibold text-emerald-500">+{action.points}</span>
                        {' · '}
                        <span className="font-semibold text-emerald-500">{displayMetric}</span>
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">{displayTitle}</h3>
                      {displayDescription && (
                        <p className="mt-1 text-sm italic text-slate-600 dark:text-slate-300">{displayDescription}</p>
                      )}
                      <p className="text-sm italic text-slate-400">{displayCategory}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>{cmt.committedDate}</span>
                        {cmt.completedDate && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 font-semibold">
                              {isId ? 'Diverifikasi:' : 'Verified:'} {cmt.completedDate}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Button based on Status */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isPending ? (
                        <Button
                          variant="primary"
                          size="md"
                          icon={<FileCheck className="w-4 h-4" />}
                          onClick={() => setSelectedCommitmentId(cmt.id)}
                          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-black"
                        >
                          {isId ? 'Laporkan Bukti Sekarang' : 'Submit Evidence Now'}
                        </Button>
                      ) : isSubmitted ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<FileCheck className="w-4 h-4" />}
                          onClick={() => setSelectedCommitmentId(cmt.id)}
                        >
                          {isId ? 'Perbarui / Lihat Bukti' : 'Update / View Evidence'}
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
                          onClick={() => setSelectedCommitmentId(cmt.id)}
                        >
                          {isId ? 'Lihat Bukti Terverifikasi' : 'View Verified Proof'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Evidence Files Preview Count */}
                  {cmt.evidenceFiles && cmt.evidenceFiles.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>
                        {isId
                          ? `${cmt.evidenceFiles.length} berkas bukti terlampir (${cmt.evidenceFiles.map(f => f.fileName).join(', ')})`
                          : `${cmt.evidenceFiles.length} evidence file(s) attached: ${cmt.evidenceFiles.map(f => f.fileName).join(', ')}`}
                      </span>
                    </div>
                  )}

                  {/* Reported Notes by Vendor */}
                  {cmt.notes && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800">
                      <strong className="block text-slate-900 dark:text-slate-100 mb-0.5">
                        {isId ? 'Catatan Pelaksanaan Vendor:' : 'Reported Implementation Notes:'}
                      </strong>
                      {cmt.notes}
                    </div>
                  )}

                  {/* Auditor Verification Feedback */}
                  {cmt.verificationFeedback && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-900/60">
                      <strong className="block text-emerald-950 dark:text-emerald-100 mb-0.5">
                        {isId ? 'Umpan Balik Auditor Pengadaan Siloam:' : 'Siloam Procurement Auditor Feedback:'}
                      </strong>
                      {cmt.verificationFeedback}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Evidence Upload Modal */}
      <EvidenceReportModal
        key={selectedCommitment?.id || 'none'}
        commitment={selectedCommitment}
        action={selectedAction}
        onSubmit={submitEvidenceReport}
        onClose={() => setSelectedCommitmentId(null)}
        lang={lang}
      />

      {/* Executive Report Modal */}
      <EsgReportModal
        summary={reportSummary}
        vendor={vendor}
        impacts={vendorImpact}
        onClose={() => setReportSummary(null)}
        lang={lang}
      />
    </div>
  );
};

