import React, { useState } from 'react';
import { Modal } from '../../../core/ui/FeedbackStates';
import { Button } from '../../../core/ui/Button';
import { Input, TextArea, FileUpload } from '../../../core/ui/Form';
import { ESGCommitment, ESGAction, EvidenceFile } from '../../../core/types';
import { CheckCircle2 } from 'lucide-react';

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
  const displayDescription = isId ? (action.descriptionId || action.description) : action.description;
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
    <Modal isOpen={!!commitment} onClose={onClose} maxWidth="4xl" title={isId ? 'Unggah bukti' : 'Upload proof'}>
      <form onSubmit={handleSubmit} className="text-left lg:grid lg:grid-cols-2 lg:gap-10">
        <div className="space-y-4">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{displayTitle}</p>
          {displayDescription && (
            <p className="text-sm italic text-slate-600 dark:text-slate-300">{displayDescription}</p>
          )}
          <Input
            label={displayMetricLabel}
            type="number"
            min={1}
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            required
          />
          <TextArea
            label={isId ? 'Catatan' : 'Notes'}
            placeholder={isId ? 'Singkat: apa yang sudah dikerjakan.' : 'Short note on what was done.'}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            required
          />
        </div>
        <div className="mt-6 space-y-4 lg:mt-0">
          <FileUpload
            label={isId ? 'Berkas' : 'File'}
            acceptedTypes={action.requiredEvidenceType}
            files={files}
            onFileSelect={handleFileAdd}
            onFileRemove={handleFileRemove}
          />
          <div className="flex justify-end gap-2">
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
              {isId ? 'Kirim' : 'Send'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
