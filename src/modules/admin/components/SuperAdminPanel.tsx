import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../core/context/AuthContext';
import { useLanguage } from '../../../core/context/LanguageContext';
import { BaseCard } from '../../../core/ui/Cards';
import { Button } from '../../../core/ui/Button';
import { Upload, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiDownload, apiFetch } from '../../../core/services/api';

export const SuperAdminPanel: React.FC = () => {
  const { vendorsList, allUsersList, updateUserRole, refreshAuth } = useAuth();
  const { isId } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ text: string; success: boolean } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);

          const res = await apiFetch('/api/admin/vendors/excel-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: data })
          });

          const result = await res.json();
          if (res.ok) {
          const extra = [
            result.skippedCount ? `skipped ${result.skippedCount}` : '',
            result.rowsWithoutEmails ? `no emails ${result.rowsWithoutEmails}` : '',
            result.emailConflicts ? `email already on another vendor ${result.emailConflicts}` : '',
            result.emailsInvalid ? `invalid emails ${result.emailsInvalid}` : '',
          ].filter(Boolean).join(', ');
          setUploadMessage({
            text: `Imported. Created: ${result.createdCount}, Updated: ${result.updatedCount}, Invites: ${result.invitesQueued}${extra ? `. ${extra}` : ''}`,
            success: !result.emailConflicts && !result.rowsWithoutEmails,
          });
            await refreshAuth();
          } else {
            throw new Error(result.error || 'Failed to upload');
          }
        } catch (err: any) {
          setUploadMessage({ text: `Upload Error: ${err.message}`, success: false });
        } finally {
          setUploading(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (err: any) {
      setUploading(false);
      setUploadMessage({ text: `File read error: ${err.message}`, success: false });
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Excel Upload Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">{isId ? 'Daftar' : 'Roster'}</h3>
            <p className="mt-1 text-sm italic text-slate-600 dark:text-slate-300">
              {isId ? 'Satu baris satu perusahaan. Email undangan di kolom allowedEmails, dipisah koma.' : 'One row per company. Put the invited emails in allowedEmails, separated by commas.'}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={() => void apiDownload('/api/admin/reports/vendors.csv', 'esg-vendors.csv')}
          >
            Export CSV
          </Button>
        </div>

        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center bg-slate-50 dark:bg-slate-800/40 relative">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            disabled={uploading}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="space-y-3 pointer-events-none">
            <Upload className="w-10 h-10 text-emerald-600 mx-auto" />
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {uploading ? 'Processing Excel file...' : 'Click to upload or drag & drop Excel file'}
              </p>
              <p className="text-xs text-slate-500 mt-1">.xlsx, .xls or .csv files supported</p>
            </div>
          </div>
        </div>

        {uploadMessage && (
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            uploadMessage.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/50 dark:text-red-300'
          }`}>
            {uploadMessage.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{uploadMessage.text}</span>
          </div>
        )}
      </div>

      {/* User Management & Role Assignment */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{isId ? 'Orang' : 'People'}</h3>
        <p className="text-sm italic text-slate-600 dark:text-slate-300">{isId ? 'Peran dan perusahaan ada di baris. Ubah hanya kalau undangannya salah.' : 'Role and company are on the row. Change them only if the invite is wrong.'}</p>
        {allUsersList.map(u => (
          <div key={u.id} className="grid gap-2 border-b border-slate-300 py-4 dark:border-slate-800 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <div>
              <p className="text-lg font-semibold">{u.name || u.email}</p>
              <p className="text-sm italic text-slate-600 dark:text-slate-300">
                {u.email} · <span className="font-semibold text-emerald-500">{u.role || 'no role'}</span>
                {' · '}
                {vendorsList.find(v => String(v.id) === String(u.vendorId))?.companyName || (isId ? 'Tanpa perusahaan' : 'No company')}
              </p>
            </div>
            <select
              value={u.role}
              onChange={async (e) => { await updateUserRole(u.id, e.target.value, u.vendorId); }}
              className="bg-transparent text-sm text-slate-900 dark:text-white"
            >
              <option value="super_admin">super_admin</option>
              <option value="admin">admin</option>
              <option value="vendor_admin">vendor_admin</option>
              <option value="vendor_member">vendor_member</option>
            </select>
            <select
              value={u.vendorId || ''}
              onChange={async (e) => {
                const vId = e.target.value ? parseInt(e.target.value) : undefined;
                await updateUserRole(u.id, u.role, vId);
              }}
              className="bg-transparent text-sm text-slate-900 dark:text-white"
            >
              <option value="">{isId ? 'Tanpa perusahaan' : 'No company'}</option>
              {vendorsList.map(v => (
                <option key={v.id} value={v.id}>{v.companyName}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};
