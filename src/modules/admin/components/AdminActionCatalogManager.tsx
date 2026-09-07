import React, { useState, useEffect } from 'react';
import { actionService } from '../../../core/services/actionService';
import { ESGAction, ESGPillar, ProposedESGAction, ProposalStatus } from '../../../core/types';
import { BaseCard } from '../../../core/ui/Cards';
import { Button } from '../../../core/ui/Button';
import { Input, Select, TextArea } from '../../../core/ui/Form';
import { PillarBadge } from '../../../core/ui/Badges';
import { Modal } from '../../../core/ui/FeedbackStates';
import { PLACEHOLDER_IMAGE } from '../../../core/ui/assets';
import {
  downloadActionCatalogTemplate,
  exportActionsToExcel,
  parseExcelFile
} from '../../actions/utils/excelHelper';
import {
  MASTER_DIFFICULTIES,
  MASTER_EVIDENCE_TYPES,
  resolveCategoryBilingual,
  SILOAM_PTS_METRIC_INFO,
  findMasterCategory
} from '../../actions/utils/catalogDictionary';
import { useMasterCategories } from '../../actions/hooks/useMasterCategories';
import { PracticalTipsEditor } from '../../actions/components/PracticalTipsEditor';
import { EsgFrameworkBadge } from '../../actions/components/EsgFrameworkBadge';
import {
  Compass,
  FileSpreadsheet,
  Upload,
  Download,
  PlusCircle,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  Eye,
  Sparkles,
  Layers,
  Send,
  ToggleLeft,
  ToggleRight,
  Clock,
  HelpCircle,
  FileCheck,
  Building2,
  ShieldCheck,
  Globe,
  Award,
  BookOpen
} from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Green Transport / EV', url: PLACEHOLDER_IMAGE },
  { label: 'Solar & Renewable Energy', url: PLACEHOLDER_IMAGE },
  { label: 'Eco Packaging & Sorting', url: PLACEHOLDER_IMAGE },
  { label: 'Tree / Mangrove Planting', url: PLACEHOLDER_IMAGE },
  { label: 'Workplace Safety / K3', url: PLACEHOLDER_IMAGE },
  { label: 'Ethics & Compliance', url: PLACEHOLDER_IMAGE },
];

