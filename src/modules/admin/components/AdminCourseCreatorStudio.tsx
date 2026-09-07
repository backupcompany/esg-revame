import React, { useState, useEffect } from 'react';
import { PLACEHOLDER_IMAGE } from '../../../core/ui/assets';
import { learnService } from '../../../core/services/learnService';
import { actionService } from '../../../core/services/actionService';
import { LearningModule, Lesson, ESGPillar, ESGAction } from '../../../core/types';
import { BaseCard } from '../../../core/ui/Cards';
import { Button } from '../../../core/ui/Button';
import { Input, TextArea } from '../../../core/ui/Form';
import { PillarBadge } from '../../../core/ui/Badges';
import { LessonPlayerModal } from '../../learn/components/LessonPlayerModal';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  BookOpen,
  Layers,
  Clock,
  Award,
  Image as ImageIcon,
  HelpCircle,
  Lightbulb,
  Compass,
  FileText,
  AlertCircle,
  Link,
  Check,
  Zap,
  Target,
  Camera
} from 'lucide-react';

export const AdminCourseCreatorStudio: React.FC = () => {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [actions, setActions] = useState<ESGAction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [isMatchingActions, setIsMatchingActions] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // AI Action Matching & Suggestion Results
  const [aiActionMatches, setAiActionMatches] = useState<{
    matchedExistingActionIds?: string[];
    matchedExistingActions: ESGAction[];
    suggestedNewActions: ESGAction[];
    matchReasoning?: string;
  } | null>(null);

  // AI Prompt Inputs
  const [aiTopic, setAiTopic] = useState<string>('');
  const [aiIndustry, setAiIndustry] = useState<string>('');
  const [aiPillar, setAiPillar] = useState<ESGPillar>('E');

  // Active Editing Course Form
  const [editingModule, setEditingModule] = useState<LearningModule | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Test Run / Preview Player state
  const [previewModule, setPreviewModule] = useState<LearningModule | null>(null);
  const [previewLessonIndex, setPreviewLessonIndex] = useState<number>(0);
  const [previewSelectedOption, setPreviewSelectedOption] = useState<number | null>(null);
  const [previewIsAnswerSubmitted, setPreviewIsAnswerSubmitted] = useState<boolean>(false);
  const [previewIsCorrect, setPreviewIsCorrect] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [modData, actData] = await Promise.all([
        learnService.getAllModules(),
        actionService.getActions()
      ]);
      setModules(modData);
      setActions(actData);
    } catch (err) {
      console.error('Error loading admin course studio data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) return;
    setIsGeneratingAI(true);
    setIsMatchingActions(true);
    try {
      // Step 1: Generate comprehensive PLANS course
      const courseResult = await learnService.generateCourseWithAI({
        topic: aiTopic,
        industry: aiIndustry,
        pillar: aiPillar
      });

      // Step 2: Concurrently / sequentially match or create actionable initiatives
      let actionResult = null;
      let matchedExisting: ESGAction[] = [];
      try {
        actionResult = await learnService.matchOrCreateActionsWithAI({
          topic: aiTopic,
          industry: aiIndustry,
          pillar: aiPillar,
          existingActions: actions
        });
        if (actionResult?.matchedExistingActionIds) {
          matchedExisting = actions.filter(a => actionResult.matchedExistingActionIds.includes(a.id));
        }
        setAiActionMatches({
          matchedExistingActionIds: actionResult?.matchedExistingActionIds || [],
          matchedExistingActions: matchedExisting,
          suggestedNewActions: actionResult?.suggestedNewActions || [],
          matchReasoning: actionResult?.matchReasoning
        });
      } catch (actErr) {
        console.warn('Action matching note:', actErr);
      }

      const linkedIds: string[] = matchedExisting.map(a => a.id);
      const primaryLinkedAction = matchedExisting[0];

      const newModule: LearningModule = {
        id: `mod_${Date.now()}`,
        title: courseResult.title || aiTopic,
        titleId: courseResult.titleId || aiTopic,
        pillar: courseResult.pillar || aiPillar,
        durationMinutes: courseResult.durationMinutes || (courseResult.lessons ? courseResult.lessons.length : 6),
        points: courseResult.points || (courseResult.lessons ? courseResult.lessons.length * 20 : 120),
        description: courseResult.description || 'Bite-sized micro-learning module.',
        descriptionId: courseResult.descriptionId || 'Panduan mikro praktis operasional berbasis kerangka PLANS.',
        backgroundProblem: courseResult.backgroundProblem,
        esgBenefit: courseResult.esgBenefit,
        badgeIcon: 'Sparkles',
        completed: false,
        levelRequired: 1,
        linkedActionId: primaryLinkedAction ? primaryLinkedAction.id : undefined,
        linkedActionTitle: primaryLinkedAction ? (primaryLinkedAction.titleId || primaryLinkedAction.title) : undefined,
        linkedActionIds: linkedIds,
        coverImageUrl:
          courseResult.coverImageUrl ||
          PLACEHOLDER_IMAGE,
        industrySector: courseResult.industrySector || aiIndustry,
        difficulty: (courseResult.difficulty as any) || 'Starter',
        author: 'Siloam ESG Academy',
        status: 'published',
        lessons: courseResult.lessons && courseResult.lessons.length > 0 ? (courseResult.lessons as Lesson[]) : [
          {
            id: 'bite_1',
            title: 'Langkah 1 (P - Pioneer Basics): Identifikasi Titik Kritis',
            textContent: `Dalam operasional sehari-hari, langkah pertama penerapan **Pilar ${aiPillar}** adalah mengenali titik kritis pemborosan dan risiko di fasilitas kerja.

Poin penting yang wajib diperhatikan:
- **Observasi Langsung:** Lakukan inspeksi visual pada alur kerja utama tim.
- **Pencatatan Awal:** Dokumentasikan baseline data harian secara konsisten.
- **Edukasi Tim:** Pastikan setiap staf memahami dampak langsung terhadap standar Siloam Hospitals.`,
            example: 'Contoh Lapangan: Lakukan audit sederhana setiap awal shift untuk mencatat volume limbah atau kepatuhan K3.',
            quiz: {
              question: 'Apa tindakan awal paling mendasar dalam menerapkan kerangka PLANS?',
              options: [
                'Mengenali titik kritis masalah dan mencatat baseline data operasional',
                'Membeli peralatan canggih tanpa perencanaan',
                'Menunggu instruksi tanpa inisiatif tim',
                'Mengabaikan pencatatan data lapangan'
              ],
              correctAnswerIndex: 0,
              explanation: 'Pemetaan awal (Pioneer) memberikan gambaran akurat sebelum menyusun rencana aksi perbaikan.'
            }
          }
        ]
      };

      setEditingModule(newModule);
      setIsFormOpen(true);
      setSuccessMessage('✨ Kursus PLANS & Pemetaan Aksi ESG berhasil disusun oleh AI! Silakan review dan sesuaikan.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error generating course:', err);
    } finally {
      setIsGeneratingAI(false);
      setIsMatchingActions(false);
    }
  };

  const handleCreateNewBlank = () => {
    const blank: LearningModule = {
      id: `mod_${Date.now()}`,
      title: 'Judul Kursus Baru (English)',
      titleId: 'Judul Kursus Baru (Bahasa Indonesia)',
      pillar: 'E',
      durationMinutes: 4,
      points: 75,
      description: 'Deskripsi singkat kursus dalam Bahasa Inggris.',
      descriptionId: 'Deskripsi singkat kursus dalam Bahasa Indonesia.',
      badgeIcon: 'BookOpen',
      completed: false,
      levelRequired: 1,
      linkedActionIds: [],
      coverImageUrl: PLACEHOLDER_IMAGE,
      industrySector: 'General Services',
      difficulty: 'Starter',
      author: 'Siloam ESG Academy',
      status: 'published',
      lessons: [
        {
          id: `bite_${Date.now()}_1`,
          title: 'Bite 1: Pengantar & Masalah Utama',
          textContent: 'Tuliskan penjelasan materi yang padat dan mudah dipahami dengan format Markdown.',
          example: 'Contoh kasus nyata di lapangan...',
          mediaUrl: PLACEHOLDER_IMAGE,
          quiz: {
            question: 'Pertanyaan post-test singkat untuk menguji pemahaman?',
            options: ['Opsi A', 'Opsi B (Kunci Benar)', 'Opsi C', 'Opsi D'],
            correctAnswerIndex: 1,
            explanation: 'Penjelasan mengapa jawaban ini tepat.'
          }
        }
      ]
    };
    setEditingModule(blank);
    setAiActionMatches(null);
    setIsFormOpen(true);
  };

  const handleAddSuggestedActionToCatalog = async (suggested: ESGAction) => {
    if (!editingModule) return;
    try {
      const savedAction = await actionService.createOrUpdateAction(suggested);
      const updatedActions = await actionService.getActions();
      setActions(updatedActions);

      const currentLinked = editingModule.linkedActionIds ? [...editingModule.linkedActionIds] : [];
      if (!currentLinked.includes(savedAction.id)) {
        currentLinked.push(savedAction.id);
      }

      setEditingModule({
        ...editingModule,
        linkedActionId: editingModule.linkedActionId || savedAction.id,
        linkedActionTitle: editingModule.linkedActionTitle || (savedAction.titleId || savedAction.title),
        linkedActionIds: currentLinked
      });

      // Remove from suggested list
      if (aiActionMatches) {
        setAiActionMatches({
          ...aiActionMatches,
          suggestedNewActions: aiActionMatches.suggestedNewActions.filter(a => a.id !== suggested.id),
          matchedExistingActions: [...aiActionMatches.matchedExistingActions, savedAction]
        });
      }

      setSuccessMessage(`✅ Inisiatif "${savedAction.titleId || savedAction.title}" berhasil ditambahkan ke Katalog Aksi & ditautkan!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error saving suggested action:', err);
    }
  };

  const handleToggleLinkAction = (actId: string) => {
    if (!editingModule) return;
    const currentLinked = editingModule.linkedActionIds ? [...editingModule.linkedActionIds] : [];
    let updated: string[];
    if (currentLinked.includes(actId)) {
      updated = currentLinked.filter(id => id !== actId);
    } else {
      updated = [...currentLinked, actId];
    }
    const act = actions.find(a => a.id === actId);
    setEditingModule({
      ...editingModule,
      linkedActionId: updated.length > 0 ? updated[0] : undefined,
      linkedActionTitle: updated.length > 0 && act ? (act.titleId || act.title) : undefined,
      linkedActionIds: updated
    });
  };

  const handleSaveModule = async () => {
    if (!editingModule) return;
    try {
      await learnService.saveModule(editingModule);
      await loadData();
      setIsFormOpen(false);
      setEditingModule(null);
      setSuccessMessage('✅ Modul pembelajaran berhasil disimpan dan dipublikasikan!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error saving module:', err);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!window.confirm('Hapus modul pembelajaran ini?')) return;
    try {
      await learnService.deleteModule(id);
      await loadData();
      setSuccessMessage('🗑️ Modul pembelajaran berhasil dihapus.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error deleting module:', err);
    }
  };

  // Lesson Slice Helpers
  const handleAddLessonBite = () => {
    if (!editingModule) return;
    const newLesson: Lesson = {
      id: `bite_${Date.now()}`,
      title: `Bite ${editingModule.lessons.length + 1}: Langkah Tambahan`,
      textContent: 'Jelaskan poin takeaway esensial dengan bullet points dan contoh nyata.',
      example: 'Contoh nyata di lingkungan operasional mitra...',
      mediaUrl: PLACEHOLDER_IMAGE,
      quiz: {
        question: 'Pertanyaan post-test kuis?',
        options: ['Pilihan 1', 'Pilihan 2 (Benar)', 'Pilihan 3', 'Pilihan 4'],
        correctAnswerIndex: 1,
        explanation: 'Penjelasan kunci jawaban.'
      }
    };
    setEditingModule({
      ...editingModule,
      lessons: [...editingModule.lessons, newLesson]
    });
  };

  const handleRemoveLessonBite = (idx: number) => {
    if (!editingModule) return;
    if (editingModule.lessons.length <= 1) {
      alert('Modul harus memiliki minimal 1 materi bite!');
      return;
    }
    const updated = [...editingModule.lessons];
    updated.splice(idx, 1);
    setEditingModule({ ...editingModule, lessons: updated });
  };

  const handleUpdateLessonField = (idx: number, field: keyof Lesson, value: any) => {
    if (!editingModule) return;
    const updated = [...editingModule.lessons];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditingModule({ ...editingModule, lessons: updated });
  };

  const handleUpdateQuizField = (idx: number, field: string, value: any) => {
    if (!editingModule) return;
    const updated = [...editingModule.lessons];
    updated[idx] = {
      ...updated[idx],
      quiz: { ...updated[idx].quiz, [field]: value }
    };
    setEditingModule({ ...editingModule, lessons: updated });
  };

  const handleUpdateQuizOption = (lessonIdx: number, optIdx: number, val: string) => {
    if (!editingModule) return;
    const updated = [...editingModule.lessons];
    const opts = [...updated[lessonIdx].quiz.options];
    opts[optIdx] = val;
    updated[lessonIdx] = {
      ...updated[lessonIdx],
      quiz: { ...updated[lessonIdx].quiz, options: opts }
    };
    setEditingModule({ ...editingModule, lessons: updated });
  };

  // Preview / Test Run handlers
  const handleStartTestRun = (mod: LearningModule) => {
    setPreviewModule(mod);
    setPreviewLessonIndex(0);
    setPreviewSelectedOption(null);
    setPreviewIsAnswerSubmitted(false);
  };

  const handlePreviewSelectOption = (idx: number) => {
    if (!previewModule) return;
    const cur = previewModule.lessons[previewLessonIndex];
    setPreviewSelectedOption(idx);
    setPreviewIsCorrect(idx === cur.quiz.correctAnswerIndex);
    setPreviewIsAnswerSubmitted(true);
  };

  const handlePreviewNext = () => {
    if (!previewModule) return;
    if (previewLessonIndex < previewModule.lessons.length - 1) {
      setPreviewLessonIndex(prev => prev + 1);
      setPreviewSelectedOption(null);
      setPreviewIsAnswerSubmitted(false);
    } else {
      alert('🎉 Uji Coba Kursus Selesai! Seluruh alur slide dan kuis berjalan dengan baik.');
      setPreviewModule(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Toast Notification */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 rounded-xl border border-emerald-300 dark:border-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* AI Course Creator Studio Panel */}
      <BaseCard padding="lg" className="border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1 w-fit">
                <Sparkles className="w-3.5 h-3.5" /> AI Micro-Learning Studio (Gemini 3.7)
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Buat Konten Kursus & Kuis Micro-Learning dengan AI
              </h2>
              <p className="text-xs text-slate-500 max-w-2xl">
                Cukup masukkan tema atau isu spesifik vendor, AI akan langsung menyusun materi bite-sized dwibahasa, contoh kasus nyata di lapangan, serta soal kuis interaktif secara instan.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleCreateNewBlank}
            >
              Buat Manual (Kosong)
            </Button>
          </div>

          {/* AI Generator Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Topik / Masalah Operasional yang Ingin Diangkat:
              </label>
              <Input
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
                placeholder="Contoh: Pengelolaan Limbah Makanan Katering RS / Efisiensi Rute Logistik"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Target Sektor Industri:
              </label>
              <select
                value={aiIndustry}
                onChange={e => setAiIndustry(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="Food & Catering">🍽️ Food & Catering (Katering)</option>
                <option value="Logistics & Fleet">🚚 Logistics & Fleet (Armada)</option>
                <option value="Facility & Cleaning">🧹 Facility & Cleaning (Kebersihan)</option>
                <option value="IT & Professional">💻 IT & Professional (Kantor)</option>
                <option value="Healthcare Supplies">🏥 Healthcare & MedTech</option>
                <option value="General Services">🏢 General Services (Umum)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilar ESG Target:
              </label>
              <select
                value={aiPillar}
                onChange={e => setAiPillar(e.target.value as ESGPillar)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="E">🌿 Pilar E (Lingkungan / Environment)</option>
                <option value="S">🤝 Pilar S (Sosial / K3 / Social)</option>
                <option value="G">⚖️ Pilar G (Tata Kelola / Governance)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-800/80 mt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
                Framework PLANS
              </span>
              <span>AI menyusun struktur penuh: <strong>P</strong>ioneer, <strong>L</strong>ocate, <strong>A</strong>ction, <strong>N</strong>avigate, <strong>S</strong>cale (5-10 kalimat/bite + Markdown).</span>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={isGeneratingAI ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
              disabled={isGeneratingAI || !aiTopic.trim()}
              onClick={handleGenerateAI}
              className="bg-indigo-600 hover:bg-indigo-700 font-extrabold shadow-sm shrink-0"
            >
              {isGeneratingAI ? 'Menyusun Kursus Lengkap PLANS...' : '✨ Generate Kursus PLANS dengan AI'}
            </Button>
          </div>
        </div>
      </BaseCard>

      {/* Editor Modal / Drawer */}
      {isFormOpen && editingModule && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-xl space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Editor Modul Pembelajaran Mikro
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Eye className="w-4 h-4 text-emerald-600" />}
                onClick={() => handleStartTestRun(editingModule)}
              >
                Uji Coba Tampilan (Preview)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsFormOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleSaveModule}
              >
                Simpan & Publikasikan
              </Button>
            </div>
          </div>

          {/* Core Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Judul Modul (Bahasa Indonesia):
              </label>
              <Input
                value={editingModule.titleId || editingModule.title}
                onChange={e => setEditingModule({ ...editingModule, titleId: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Judul Modul (English):
              </label>
              <Input
                value={editingModule.title}
                onChange={e => setEditingModule({ ...editingModule, title: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilar ESG Modul:
              </label>
              <select
                value={editingModule.pillar}
                onChange={e => setEditingModule({ ...editingModule, pillar: e.target.value as ESGPillar })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="E">🌿 Pilar E (Lingkungan / Environment)</option>
                <option value="S">🤝 Pilar S (Sosial / K3 / Social)</option>
                <option value="G">⚖️ Pilar G (Tata Kelola / Governance)</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Deskripsi Singkat (Bahasa Indonesia):
              </label>
              <TextArea
                rows={2}
                value={editingModule.descriptionId || editingModule.description}
                onChange={e => setEditingModule({ ...editingModule, descriptionId: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                URL Cover Gambar:
              </label>
              <Input
                value={editingModule.coverImageUrl || ''}
                onChange={e => setEditingModule({ ...editingModule, coverImageUrl: e.target.value })}
                placeholder={PLACEHOLDER_IMAGE}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Durasi (Menit):
                </label>
                <Input
                  type="number"
                  value={editingModule.durationMinutes}
                  onChange={e => setEditingModule({ ...editingModule, durationMinutes: Number(e.target.value) })}
                />
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Reward SG-PTS:
                </label>
                <Input
                  type="number"
                  value={editingModule.points}
                  onChange={e => setEditingModule({ ...editingModule, points: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* AI Actions Connector Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-slate-50 to-emerald-50/50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-emerald-950/20 border border-indigo-200/80 dark:border-indigo-900/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Konektor Aksi ESG Lapangan (Linked Action Initiatives)
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                      {editingModule.linkedActionIds?.length || (editingModule.linkedActionId ? 1 : 0)} Terhubung
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Setelah vendor menyelesaikan materi ini, mereka dapat langsung mengambil inisiatif aksi terkait di lingkungan operasional perusahaannya.
                  </p>
                </div>
              </div>

              {/* On-demand AI Match Action Button */}
              <Button
                variant="outline"
                size="sm"
                icon={isMatchingActions ? <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
                disabled={isMatchingActions}
                onClick={async () => {
                  setIsMatchingActions(true);
                  try {
                    const res = await learnService.matchOrCreateActionsWithAI({
                      topic: editingModule.titleId || editingModule.title,
                      industry: editingModule.industrySector || 'Food & Catering',
                      pillar: editingModule.pillar,
                      existingActions: actions
                    });
                    const matched = actions.filter(a => res.matchedExistingActionIds?.includes(a.id));
                    setAiActionMatches({
                      matchedExistingActionIds: res.matchedExistingActionIds || [],
                      matchedExistingActions: matched,
                      suggestedNewActions: res.suggestedNewActions || [],
                      matchReasoning: res.matchReasoning
                    });
                  } catch (e) {
                    console.error('Error on-demand matching actions:', e);
                  } finally {
                    setIsMatchingActions(false);
                  }
                }}
              >
                {isMatchingActions ? 'Menganalisis Aksi...' : '✨ Analisis Aksi dengan AI'}
              </Button>
            </div>

            {/* Currently Linked Action Badges */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Inisiatif yang Tertaut:</span>
                <span className="text-[11px] font-normal text-slate-500">Klik chip untuk menghapus / menambahkan tautan</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {actions.map(act => {
                  const isLinked = editingModule.linkedActionIds?.includes(act.id) || editingModule.linkedActionId === act.id;
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => handleToggleLinkAction(act.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isLinked
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      <span className={`px-1 py-0.2 rounded text-[9px] font-black ${
                        isLinked ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {act.pillar}
                      </span>
                      <span className="truncate max-w-[200px] sm:max-w-xs">{act.titleId || act.title}</span>
                      {isLinked ? (
                        <Check className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Suggested Initiatives Box */}
            {aiActionMatches && aiActionMatches.suggestedNewActions && aiActionMatches.suggestedNewActions.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 text-xs font-black">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Saran Inisiatif Baru dari AI (Belum Ada di Katalog Aksi):</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {aiActionMatches.suggestedNewActions.map(sug => (
                    <div
                      key={sug.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 shadow-xs space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] mr-1.5">
                            Pilar {sug.pillar}
                          </span>
                          <strong className="text-slate-900 dark:text-slate-100">{sug.titleId || sug.title}</strong>
                        </div>
                        <span className="shrink-0 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                          +{sug.points} PTS
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {sug.descriptionId || sug.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500">
                          Target: <strong>{sug.impactMetricUnitId || sug.impactMetricUnit}</strong> (~{sug.estimatedDays} hari)
                        </span>

                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Plus className="w-3.5 h-3.5" />}
                          onClick={() => handleAddSuggestedActionToCatalog(sug)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-[11px] py-1 h-auto"
                        >
                          Tambah ke Katalog & Tautkan
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Micro-Bite Lessons List */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Daftar Slide Micro-Bites ({editingModule.lessons.length} Materi + Kuis)
                </h4>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleAddLessonBite}
              >
                Tambah Slide Bite
              </Button>
            </div>

            <div className="space-y-5">
              {editingModule.lessons.map((lesson, idx) => (
                <div
                  key={lesson.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs">
                      Slide Bite #{idx + 1}
                    </span>

                    <button
                      onClick={() => handleRemoveLessonBite(idx)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus Bite
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Judul Slide Bite:
                      </label>
                      <Input
                        value={lesson.title}
                        onChange={e => handleUpdateLessonField(idx, 'title', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        URL Gambar Slide:
                      </label>
                      <Input
                        value={lesson.mediaUrl || ''}
                        onChange={e => handleUpdateLessonField(idx, 'mediaUrl', e.target.value)}
                        placeholder={PLACEHOLDER_IMAGE}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Isi Materi Edukasi (5-10 Kalimat, Mendukung Format Markdown / Bold / List):
                      </label>
                      <TextArea
                        rows={6}
                        value={lesson.textContent}
                        onChange={e => handleUpdateLessonField(idx, 'textContent', e.target.value)}
                        placeholder="Uraikan materi esensial secara jelas dengan paragraf, poin bullet, dan penekanan bold..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Contoh Kasus & Panduan Lapangan:
                      </label>
                      <TextArea
                        rows={3}
                        value={lesson.example}
                        onChange={e => handleUpdateLessonField(idx, 'example', e.target.value)}
                        placeholder="Contoh implementasi spesifik vendor di Siloam Hospitals..."
                      />
                    </div>
                  </div>

                  {/* Post-Test Quiz Section */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" /> Post-Test Kuis Singkat
                    </span>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Pertanyaan Kuis:
                      </label>
                      <Input
                        value={lesson.quiz.question}
                        onChange={e => handleUpdateQuizField(idx, 'question', e.target.value)}
                      />
                    </div>

                    {/* Options Grid */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        4 Pilihan Jawaban (Tandai radio button untuk Kunci Jawaban Benar):
                      </label>
                      {lesson.quiz.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct_${idx}`}
                            checked={lesson.quiz.correctAnswerIndex === optIdx}
                            onChange={() => handleUpdateQuizField(idx, 'correctAnswerIndex', optIdx)}
                            className="cursor-pointer text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-xs font-bold text-slate-400 w-5">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={e => handleUpdateQuizOption(idx, optIdx, e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Penjelasan Pembahasan Kunci Jawaban:
                      </label>
                      <Input
                        value={lesson.quiz.explanation}
                        onChange={e => handleUpdateQuizField(idx, 'explanation', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Published Courses Management List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Katalog Modul Micro-Learning Aktif ({modules.length} Kursus)
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(mod => (
            <BaseCard key={mod.id} padding="none" className="overflow-hidden flex flex-col justify-between border border-slate-200 dark:border-slate-800">
              <div className="relative h-32 w-full overflow-hidden bg-slate-950">
                <img
                  src={mod.coverImageUrl}
                  alt={mod.title}
                  className="w-full h-full object-cover opacity-85"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                <div className="absolute top-2 left-2 flex items-center gap-2">
                  <PillarBadge pillar={mod.pillar} />
                  <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-white text-[10px] font-bold">
                    {mod.industrySector || 'Umum'}
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] font-bold">
                  <span>+{mod.points} SG-PTS</span>
                    <span>{mod.lessonCount ?? mod.lessons.length} Bites</span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {mod.titleId || mod.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {mod.descriptionId || mod.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                  <button
                    onClick={() => handleStartTestRun(mod)}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingModule(mod);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteModule(mod.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </BaseCard>
          ))}
        </div>
      </div>

      {/* Test Run / Preview Player Modal */}
      <LessonPlayerModal
        module={previewModule}
        lessonIndex={previewLessonIndex}
        selectedOption={previewSelectedOption}
        isAnswerSubmitted={previewIsAnswerSubmitted}
        isCorrect={previewIsCorrect}
        onSelectOption={handlePreviewSelectOption}
        onNext={handlePreviewNext}
        onPrev={() => setPreviewLessonIndex(prev => Math.max(0, prev - 1))}
        onClose={() => setPreviewModule(null)}
      />
    </div>
  );
};
