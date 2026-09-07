import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../core/context/AuthContext';
import { BaseCard } from '../../../core/ui/Cards';
import { Button } from '../../../core/ui/Button';
import { Upload, FileSpreadsheet, Users, Building2, ShieldCheck, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiDownload, apiFetch } from '../../../core/services/api';

export const SuperAdminPanel: React.FC = () => {
  const { vendorsList, allUsersList, updateUserRole, refreshAuth } = useAuth();
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
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Excel Bulk Upload for Vendor Companies</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload an Excel (.xlsx or .csv) containing columns: <code className="text-emerald-600 font-mono">companyName</code>, <code className="text-emerald-600 font-mono">industry</code>, <code className="text-emerald-600 font-mono">employeeCount</code>, <code className="text-emerald-600 font-mono">contactPerson</code>, <code className="text-emerald-600 font-mono">phone</code>, <code className="text-emerald-600 font-mono">address</code>, <code className="text-emerald-600 font-mono">allowedEmails</code> (comma-separated).
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">User Role Management & Permissions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assign roles (<code className="font-bold">super_admin</code>, <code className="font-bold">admin</code>, <code className="font-bold">vendor_admin</code>, <code className="font-bold">vendor_member</code>) and associate users to vendor companies.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3 px-4">User Email</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Vendor Company</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {allUsersList.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{u.email}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{u.name || '-'}</td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={async (e) => {
                        await updateUserRole(u.id, e.target.value, u.vendorId);
                      }}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="super_admin">Superadmin</option>
                      <option value="admin">Admin (Corporate Reviewer)</option>
                      <option value="vendor_admin">Vendor Admin</option>
                      <option value="vendor_member">Vendor Member</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={u.vendorId || ''}
                      onChange={async (e) => {
                        const vId = e.target.value ? parseInt(e.target.value) : undefined;
                        await updateUserRole(u.id, u.role, vId);
                      }}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- No Vendor Assigned --</option>
                      {vendorsList.map(v => (
                        <option key={v.id} value={v.id}>{v.companyName}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-md text-[10px] font-bold">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