export const AdminActionCatalogManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'proposals'>('catalog');
  const [actions, setActions] = useState<ESGAction[]>([]);
  const [proposals, setProposals] = useState<ProposedESGAction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pillarFilter, setPillarFilter] = useState<ESGPillar | 'ALL'>('ALL');
  const [proposalStatusFilter, setProposalStatusFilter] = useState<ProposalStatus | 'ALL'>('ALL');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Partial<ESGAction> | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedPreview, setImportedPreview] = useState<Partial<ESGAction>[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  
  // Proposal detailed review & approve modal
  const [reviewingProposal, setReviewingProposal] = useState<ProposedESGAction | null>(null);
  const cats = useMasterCategories();
  const [proposalReviewForm, setProposalReviewForm] = useState<Partial<ESGAction>>({});

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const acts = await actionService.getActions(undefined, undefined, false);
      const props = await actionService.getProposedActions();
      setActions(acts);
      setProposals(props);
    } catch (e) {
      console.error('Error loading admin action data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleToggleStatus = async (id: string) => {
    await actionService.toggleActionStatus(id);
    await loadAllData();
  };

  const handleDeleteAction = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus inisiatif aksi ini dari katalog?')) {
      await actionService.deleteAction(id);
      await loadAllData();
    }
  };

  const handleCategorySelect = (categoryIdOrName: string) => {
    if (!editingAction) return;
    const resolved = resolveCategoryBilingual(categoryIdOrName);
    if (resolved) {
      setEditingAction({
        ...editingAction,
        categoryId: resolved.categoryId,
        category: resolved.category,
        pillar: resolved.pillar,
        impactMetricUnitId: resolved.metricUnitId,
        impactMetricUnit: resolved.metricUnitEn,
        impactMetricLabelId: resolved.metricLabelId,
        impactMetricLabel: resolved.metricLabelEn,
        iconName: resolved.iconName,
        practicalTipsId: (editingAction.practicalTipsId && editingAction.practicalTipsId.length > 0 && editingAction.practicalTipsId[0] !== '') 
          ? editingAction.practicalTipsId 
          : resolved.defaultTipsId,
        practicalTips: (editingAction.practicalTips && editingAction.practicalTips.length > 0 && editingAction.practicalTips[0] !== '') 
          ? editingAction.practicalTips 
          : resolved.defaultTipsEn,
      });
    } else {
      setEditingAction({
        ...editingAction,
        categoryId: categoryIdOrName,
        category: categoryIdOrName,
      });
    }
  };

  const handleProposalCategorySelect = (categoryIdOrName: string) => {
    const resolved = resolveCategoryBilingual(categoryIdOrName);
    if (resolved) {
      setProposalReviewForm(prev => ({
        ...prev,
        categoryId: resolved.categoryId,
        category: resolved.category,
        pillar: resolved.pillar,
        impactMetricUnitId: resolved.metricUnitId,
        impactMetricUnit: resolved.metricUnitEn,
        impactMetricLabelId: resolved.metricLabelId,
        impactMetricLabel: resolved.metricLabelEn,
        practicalTipsId: prev.practicalTipsId && prev.practicalTipsId.length > 0 ? prev.practicalTipsId : resolved.defaultTipsId,
        practicalTips: prev.practicalTips && prev.practicalTips.length > 0 ? prev.practicalTips : resolved.defaultTipsEn,
      }));
    }
  };

  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAction) return;

    const cleanedTipsId = (editingAction.practicalTipsId || []).filter(t => t.trim().length > 0);
    const cleanedTipsEn = (editingAction.practicalTips || []).filter(t => t.trim().length > 0);

    await actionService.createOrUpdateAction({
      ...editingAction,
      practicalTipsId: cleanedTipsId.length > 0 ? cleanedTipsId : ['Lakukan implementasi sesuai standar SOP operasional.'],
      practicalTips: cleanedTipsEn.length > 0 ? cleanedTipsEn : ['Execute step-by-step per standard SOP guidelines.'],
    });

    setIsEditModalOpen(false);
    setEditingAction(null);
    await loadAllData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseExcelFile(file);
      setImportedPreview(parsed);
      setImportErrors([]);
    } catch (err: any) {
      setImportErrors([`Gagal membaca file Excel: ${err?.message || 'Format file tidak valid'}`]);
    }
  };

  const handleConfirmImport = async () => {
    if (importedPreview.length === 0) return;
    setIsProcessingImport(true);
    try {
      const result = await actionService.importActionsFromExcel(importedPreview);
      if (result.errors.length > 0) {
        setImportErrors(result.errors);
      } else {
        setIsImportModalOpen(false);
        setImportedPreview([]);
        await loadAllData();
        alert(`Berhasil mengimpor ${result.importedCount} inisiatif aksi ke dalam katalog!`);
      }
    } catch (err: any) {
      setImportErrors([`Error proses import: ${err?.message}`]);
    } finally {
      setIsProcessingImport(false);
    }
  };

  const openProposalReviewModal = (prop: ProposedESGAction) => {
    setReviewingProposal(prop);
    const resolved = resolveCategoryBilingual(prop.category);
    setProposalReviewForm({
      title: prop.title,
      titleId: prop.titleId || prop.title,
      description: prop.description,
      descriptionId: prop.descriptionId || prop.description,
      pillar: prop.pillar,
      category: resolved ? resolved.category : prop.category,
      categoryId: resolved ? resolved.categoryId : prop.category,
      difficulty: prop.difficulty,
      estimatedDays: prop.estimatedDays,
      impactMetricUnit: prop.impactMetricUnit,
      impactMetricUnitId: resolved ? resolved.metricUnitId : prop.impactMetricUnit,
      points: prop.suggestedPoints || 100,
      requiredEvidenceType: prop.suggestedEvidenceType || 'both',
      imageUrl: prop.imageUrl || PRESET_IMAGES[0].url,
      practicalTips: resolved ? resolved.defaultTipsEn : ['Implement per agreed proposal steps'],
      practicalTipsId: resolved ? resolved.defaultTipsId : ['Terapkan sesuai rencana usulan yang disepakati'],
    });
  };

  const handleConfirmApproveProposal = async () => {
    if (!reviewingProposal) return;
    try {
      await actionService.approveProposal(reviewingProposal.id, proposalReviewForm);
      await loadAllData();
      setReviewingProposal(null);
      alert(`Inisiatif "${proposalReviewForm.titleId || reviewingProposal.titleId || reviewingProposal.title}" telah disetujui dan resmi masuk ke Katalog Aksi!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    const feedback = feedbackText[proposalId] || 'Usulan belum memenuhi kriteria prioritas rantai pasok Siloam Hospitals saat ini.';
    await actionService.reviewProposal(proposalId, 'Rejected', feedback);
    await loadAllData();
  };

  const handleRequestRevision = async (proposalId: string) => {
    const feedback = feedbackText[proposalId] || 'Mohon lengkapi estimasi dampak dan metodologi verifikasi bukti audit.';
    await actionService.reviewProposal(proposalId, 'Needs Revision', feedback);
    await loadAllData();
  };

  const openNewActionModal = () => {
    const defaultCat = cats[0];
    if (!defaultCat) return;
    setEditingAction({
      title: '',
      titleId: '',
      description: '',
      descriptionId: '',
      pillar: defaultCat.pillar,
      category: defaultCat.nameEn,
      categoryId: defaultCat.nameId,
      difficulty: 'Starter',
      estimatedDays: 7,
      impactMetricUnit: defaultCat.defaultMetricUnitEn,
      impactMetricUnitId: defaultCat.defaultMetricUnitId,
      impactMetricLabel: defaultCat.defaultMetricLabelEn,
      impactMetricLabelId: defaultCat.defaultMetricLabelId,
      defaultMetricName: 'energySavedKwh',
      impactMultiplier: 50,
      iconName: defaultCat.iconName,
      imageUrl: PRESET_IMAGES[1].url,
      practicalTips: defaultCat.defaultTipsEn,
      practicalTipsId: defaultCat.defaultTipsId,
      requiredEvidenceType: 'both',
      points: 100,
      isActive: true,
      source: 'system'
    });
    setIsEditModalOpen(true);
  };

  const filteredActions = actions.filter(a => {
    const matchesSearch =
      searchQuery === '' ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.titleId && a.titleId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.categoryId && a.categoryId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPillar = pillarFilter === 'ALL' || a.pillar === pillarFilter;
    return matchesSearch && matchesPillar;
  });

  const filteredProposals = proposals.filter(p => {
    if (proposalStatusFilter === 'ALL') return true;
    return p.status === proposalStatusFilter;
  });

  const pendingProposalsCount = proposals.filter(p => p.status === 'Pending').length;

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner: SG-PTS Scoring Methodology & Global Alignment */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-sm border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold rounded-md flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> SG-PTS (Siloam Green Supply Points)
              </span>
              <span className="px-2 py-0.5 bg-sky-500/20 border border-sky-400/30 text-sky-200 text-[11px] rounded-md font-medium flex items-center gap-1">
                <Globe className="w-3 h-3" /> Diselaraskan: GRI Standards & POJK 51/2017
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Manajemen Master Katalog Aksi ESG & Usulan Mitra
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Kelola inisiatif aksi keberlanjutan terstandardisasi, panduan langkah praktis dwibahasa (ID & EN), serta tinjau usulan inovasi aksi dari mitra vendor.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={openNewActionModal}
              icon={<PlusCircle className="w-4 h-4" />}
            >
              + Inisiatif Baru
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsImportModalOpen(true)}
              icon={<Upload className="w-4 h-4" />}
            >
              Import Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BaseCard padding="md" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 font-semibold block">Total Inisiatif Katalog</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 flex items-center justify-between">
            <span>{actions.length} Aksi</span>
            <span className="text-xs font-normal text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
              {actions.filter(a => a.isActive !== false).length} Aktif
            </span>
          </div>
        </BaseCard>

        <BaseCard padding="md" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 font-semibold block">Usulan Aksi dari Mitra</span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 flex items-center justify-between">
            <span>{proposals.length} Diajukan</span>
            {pendingProposalsCount > 0 && (
              <span className="text-xs font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-md animate-pulse">
                {pendingProposalsCount} Menunggu Review
              </span>
            )}
          </div>
        </BaseCard>

        <BaseCard padding="md" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 font-semibold block">Aksi Cepat Excel & Ekspor</span>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={downloadActionCatalogTemplate}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Unduh Template
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportActionsToExcel(actions)}
              icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            >
              Ekspor (.xlsx)
            </Button>
          </div>
        </BaseCard>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'catalog'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Katalog Master Resmi ({actions.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('proposals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'proposals'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Review Usulan Mitra</span>
            {pendingProposalsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full font-black animate-pulse">
                {pendingProposalsCount}
              </span>
            )}
          </button>
        </div>

        {activeSubTab === 'catalog' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportActionsToExcel(actions)}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export Excel ({actions.length})
          </Button>
        )}
      </div>

      {/* SUB-TAB 1: Master Catalog List */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-4">
          {/* Search and Filter bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama aksi, kategori, ID..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
              {(['ALL', 'E', 'S', 'G'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPillarFilter(p)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    pillarFilter === p
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p === 'ALL' ? 'Semua Pilar' : `Pilar ${p}`}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-center w-14">Gambar</th>
                  <th className="py-3 px-3">Inisiatif Aksi (ID & EN)</th>
                  <th className="py-3 px-3 text-center">Pilar</th>
                  <th className="py-3 px-3 hidden md:table-cell">Kategori Master</th>
                  <th className="py-3 px-3 text-center">Standar & Poin</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredActions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Tidak ada inisiatif aksi yang sesuai kriteria.
                    </td>
                  </tr>
                ) : (
                  filteredActions.map(act => (
                    <tr key={act.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Image Thumbnail */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-11 h-9 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-auto">
                          <img
                            src={act.imageUrl || PLACEHOLDER_IMAGE}
                            alt={act.titleId || act.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      {/* Title and ID */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {act.titleId || act.title}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{act.id}</span>
                          <span>• {act.title}</span>
                          {act.practicalTipsId && act.practicalTipsId.length > 0 && (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              ({act.practicalTipsId.length} tips)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Pillar */}
                      <td className="py-2.5 px-3 text-center">
                        <PillarBadge pillar={act.pillar} />
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 hidden md:table-cell">
                        <div className="font-medium">{act.categoryId || act.category}</div>
                        <div className="text-[10px] text-slate-400">{act.category}</div>
                      </td>

                      {/* Framework & Points */}
                      <td className="py-2.5 px-3 text-center">
                        <EsgFrameworkBadge
                          categoryName={act.category || act.categoryId}
                          points={act.points}
                          size="sm"
                        />
                      </td>

                      {/* Active Status */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleStatus(act.id)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            act.isActive !== false
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                          }`}
                        >
                          {act.isActive !== false ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>

                      {/* Edit / Delete Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingAction(act);
                              setIsEditModalOpen(true);
                            }}
                            title="Edit Inisiatif"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAction(act.id)}
                            title="Hapus Inisiatif"
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Partner Proposals Review */}
      {activeSubTab === 'proposals' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Filter Status Usulan:</span>
              {(['ALL', 'Pending', 'Approved', 'Rejected', 'Needs Revision'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setProposalStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    proposalStatusFilter === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {st === 'ALL' ? 'Semua' : st}
                </button>
              ))}
            </div>
            <span className="text-slate-500 font-medium">
              Menampilkan {filteredProposals.length} usulan
            </span>
          </div>

          {filteredProposals.length === 0 ? (
            <BaseCard padding="lg" className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Tidak ada usulan inisiatif pada status ini
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Mitra vendor belum mengajukan inisiatif baru atau filter tidak cocok.
              </p>
            </BaseCard>
          ) : (
            <div className="space-y-4">
              {filteredProposals.map(prop => (
                <BaseCard key={prop.id} padding="md" className="space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" /> {prop.vendorName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            prop.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : prop.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : prop.status === 'Needs Revision'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800 animate-pulse'
                          }`}
                        >
                          Status: {prop.status}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Diajukan: {prop.submittedAt}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {prop.titleId || prop.title}
                      </h3>
                      {prop.title && prop.titleId && prop.title !== prop.titleId && (
                        <span className="text-xs text-slate-400 italic">EN: {prop.title}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <PillarBadge pillar={prop.pillar} />
                      <EsgFrameworkBadge
                        categoryName={prop.category}
                        points={prop.suggestedPoints}
                      />
                    </div>
                  </div>

                  {/* Proposal Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="md:col-span-2 space-y-2">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                        <strong className="text-slate-700 dark:text-slate-300 block mb-1">
                          Deskripsi & Metodologi Inisiatif:
                        </strong>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {prop.descriptionId || prop.description}
                        </p>
                      </div>

                      <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                        <strong className="text-indigo-950 dark:text-indigo-200 block mb-1">
                          Alasan & Manfaat Keberlanjutan Bagi Siloam:
                        </strong>
                        <p className="text-indigo-900/80 dark:text-indigo-300 leading-relaxed">
                          {prop.rationale}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {prop.imageUrl && (
                        <div className="h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                          <img src={prop.imageUrl} alt="Ilustrasi" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-[11px]">
                        <div><strong>Kategori:</strong> {prop.category}</div>
                        <div><strong>Satuan Metrik:</strong> {prop.impactMetricUnit}</div>
                        <div><strong>Tipe Bukti:</strong> {prop.suggestedEvidenceType}</div>
                        <div><strong>Pengusul:</strong> {prop.proposedByName} ({prop.proposedByEmail})</div>
                      </div>
                    </div>
                  </div>

                  {/* Review Actions for Pending or Revision */}
                  {prop.status === 'Pending' && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder="Catatan feedback / alasan persetujuan atau revisi..."
                          value={feedbackText[prop.id] || ''}
                          onChange={e => setFeedbackText({ ...feedbackText, [prop.id]: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRejectProposal(prop.id)}
                          icon={<XCircle className="w-4 h-4 text-rose-600" />}
                        >
                          Tolak
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRequestRevision(prop.id)}
                          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
                        >
                          Minta Revisi
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openProposalReviewModal(prop)}
                          icon={<BookOpen className="w-4 h-4" />}
                        >
                          Review & Setujui
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Existing Admin Feedback if already reviewed */}
                  {prop.adminFeedback && (
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300">
                      <strong>Catatan Auditor:</strong> {prop.adminFeedback} (Direview pada {prop.reviewedAt} oleh {prop.reviewedBy})
                    </div>
                  )}
                </BaseCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Create / Edit Action Modal */}
      {isEditModalOpen && editingAction && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          maxWidth="lg"
          title={editingAction.id ? `Edit Inisiatif Aksi: ${editingAction.id}` : 'Tambah Inisiatif Aksi Baru'}
        >
          <form onSubmit={handleSaveAction} className="space-y-4 text-left">
            {/* Auto Synchronized Category Selection */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Kategori Master ESG (Otomatis Sinkronisasi EN & ID) *
                </label>
                <span className="text-[11px] text-slate-400">Pilih master kategori untuk auto-fill metrik & standar</span>
              </div>

              <select
                value={editingAction.categoryId || editingAction.category || cats[0]?.nameId || ''}
                onChange={e => handleCategorySelect(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
              >
                {cats.map(cat => (
                  <option key={cat.id} value={cat.nameId}>
                    [{cat.pillar}] {cat.nameId} — {cat.nameEn}
                  </option>
                ))}
              </select>

              {/* Framework and SG-PTS Preview for this category */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2 text-xs">
                <EsgFrameworkBadge
                  categoryName={editingAction.category || editingAction.categoryId}
                  points={editingAction.points || 100}
                />
                <span className="text-[11px] text-slate-500">
                  Kategori ID: <strong className="text-slate-700 dark:text-slate-300">{editingAction.categoryId}</strong> | EN: <strong className="text-slate-700 dark:text-slate-300">{editingAction.category}</strong>
                </span>
              </div>
            </div>

            {/* Title Inputs: ID and EN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Judul Aksi (Bahasa Indonesia) *
                </label>
                <Input
                  required
                  placeholder="cth: Penggantian Lampu LED Efisiensi Tinggi"
                  value={editingAction.titleId || ''}
                  onChange={e => setEditingAction({ ...editingAction, titleId: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Judul Aksi (English)
                </label>
                <Input
                  placeholder="e.g. High-Efficiency LED Lighting Retrofit"
                  value={editingAction.title || ''}
                  onChange={e => setEditingAction({ ...editingAction, title: e.target.value })}
                />
              </div>
            </div>

            {/* Pillar, Difficulty, and Points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilar ESG *</label>
                <Select
                  value={editingAction.pillar || 'E'}
                  onChange={e => setEditingAction({ ...editingAction, pillar: e.target.value as ESGPillar })}
                  options={[
                    { value: 'E', label: 'E - Lingkungan (Environmental)' },
                    { value: 'S', label: 'S - Sosial & K3 (Social)' },
                    { value: 'G', label: 'G - Tata Kelola & Etika (Governance)' },
                  ]}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tingkat Kesulitan</label>
                <Select
                  value={editingAction.difficulty || 'Starter'}
                  onChange={e => setEditingAction({ ...editingAction, difficulty: e.target.value as any })}
                  options={MASTER_DIFFICULTIES.map(d => ({ value: d.value, label: `${d.labelId}` }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Poin (SG-PTS Siloam) *
                </label>
                <Input
                  type="number"
                  min="10"
                  max="1000"
                  value={editingAction.points || 100}
                  onChange={e => setEditingAction({ ...editingAction, points: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Description: ID and EN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Deskripsi Inisiatif (Bahasa Indonesia) *
                </label>
                <TextArea
                  required
                  rows={2}
                  placeholder="Penjelasan langkah kerja dan tujuan inisiatif..."
                  value={editingAction.descriptionId || ''}
                  onChange={e => setEditingAction({ ...editingAction, descriptionId: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Deskripsi Inisiatif (English)
                </label>
                <TextArea
                  rows={2}
                  placeholder="Operational scope and sustainability objectives..."
                  value={editingAction.description || ''}
                  onChange={e => setEditingAction({ ...editingAction, description: e.target.value })}
                />
              </div>
            </div>

            {/* Practical Tips Editor (ID & EN) */}
            <PracticalTipsEditor
              tipsId={editingAction.practicalTipsId || []}
              tipsEn={editingAction.practicalTips || []}
              onChange={(tId, tEn) => setEditingAction({ ...editingAction, practicalTipsId: tId, practicalTips: tEn })}
              onLoadCategoryDefaults={() => {
                const match = findMasterCategory(editingAction.category || editingAction.categoryId || '');
                if (match) {
                  setEditingAction({
                    ...editingAction,
                    practicalTipsId: match.defaultTipsId,
                    practicalTips: match.defaultTipsEn,
                  });
                }
              }}
              categoryName={editingAction.categoryId || editingAction.category}
            />

            {/* Impact Metric & Evidence */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Satuan Metrik (ID / EN)
                </label>
                <Input
                  required
                  placeholder="cth: kWh Listrik Terhemat / thn"
                  value={editingAction.impactMetricUnitId || editingAction.impactMetricUnit || ''}
                  onChange={e => setEditingAction({ ...editingAction, impactMetricUnitId: e.target.value, impactMetricUnit: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tipe Bukti Audit</label>
                <Select
                  value={editingAction.requiredEvidenceType || 'both'}
                  onChange={e => setEditingAction({ ...editingAction, requiredEvidenceType: e.target.value as any })}
                  options={MASTER_EVIDENCE_TYPES.map(m => ({ value: m.value, label: m.labelId }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Preset Ilustrasi Gambar</label>
                <Select
                  value={editingAction.imageUrl || PRESET_IMAGES[0].url}
                  onChange={e => setEditingAction({ ...editingAction, imageUrl: e.target.value })}
                  options={PRESET_IMAGES.map(img => ({ value: img.url, label: img.label }))}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button variant="ghost" size="md" type="button" onClick={() => setIsEditModalOpen(false)}>
                Batal
              </Button>
              <Button variant="primary" size="md" type="submit">
                Simpan Inisiatif Aksi
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: Review, Edit & Approve Partner Proposal */}
      {reviewingProposal && (
        <Modal
          isOpen={!!reviewingProposal}
          onClose={() => setReviewingProposal(null)}
          maxWidth="lg"
          title={`Review & Validasi Usulan: ${reviewingProposal.vendorName}`}
        >
          <div className="space-y-4 text-left">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/40 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong>Pengusul: {reviewingProposal.vendorName} ({reviewingProposal.proposedByName})</strong>
                <p className="mt-0.5 text-indigo-900/80 dark:text-indigo-300">
                  Alasan mitra: "{reviewingProposal.rationale}"
                </p>
              </div>
            </div>

            {/* Category Dropdown (Auto Sync) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilih Master Kategori ESG (Otomatis Sinkronisasi)
              </label>
              <select
                value={proposalReviewForm.categoryId || cats[0]?.nameId || ''}
                onChange={e => handleProposalCategorySelect(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold"
              >
                {cats.map(cat => (
                  <option key={cat.id} value={cat.nameId}>
                    [{cat.pillar}] {cat.nameId} — {cat.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Title Inputs: ID and EN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Judul Inisiatif (Bahasa Indonesia) *</label>
                <Input
                  value={proposalReviewForm.titleId || ''}
                  onChange={e => setProposalReviewForm({ ...proposalReviewForm, titleId: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Judul Inisiatif (English)</label>
                <Input
                  value={proposalReviewForm.title || ''}
                  onChange={e => setProposalReviewForm({ ...proposalReviewForm, title: e.target.value })}
                />
              </div>
            </div>

            {/* Practical Tips Editor for Proposal */}
            <PracticalTipsEditor
              tipsId={proposalReviewForm.practicalTipsId || []}
              tipsEn={proposalReviewForm.practicalTips || []}
              onChange={(tId, tEn) => setProposalReviewForm({ ...proposalReviewForm, practicalTipsId: tId, practicalTips: tEn })}
              onLoadCategoryDefaults={() => {
                const match = findMasterCategory(proposalReviewForm.category || proposalReviewForm.categoryId || '');
                if (match) {
                  setProposalReviewForm(prev => ({
                    ...prev,
                    practicalTipsId: match.defaultTipsId,
                    practicalTips: match.defaultTipsEn,
                  }));
                }
              }}
              categoryName={proposalReviewForm.categoryId || proposalReviewForm.category}
            />

            {/* Points & Standard Alignment Preview */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200">Bobot Poin SG-PTS Siloam:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="10"
                    max="1000"
                    className="w-24"
                    value={proposalReviewForm.points || 100}
                    onChange={e => setProposalReviewForm({ ...proposalReviewForm, points: Number(e.target.value) })}
                  />
                  <span className="text-emerald-600 font-bold">PTS</span>
                </div>
              </div>

              <EsgFrameworkBadge
                categoryName={proposalReviewForm.category || proposalReviewForm.categoryId}
                points={proposalReviewForm.points}
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button variant="ghost" size="md" onClick={() => setReviewingProposal(null)}>
                Batal
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmApproveProposal}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Setujui & Publikasikan ke Katalog
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: Excel Import Modal */}
      {isImportModalOpen && (
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          maxWidth="lg"
          title="Upload & Import Katalog Aksi ESG via Excel"
        >
          <div className="space-y-4 text-left">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>Format File Didukung: .xlsx, .xls, .csv</strong>
                <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                  Pastikan kolom sesuai template. Anda dapat mengunduh format contoh dengan tombol "Download Template".
                </p>
              </div>
            </div>

            {/* Drag & Drop or File Input */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer block">
                Pilih file Excel (.xlsx / .csv) dari komputer Anda
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-1">Atau unduh template resmi di bawah ini</p>
              <button
                type="button"
                onClick={downloadActionCatalogTemplate}
                className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 underline cursor-pointer"
              >
                Unduh Template Excel Kosong
              </button>
            </div>

            {/* Error alerts */}
            {importErrors.length > 0 && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                <strong>Ditemukan Masalah pada Data:</strong>
                <ul className="list-disc list-inside">
                  {importErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview Parsed Rows */}
            {importedPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Preview Data Siap Diimpor ({importedPreview.length} Baris):
                  </span>
                  <span className="text-emerald-600 font-semibold">Semua Kolom Tervalidasi</span>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                  {importedPreview.slice(0, 5).map((row, idx) => (
                    <div key={idx} className="p-2 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <strong className="text-slate-800 dark:text-slate-200 block">{row.titleId || row.title}</strong>
                        <span className="text-[10px] text-slate-400">{row.pillar} • {row.categoryId || row.category} • +{row.points} PTS</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">Valid</span>
                    </div>
                  ))}
                  {importedPreview.length > 5 && (
                    <div className="p-2 text-center text-slate-400 text-[11px]">
                      ... dan {importedPreview.length - 5} baris lainnya
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button variant="ghost" size="md" onClick={() => setIsImportModalOpen(false)}>
                Batal
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={importedPreview.length === 0}
                isLoading={isProcessingImport}
                onClick={handleConfirmImport}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Konfirmasi & Impor {importedPreview.length} Inisiatif
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
