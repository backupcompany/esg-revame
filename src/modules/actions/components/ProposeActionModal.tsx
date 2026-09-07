import React, { useState, useEffect } from 'react';
import { Modal } from '../../../core/ui/FeedbackStates';
import { Button } from '../../../core/ui/Button';
import { Input, Select, TextArea } from '../../../core/ui/Form';
import { PillarBadge } from '../../../core/ui/Badges';
import { ESGPillar, ProposedESGAction, VendorProfile } from '../../../core/types';
import {
  MASTER_DIFFICULTIES,
  MASTER_EVIDENCE_TYPES,
  resolveCategoryBilingual,
  findMasterCategory
} from '../utils/catalogDictionary';
import { useMasterCategories } from '../hooks/useMasterCategories';
import { PracticalTipsEditor } from './PracticalTipsEditor';
import { EsgFrameworkBadge } from './EsgFrameworkBadge';
import { PLACEHOLDER_IMAGE } from '../../../core/ui/assets';
import {
  Sparkles,
  PlusCircle,
  CheckCircle2,
  Image as ImageIcon,
  Send,
  HelpCircle,
  Layers,
  Globe,
  Award,
  Building2,
  Truck,
  Briefcase,
  FileCheck,
  Eye
} from 'lucide-react';

interface ProposeActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (proposalData: Omit<ProposedESGAction, 'id' | 'status' | 'submittedAt'>) => Promise<void>;
  vendorProfile: VendorProfile | null;
  lang?: 'ID' | 'EN';
}

const PRESET_IMAGES = [
  { label: 'Green Transport / EV / Logistics', url: PLACEHOLDER_IMAGE },
  { label: 'Solar & Renewable Energy', url: PLACEHOLDER_IMAGE },
  { label: 'Eco Packaging & Sorting', url: PLACEHOLDER_IMAGE },
  { label: 'Tree / Mangrove Planting / Nature', url: PLACEHOLDER_IMAGE },
  { label: 'Workplace Safety / K3 / PPE', url: PLACEHOLDER_IMAGE },
  { label: 'Ethics & Compliance / Governance', url: PLACEHOLDER_IMAGE },
  { label: 'Digital Office & Paperless IT', url: PLACEHOLDER_IMAGE },
  { label: 'Food Waste & Sustainable Catering', url: PLACEHOLDER_IMAGE },
];

