import React, { useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle2, Sparkles } from 'lucide-react';
import { EvidenceFile } from '../types';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full text-left">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && <div className="absolute left-3.5 text-slate-400">{icon}</div>}
        <input
          className={`w-full bg-white dark:bg-slate-900 border rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full text-left">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        rows={3}
        className={`w-full bg-white dark:bg-slate-900 border rounded-lg p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};

interface FileUploadProps {
  label?: string;
  acceptedTypes?: 'photo' | 'document' | 'both';
  onFileSelect: (file: EvidenceFile) => void;
  onFileRemove?: (fileId: string) => void;
  files: EvidenceFile[];
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label = 'Upload Supporting Evidence (Photo or Document)',
  acceptedTypes = 'both',
  onFileSelect,
  onFileRemove,
  files,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const mime = (selected.type || '').toLowerCase();
    if (mime.startsWith('video/') || !allowed.includes(mime)) {
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      return;
    }

    setIsUploading(true);
    const isImg = selected.type.startsWith('image/');
    const previewUrl = isImg ? URL.createObjectURL(selected) : '';

    const newFile: EvidenceFile = {
      id: crypto.randomUUID(),
      fileName: selected.name,
      fileUrl: previewUrl,
      fileType: isImg ? 'image' : 'document',
      uploadedAt: new Date().toISOString().split('T')[0],
      blob: selected,
    };

    setIsUploading(false);
    onFileSelect(newFile);
    e.target.value = '';
  };

  return (
    <div className="w-full text-left space-y-3">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          {label}
        </label>
      )}

      <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 text-center bg-slate-50/50 dark:bg-slate-900/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all relative">
        <input
          type="file"
          accept={
            acceptedTypes === 'photo'
              ? 'image/jpeg,image/png,image/webp'
              : acceptedTypes === 'document'
                ? 'application/pdf'
                : 'image/jpeg,image/png,image/webp,application/pdf'
          }
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />

        <div className="flex flex-col items-center gap-2">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {isUploading ? 'Uploading file...' : 'Click or drop file to upload'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              JPEG, PNG, WebP, or PDF. Max 10MB. Files are stored on the server, not in the browser.
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 mt-3">
          <span className="text-xs font-medium text-slate-500">Uploaded files ({files.length}):</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.map(f => (
              <div
                key={f.id}
                className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg relative"
              >
                {f.fileType === 'image' ? (
                  <img src={f.fileUrl} alt={f.fileName} className="w-10 h-10 object-cover rounded-md" />
                ) : (
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 rounded-md flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{f.fileName}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Uploaded {f.uploadedAt}
                  </p>
                </div>
                {onFileRemove && (
                  <button
                    onClick={() => onFileRemove(f.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full text-left">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`w-full bg-white dark:bg-slate-900 border rounded-lg px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
        } ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};

