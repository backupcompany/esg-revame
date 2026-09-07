import React, { useState } from 'react';
import { Modal } from '../../../core/ui/FeedbackStates';
import { Button } from '../../../core/ui/Button';
import { Input, TextArea, FileUpload } from '../../../core/ui/Form';
import { ESGCommitment, ESGAction, EvidenceFile } from '../../../core/types';
import { Camera, FileText, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

interface EvidenceReportModalProps {
  commitment: ESGCommitment | null;
  action: ESGAction | null;
  onSubmit: (commitmentId: string, notes: string, qty: number, files: EvidenceFile[]) => Promise<void>;
  onClose: () => void;
  lang?: 'ID' | 'EN';
}

export const EvidenceReportModal: React.FC<EvidenceReportModalProps> = ({
  commitment,
  action,
  onSubmit,
  onClose,
  lang = 'ID',
}) => {
  if (!commitment || !action) return null;
  const isId = lang === 'ID';

  const [notes, setNotes] = useState(commitment.notes || '');
  const [quantity, setQuantity] = useState(commitment.quantityReported || 1);
  const [files, setFiles] = useState<EvidenceFile[]>(commitment.evidenceFiles || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayTitle = isId ? (action.titleId || action.title) : action.title;
  const displayMetric = isId ? (action.impactMetricUnitId || action.impactMetricUnit) : action.impactMetricUnit;
  const displayMetricLabel = isId ? (action.impactMetricLabelId || action.impactMetricLabel) : action.impactMetricLabel;

  const handleFileAdd = (f: EvidenceFile) => {
    setFiles(prev => [...prev, f]);
  };

  const handleFileRemove = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(commitment.id, notes, quantity, files);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={!!commitment}
      onClose={onClose}
      maxWidth="lg"
      title={isId ? `Laporkan Bukti: ${displayTitle}` : `Report Evidence: ${displayTitle}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Metric Quantity Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={isId ? `Jumlah/Volume Tercapai (${displayMetricLabel})` : `Reported Quantity (${displayMetricLabel})`}
            type="number"
            min={1}
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            required
          />
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="block text-emerald-900 dark:text-emerald-300">
                {isId ? 'Estimasi Total Dampak' : 'Estimated Total Impact'}
              </strong>
              <span>{(action.impactMultiplier * quantity).toLocaleString()} {displayMetric}</span>
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <TextArea
          label={isId ? 'Catatan & Ringkasan Pelaksanaan' : 'Implementation Notes & Summary'}
          placeholder={isId ? 'Jelaskan bagaimana vendor Anda menerapkan inisiatif ini, metode yang dipakai, atau pihak yang terlibat...' : 'Describe how your company completed this ESG action, equipment used, or key milestones achieved...'}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          required
        />

        {/* Evidence File Uploader */}
        <FileUpload
          label={isId ? `Unggah Bukti Dokumen/Foto (${action.requiredEvidenceType})` : `Upload Evidence (${action.requiredEvidenceType})`}
          acceptedTypes={action.requiredEvidenceType}
          files={files}
          onFileSelect={handleFileAdd}
          onFileRemove={handleFileRemove}
        />

        {/* AI Auto-Verification Notice */}
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p>
            {isId
              ? 'Asisten AI ESG Siloam akan otomatis melakukan pra-skrining berkas bukti Anda untuk verifikasi awal sebelum diajukan ke auditor pengadaan.'
              : 'Our AI ESG Assistant will instantly pre-screen your uploaded evidence for quality and authenticity before sending to the Procurement Auditor queue.'}
          </p>
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex justify-end gap-2">
          <Button variant="ghost" size="md" type="button" onClick={onClose}>
            {isId ? 'Batal' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            isLoading={isSubmitting}
            disabled={files.length === 0}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            {isId ? 'Kirim Bukti untuk Verifikasi' : 'Submit for Verification'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