export const ProposeActionModal: React.FC<ProposeActionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vendorProfile,
  lang = 'ID',
}) => {
  const isId = lang === 'ID';
  const cats = useMasterCategories();
  const defaultCategory = cats[0];

  const [title, setTitle] = useState('');
  const [titleId, setTitleId] = useState('');
  const [pillar, setPillar] = useState<ESGPillar>('E');
  const [category, setCategory] = useState('');
  const [categoryEn, setCategoryEn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionId, setDescriptionId] = useState('');
  const [rationale, setRationale] = useState('');
  const [difficulty, setDifficulty] = useState<'Starter' | 'Moderate' | 'Advanced'>('Moderate');
  const [estimatedDays, setEstimatedDays] = useState(14);
  const [impactMetricUnit, setImpactMetricUnit] = useState('');
  const [impactMultiplier, setImpactMultiplier] = useState(100);
  const [suggestedPoints, setSuggestedPoints] = useState(120);
  const [suggestedEvidenceType, setSuggestedEvidenceType] = useState<'photo' | 'document' | 'both'>('both');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [practicalTipsId, setPracticalTipsId] = useState<string[]>([]);
  const [practicalTipsEn, setPracticalTipsEn] = useState<string[]>([]);

  useEffect(() => {
    if (!defaultCategory || category) return;
    setPillar(defaultCategory.pillar);
    setCategory(defaultCategory.nameId);
    setCategoryEn(defaultCategory.nameEn);
    setImpactMetricUnit(defaultCategory.defaultMetricUnitId);
    setPracticalTipsId(defaultCategory.defaultTipsId);
    setPracticalTipsEn(defaultCategory.defaultTipsEn);
  }, [defaultCategory, category]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCategorySelectChange = (chosenName: string) => {
    const resolved = resolveCategoryBilingual(chosenName);
    if (resolved) {
      setCategory(resolved.categoryId);
      setCategoryEn(resolved.category);
      setPillar(resolved.pillar);
      setImpactMetricUnit(isId ? resolved.metricUnitId : resolved.metricUnitEn);
      // Auto pre-populate tips if empty or unmodified
      if (practicalTipsId.length === 0 || practicalTipsId[0] === '') {
        setPracticalTipsId(resolved.defaultTipsId);
        setPracticalTipsEn(resolved.defaultTipsEn);
      }
    } else {
      setCategory(chosenName);
      setCategoryEn(chosenName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title && !titleId) return;
    if (!vendorProfile?.id) return;

    setIsSubmitting(true);
    try {
      const cleanedTipsId = practicalTipsId.filter(t => t.trim().length > 0);
      const cleanedTipsEn = practicalTipsEn.filter(t => t.trim().length > 0);

      await onSubmit({
        vendorId: vendorProfile.id,
        vendorName: vendorProfile.name,
        title: title || titleId,
        titleId: titleId || title,
        description: description || descriptionId || rationale,
        descriptionId: descriptionId || description || rationale,
        pillar,
        category: categoryEn,
        difficulty,
        estimatedDays: Number(estimatedDays) || 7,
        impactMetricUnit: impactMetricUnit || 'Units',
        impactMultiplier: Number(impactMultiplier) || 50,
        suggestedPoints: Number(suggestedPoints) || 100,
        rationale: rationale || descriptionId || description,
        proposedByEmail: vendorProfile.contactEmail || '',
        proposedByName: vendorProfile.contactName || vendorProfile.name,
        suggestedEvidenceType,
        imageUrl: imageUrl || PRESET_IMAGES[0].url
      });
      setIsSuccess(true);
    } catch (err) {
      console.error('Error submitting proposal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setTitleId('');
    setDescription('');
    setDescriptionId('');
    setRationale('');
    setIsSuccess(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetForm}
      maxWidth="5xl"
      title={isId ? 'Ajukan Inisiatif Aksi ESG Baru (Mitra Vendor Siloam)' : 'Propose New ESG Action Initiative (Partner Vendor)'}
    >
      {isSuccess ? (
        <div className="py-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isId ? 'Pengajuan Inisiatif Berhasil Dikirim!' : 'Proposal Submitted Successfully!'}
            </h3>
            <p className="text-xs text-slate-500">
              {isId
                ? 'Tim Auditor ESG Siloam Hospitals akan mereview usulan inisiatif ini. Jika disetujui, inisiatif akan langsung masuk ke Katalog Aksi resmi dan dapat dikomit oleh seluruh mitra.'
                : 'Siloam Hospitals ESG Auditor will review your proposal. Once approved, it will be published to the official catalog.'}
            </p>
          </div>
          <Button variant="primary" size="md" onClick={resetForm} className="w-full">
            {isId ? 'Selesai & Kembali ke Katalog' : 'Done & Return to Catalog'}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          {/* Top Banner: Cross-Sector Inclusivity */}
          <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 dark:from-emerald-950/40 dark:to-indigo-950/40 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 text-xs text-slate-800 dark:text-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-emerald-600 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <strong className="font-semibold text-slate-900 dark:text-slate-100 block mb-0.5">
                  {isId ? 'Inovasi Lintas Sektor untuk Seluruh Mitra Vendor Siloam' : 'Cross-Sector Innovation for All Siloam Partners'}
                </strong>
                <span className="text-slate-600 dark:text-slate-300">
                  {isId
                    ? 'Terbuka untuk vendor di berbagai bidang (Logistik, Katering, Laundry, Fasilitas/Kebersihan, IT & Software, Konstruksi, ATK, K3, hingga Farmasi). Usulkan aksi nyata pengurangan emisi atau tata kelola beretika sesuai bidang usaha Anda.'
                    : 'Open to suppliers across all sectors (Logistics, Catering, Laundry, FM/Janitorial, IT, Construction, Office, OHS, and Healthcare). Propose impactful practices tailored to your core business.'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                GRI & POJK 51 Aligned
              </span>
            </div>
          </div>

          {/* Master Category Selector with Bilingual Auto Sync */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                {isId ? 'Pilih Kategori Master ESG (Otomatis ID & EN) *' : 'Master ESG Category (Auto ID & EN Sync) *'}
              </label>
              <span className="text-[11px] text-slate-500">Universal Best Practice (GRI / POJK 51 / ISO)</span>
            </div>

            <select
              value={category}
              onChange={e => handleCategorySelectChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {cats.map(cat => (
                <option key={cat.id} value={cat.nameId}>
                  [{cat.pillar}] {cat.nameId} — {cat.nameEn}
                </option>
              ))}
            </select>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2 text-xs">
              <EsgFrameworkBadge
                categoryName={categoryEn || category}
                points={suggestedPoints}
              />
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span>Pilar: <strong className="text-slate-800 dark:text-slate-200">{pillar}</strong></span>
                <span>•</span>
                <span>Standar: <strong className="text-slate-800 dark:text-slate-200">{categoryEn}</strong></span>
              </div>
            </div>
          </div>

          {/* 2-Column Responsive Layout for Wider Screen Experience */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column (Span 7): Titles, Descriptions, Rationale, and Bilingual Practical Tips */}
            <div className="lg:col-span-7 space-y-4">
              {/* Action Titles */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="text-emerald-600">ID</span>
                    {isId ? 'Judul Inisiatif Aksi (Bahasa Indonesia) *' : 'Action Title (Indonesian) *'}
                  </label>
                  <Input
                    required
                    placeholder="cth: Transisi Pengiriman Armada Listrik (EV) & Rute Rendah Emisi"
                    value={titleId}
                    onChange={e => setTitleId(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="text-indigo-600">EN</span>
                    {isId ? 'Judul Inisiatif (English - Opsional)' : 'Action Title (English)'}
                  </label>
                  <Input
                    placeholder="e.g. EV Fleet Delivery Transition & Low-Emission Route Optimization"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>
              </div>

              {/* Descriptions & Value Proposition */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isId ? 'Deskripsi Teknis & Cara Kerja Aksi (Bahasa Indonesia) *' : 'Action Technical Scope (ID) *'}
                  </label>
                  <TextArea
                    required
                    rows={3}
                    placeholder={isId ? 'Jelaskan tahapan implementasi teknis, cakupan fasilitas, dan metodologi kerja vendor...' : 'Explain operational implementation scope...'}
                    value={descriptionId}
                    onChange={e => setDescriptionId(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isId ? 'Alasan & Manfaat Keberlanjutan Bagi Siloam Hospitals *' : 'Sustainability Value Proposition *'}
                  </label>
                  <TextArea
                    required
                    rows={2}
                    placeholder={isId ? 'Potensi pengurangan emisi Scope 3, efisiensi energi, kepatuhan K3, atau etika bisnis...' : 'Why is this initiative impactful for Siloam Hospitals?'}
                    value={rationale}
                    onChange={e => setRationale(e.target.value)}
                  />
                </div>
              </div>

              {/* Practical Tips Editor */}
              <PracticalTipsEditor
                tipsId={practicalTipsId}
                tipsEn={practicalTipsEn}
                onChange={(tId, tEn) => {
                  setPracticalTipsId(tId);
                  setPracticalTipsEn(tEn);
                }}
                onLoadCategoryDefaults={() => {
                  const match = findMasterCategory(category || categoryEn);
                  if (match) {
                    setPracticalTipsId(match.defaultTipsId);
                    setPracticalTipsEn(match.defaultTipsEn);
                  }
                }}
                categoryName={category}
              />
            </div>

            {/* Right Column (Span 5): Metrics, Estimation, Evidence, Live Card Preview */}
            <div className="lg:col-span-5 space-y-4">
              {/* Metrics & Parameters Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  {isId ? 'Parameter Metrik & Skor Poin' : 'Metric Parameters & Points'}
                </h4>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isId ? 'Satuan Metrik Dampak Terukur *' : 'Measurable Impact Unit *'}
                  </label>
                  <Input
                    required
                    placeholder="cth: km Rute Bebas Emisi / thn"
                    value={impactMetricUnit}
                    onChange={e => setImpactMetricUnit(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isId ? 'Estimasi Waktu' : 'Est. Duration'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="1"
                        value={estimatedDays}
                        onChange={e => setEstimatedDays(Number(e.target.value))}
                      />
                      <span className="text-xs text-slate-500">{isId ? 'Hari' : 'Days'}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isId ? 'Usulan Poin (SG-PTS)' : 'Suggested SG-PTS'}
                    </label>
                    <Input
                      type="number"
                      min="10"
                      max="1000"
                      value={suggestedPoints}
                      onChange={e => setSuggestedPoints(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isId ? 'Tingkat Kesulitan' : 'Difficulty'}
                    </label>
                    <Select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value as any)}
                      options={MASTER_DIFFICULTIES.map(d => ({ value: d.value, label: isId ? d.labelId.split(' ')[0] : d.labelEn.split(' ')[0] }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isId ? 'Tipe Bukti Audit' : 'Evidence Type'}
                    </label>
                    <Select
                      value={suggestedEvidenceType}
                      onChange={e => setSuggestedEvidenceType(e.target.value as any)}
                      options={MASTER_EVIDENCE_TYPES.map(m => ({ value: m.value, label: isId ? m.labelId.split(' ')[0] : m.labelEn.split(' ')[0] }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isId ? 'Pilih Gambar Ilustrasi Preset' : 'Select Preset Image'}
                  </label>
                  <Select
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    options={PRESET_IMAGES.map(img => ({ value: img.url, label: img.label }))}
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    {isId ? 'Pratinjau Kartu di Katalog Resmi' : 'Live Official Catalog Preview'}
                  </span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded font-mono">
                    +{suggestedPoints} SG-PTS
                  </span>
                </div>

                <div className="rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <div className="relative h-28 w-full">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <PillarBadge pillar={pillar} />
                    </div>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                      {titleId || title || (isId ? 'Judul Inisiatif Mitra' : 'Partner Initiative Title')}
                    </h5>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {descriptionId || description || rationale || (isId ? 'Deskripsi inisiatif aksi...' : 'Action description...')}
                    </p>
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{difficulty} • {estimatedDays} Hari</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{impactMetricUnit}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer controls */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>
                {isId ? 'Diusulkan atas nama:' : 'Proposed by:'}{' '}
                <strong className="text-slate-700 dark:text-slate-300">{vendorProfile?.name || '—'}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <Button variant="ghost" size="md" type="button" onClick={resetForm}>
                {isId ? 'Batal' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={isSubmitting}
                icon={<Send className="w-4 h-4" />}
              >
                {isId ? 'Kirim Usulan Inisiatif ke Auditor ESG Siloam' : 'Submit Proposal to Siloam Auditor'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};

