import React, { useState, useEffect } from 'react';
import { vendorService } from '../../../core/services/vendorService';
import { Button } from '../../../core/ui/Button';
import { VendorProfile } from '../../../core/types';
import { useLanguage } from '../../../core/context/LanguageContext';

interface ProfileViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onStartOnboarding?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ theme, onToggleTheme, onStartOnboarding }) => {
  const { isId } = useLanguage();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState<Partial<VendorProfile>>({});

  const loadData = async () => {
    const v = await vendorService.getProfile();
    setVendor(v);
    setFormData(v);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await vendorService.updateProfile(formData);
      setVendor(updated);
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (!vendor) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8 text-left">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{vendor.name}</h1>
          <p className="mt-1 text-sm italic text-slate-600 dark:text-slate-300">
            {isId
              ? `Level ${vendor.esgMaturityLevel}. Isi data perusahaan, lalu simpan.`
              : `Level ${vendor.esgMaturityLevel}. Fill in the company details, then save.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <p className="text-sm font-semibold text-emerald-500">{isId ? 'Tersimpan.' : 'Saved.'}</p>
          )}
          <Button variant="primary" size="md" type="submit" form="vendor-profile" isLoading={isSaving}>
            {isId ? 'Simpan' : 'Save'}
          </Button>
        </div>
      </div>

      <form id="vendor-profile" onSubmit={handleSave} className="divide-y divide-slate-300 dark:divide-slate-800">
        {([
          ['name', isId ? 'Perusahaan' : 'Company', true],
          ['industry', isId ? 'Industri' : 'Industry', true],
          ['employeeCount', isId ? 'Karyawan' : 'People', false],
          ['location', isId ? 'Kota' : 'City', false],
          ['contactEmail', isId ? 'Email' : 'Email', false],
          ['contactName', isId ? 'Kontak' : 'Contact', false],
        ] as const).map(([key, label, required]) => (
          <label key={key} className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:items-center">
            <span className="text-sm text-slate-500">{label}</span>
            <input
              value={String(formData[key] || '')}
              required={required}
              onChange={e => { setSaved(false); setFormData({ ...formData, [key]: e.target.value }); }}
              className="w-full bg-transparent text-lg text-slate-900 outline-none dark:text-white"
            />
          </label>
        ))}
        <label className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr]">
          <span className="text-sm text-slate-500">{isId ? 'Tujuan' : 'Goal'}</span>
          <textarea
            rows={2}
            value={formData.sustainabilityGoal || ''}
            onChange={e => { setSaved(false); setFormData({ ...formData, sustainabilityGoal: e.target.value }); }}
            placeholder={isId ? 'Satu kalimat. Contoh: kurangi kertas tahun ini.' : 'One sentence. Example: cut paper use this year.'}
            className="w-full resize-none bg-transparent text-lg italic text-slate-900 outline-none dark:text-white"
          />
        </label>
      </form>

      <div className="flex flex-wrap gap-6 text-sm">
        {onStartOnboarding && (
          <button type="button" onClick={onStartOnboarding} className="cursor-pointer font-semibold text-emerald-600">
            {isId ? 'Ulangi langkah awal' : 'Repeat the first steps'}
          </button>
        )}
        <button type="button" onClick={onToggleTheme} className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">
          {theme === 'dark' ? (isId ? 'Pakai mode terang' : 'Use light mode') : (isId ? 'Pakai mode gelap' : 'Use dark mode')}
        </button>
      </div>
    </div>
  );
};
