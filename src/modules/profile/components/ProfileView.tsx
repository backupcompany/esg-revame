import React, { useState, useEffect } from 'react';
import { vendorService } from '../../../core/services/vendorService';
import { tokenLogger } from '../../../core/services/ai/TokenLogger';
import { BaseCard } from '../../../core/ui/Cards';
import { Button } from '../../../core/ui/Button';
import { Input, TextArea } from '../../../core/ui/Form';
import { LevelBadge } from '../../../core/ui/Badges';
import { VendorProfile, AiLogEntry } from '../../../core/types';
import { User, ShieldCheck, Sparkles, Save, RotateCcw, Cpu, Moon, Sun, Building, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '../../../core/context/LanguageContext';

interface ProfileViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onStartOnboarding?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ theme, onToggleTheme, onStartOnboarding }) => {
  const { isId } = useLanguage();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [aiLogs, setAiLogs] = useState<AiLogEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<VendorProfile>>({});

  const loadData = async () => {
    const v = await vendorService.getProfile();
    setVendor(v);
    setFormData(v);
    const logs = await tokenLogger.getRecentLogs();
    setAiLogs(logs);
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
      alert('Profile updated successfully!');
    } finally {
      setIsSaving(false);
    }
  };

  if (!vendor) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-left">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-600" /> {isId ? 'Profil Vendor & Identitas ESG' : 'Vendor Profile & ESG Identity'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isId
            ? 'Kelola data organisasi, pernyataan komitmen keberlanjutan, dan log efisiensi AI.'
            : 'Manage your organization details, sustainability commitment statement, and view AI efficiency logs.'}
        </p>
      </div>

      {/* Main Profile Card */}
      <BaseCard padding="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-xl">
                {vendor.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{vendor.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <LevelBadge level={vendor.esgMaturityLevel} size="sm" />
                  <span className="text-xs text-slate-400">Verified ID: {vendor.id}</span>
                </div>
              </div>
            </div>

            <Button variant="primary" size="md" type="submit" isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
              {isId ? 'Simpan Profil' : 'Save Profile'}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={isId ? 'Nama Perusahaan' : 'Company Name'}
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              icon={<Building className="w-4 h-4" />}
              required
            />
            <Input
              label={isId ? 'Sektor Industri' : 'Industry Sector'}
              value={formData.industry || ''}
              onChange={e => setFormData({ ...formData, industry: e.target.value })}
              required
            />
            <Input
              label={isId ? 'Jumlah Karyawan' : 'Employee Size'}
              value={formData.employeeCount || ''}
              onChange={e => setFormData({ ...formData, employeeCount: e.target.value })}
            />
            <Input
              label={isId ? 'Lokasi Operasi' : 'Operating Location'}
              value={formData.location || ''}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              icon={<MapPin className="w-4 h-4" />}
            />
            <Input
              label={isId ? 'Email Kontak' : 'Contact Email'}
              value={formData.contactEmail || ''}
              onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
              icon={<Mail className="w-4 h-4" />}
            />
            <Input
              label={isId ? 'Nama PIC' : 'Primary Contact Representative'}
              value={formData.contactName || ''}
              onChange={e => setFormData({ ...formData, contactName: e.target.value })}
            />
          </div>

          <TextArea
            label={isId ? 'Pernyataan / Target Keberlanjutan' : 'Company Sustainability Statement / Goal'}
            value={formData.sustainabilityGoal || ''}
            onChange={e => setFormData({ ...formData, sustainabilityGoal: e.target.value })}
            placeholder="E.g., Target 30% carbon footprint reduction and 100% fair workplace policy..."
          />
        </form>
      </BaseCard>

      {/* Onboarding & Theme Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseCard padding="md" className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{isId ? 'Onboarding Vendor' : 'Vendor Onboarding'}</h4>
            <p className="text-xs text-slate-500">{isId ? 'Ulangi pengalaman onboarding 5 menit.' : 'Re-run the 5-minute onboarding experience.'}</p>
          </div>

          {onStartOnboarding && (
            <Button variant="outline" size="sm" icon={<RotateCcw className="w-4 h-4 text-emerald-600" />} onClick={onStartOnboarding}>
              {isId ? 'Mulai Onboarding' : 'Start Onboarding'}
            </Button>
          )}
        </BaseCard>

        <BaseCard padding="md" className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{isId ? 'Tampilan & Tema' : 'Appearance & Theme'}</h4>
            <p className="text-xs text-slate-500">{isId ? 'Ganti antara mode terang dan gelap.' : 'Switch between Light Mode and Dark Mode styling.'}</p>
          </div>

          <Button variant="outline" size="sm" icon={theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />} onClick={onToggleTheme}>
            {theme === 'dark' ? (isId ? 'Mode Terang' : 'Light Mode') : (isId ? 'Mode Gelap' : 'Dark Mode')}
          </Button>
        </BaseCard>
      </div>

      {/* AI Token Efficiency & Usage Log Viewer */}
      <BaseCard padding="md" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">AI Token Logging & Efficiency</h4>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
            {aiLogs.length} AI Calls Logged
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Transparent token logging tracking all Gemini API calls (action recommendations, evidence auto-verification, report summaries) for cost efficiency.
        </p>

        {aiLogs.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">No AI calls logged yet in this session.</p>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs">
            {aiLogs.map(log => (
              <div key={log.id} className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-center justify-between border border-slate-200/50 dark:border-slate-800">
                <div className="space-x-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{log.actionType}</span>
                  <span className="text-slate-400">({log.model})</span>
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  {log.tokensUsed} tokens • ${log.estimatedCost.toFixed(5)}
                </div>
              </div>
            ))}
          </div>
        )}
      </BaseCard>
    </div>
  );
};
