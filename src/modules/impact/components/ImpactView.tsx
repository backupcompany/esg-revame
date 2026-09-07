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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-left">
      {/* Top Header with Dual Language */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {isId ? 'Dompet Dampak ESG Saya (My Impact)' : 'My ESG Impact Wallet'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isId
                  ? 'Rekapitulasi terukur realisasi ESG rekanan, log bukti audit, status verifikasi, dan sertifikat resmi Siloam Hospitals.'
                  : "Banking-style breakdown of your company's measurable ESG metrics, submitted evidence, and certificates."}
              </p>
            </div>
          </div>
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
            {isId ? 'Buat Laporan Ringkasan ESG' : 'Generate ESG Summary Report'}
          </Button>
        </div>
      </div>

      {/* Wallet Metric Cards Grid */}
      {vendorImpact && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            title={isId ? 'Pohon Ditanam' : 'Trees Planted'}
            value={vendorImpact.treesPlanted}
            unit={isId ? 'pohon' : 'trees'}
            icon={<Trees className="w-4 h-4" />}
            colorTheme="emerald"
          />
          <MetricCard
            title={isId ? 'Energi Dihemat' : 'Energy Saved'}
            value={vendorImpact.energySavedKwh}
            unit="kWh"
            icon={<Zap className="w-4 h-4" />}
            colorTheme="amber"
          />
          <MetricCard
            title={isId ? 'Kertas Dihindari' : 'Paper Avoided'}
            value={vendorImpact.paperReducedKg}
            unit="kg"
            icon={<FileText className="w-4 h-4" />}
            colorTheme="indigo"
          />
          <MetricCard
            title={isId ? 'Limbah Didaur Ulang' : 'Waste Recycled'}
            value={vendorImpact.wasteRecycledKg}
            unit="kg"
            icon={<Recycle className="w-4 h-4" />}
            colorTheme="blue"
          />
          <MetricCard
            title={isId ? 'Air Dihemat' : 'Water Saved'}
            value={vendorImpact.waterSavedLiters}
            unit="L"
            icon={<Droplets className="w-4 h-4" />}
            colorTheme="blue"
          />
          <MetricCard
            title={isId ? 'Penerima Manfaat' : 'People Benefited'}
            value={vendorImpact.peopleBenefited}
            unit={isId ? 'orang' : 'people'}
            icon={<Users className="w-4 h-4" />}
            colorTheme="emerald"
          />
        </div>
      )}

      {/* COMMITMENT & EVIDENCE SECTION WITH TAB SEPARATION */}
      <div className="space-y-4 pt-2">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              {isId ? 'Daftar Aksi Komitmen & Bukti Lapangan' : 'Commitment & Evidence History'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isId
                ? 'Kelola inisiatif yang telah Anda ambil. Segera laporkan data & bukti untuk aksi yang belum disubmit.'
                : 'Manage your active ESG commitments. Submit empirical evidence for pending items to earn verified points.'}
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('actions')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 cursor-pointer"
            >
              <span>{isId ? 'Eksplorasi Katalog Aksi' : 'Explore Action Catalog'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* TAB CONTROLS: Separating Pending vs Submitted vs Verified vs All */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-x-auto scrollbar-none">
          {/* Tab 1: Belum Dilaporkan (Perlu Bukti) */}
          <button
            onClick={() => setActiveTab('pending_report')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'pending_report'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>{isId ? 'Belum Dilaporkan (Perlu Bukti)' : 'Pending Evidence'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === 'pending_report'
                  ? 'bg-black text-amber-400'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              {pendingReportCommitments.length}
            </span>
          </button>

          {/* Tab 2: Sudah Dilaporkan (Menunggu Review) */}
          <button
            onClick={() => setActiveTab('submitted')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'submitted'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>{isId ? 'Sudah Dilaporkan (Menunggu Review)' : 'Submitted (In Review)'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === 'submitted'
                  ? 'bg-white text-blue-700'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
              }`}
            >
              {submittedCommitments.length}
            </span>
          </button>

          {/* Tab 3: Terverifikasi */}
          <button
            onClick={() => setActiveTab('verified')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'verified'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isId ? 'Terverifikasi Selesai' : 'Verified & Completed'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === 'verified'
                  ? 'bg-white text-emerald-700'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              {verifiedCommitments.length}
            </span>
          </button>

          {/* Tab 4: Semua Komitmen */}
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <span>{isId ? 'Semua Komitmen' : 'All Commitments'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === 'all'
                  ? 'bg-white/20 dark:bg-slate-200 text-white dark:text-slate-900'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {commitments.length}
            </span>
          </button>
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
              const displayCategory = isId ? (action.categoryId || action.category) : action.category;
              const displayMetric = isId ? (action.impactMetricUnitId || action.impactMetricUnit) : action.impactMetricUnit;

              return (
                <div
                  key={cmt.id}
                  className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border transition-all space-y-3.5 shadow-xs ${
                    isPending
                      ? 'border-amber-300 dark:border-amber-800/80 hover:border-amber-400'
                      : isSubmitted
                      ? 'border-blue-300 dark:border-blue-800/80 hover:border-blue-400'
                      : 'border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <PillarBadge pillar={action.pillar} />
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[10px] font-semibold">
                          {displayCategory}
                        </span>
                        <StatusBadge status={cmt.status} lang={lang} />
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-md text-[10px] font-bold">
                          +{action.points} PTS
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {displayTitle}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>
                          {isId ? 'Target Metrik:' : 'Target Metric:'}{' '}
                          <strong className="text-slate-700 dark:text-slate-300">{displayMetric}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          {isId ? 'Tanggal Komit:' : 'Committed:'} {cmt.committedDate}
                        </span>
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
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800">
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

